import { Router, Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import archiver from "archiver";
import { useDatabase } from "../services/ddbb";
import { deleteFile, saveFile } from "../services/files";
import multer from "multer";
import path from "path";
import sharp from "sharp";
import FileModel, { IFile } from "../models/file";
import { deleteFileFromCloudinary, uploadFileToCloudinary } from "../services/useCloudinary";
import { compressImage, convertToWebp } from "../services/images";
import ChallengeModel, { IChallenge } from "../models/challenge";
import { authenticateUser } from "../services/auth";
import { logger } from "../services/logger";
import { emitToEvent } from "../services/sseEmitter";

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']);
const ALLOWED_VIDEO_TYPES = new Set(['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo']);
const MAX_IMAGE_SIZE = 20 * 1024 * 1024;
const MAX_VIDEO_SIZE = 200 * 1024 * 1024;

const router = Router();
const folder = path.join(__dirname, '../buckets/images/');
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_VIDEO_SIZE },
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_IMAGE_TYPES.has(file.mimetype) || ALLOWED_VIDEO_TYPES.has(file.mimetype)) cb(null, true);
        else cb(new Error(`File type not allowed: ${file.mimetype}`));
    }
});

const isVideoMime = (mime: string) => ALLOWED_VIDEO_TYPES.has(mime);

const videoThumbnailUrl = (videoUrl: string): string =>
    videoUrl.replace('/video/upload/', '/video/upload/f_jpg,so_0,w_400,h_400,c_fill/').replace(/\.[^/.]+$/, '.jpg');

type Participant = IChallenge['participants'][number];

const sendError = (res: Response, status: number, message: string) => {
    res.status(status).json({ error: message });
};

router.get("/get-all", authenticateUser, async (req: Request, res: Response) => {
    const { eventId, userId, page, limit } = req.query;
    if (!eventId) { sendError(res, 400, "Missing required field: eventId"); return; }

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 20));
    const skip = (pageNum - 1) * limitNum;

    try {
        const challengeFiles = await useDatabase<string[]>(async () => {
            const challenges = await ChallengeModel.find({}, { "participants.file": 1 }).lean().exec();
            const fileIds: string[] = [];
            challenges.forEach(challenge => {
                if (Array.isArray(challenge.participants)) {
                    challenge.participants.forEach((p: Participant) => {
                        if (p.file) fileIds.push(p.file.toString());
                    });
                }
            });
            return fileIds;
        });

        const filters: { eventId: string; userId?: string; _id?: { $nin: string[] } } = { eventId: eventId as string };
        if (userId && typeof userId === "string") filters.userId = userId;
        if (challengeFiles.length > 0) filters._id = { $nin: challengeFiles };

        const [files, total] = await useDatabase<[IFile[], number]>(async () => Promise.all([
            FileModel.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limitNum).populate('userId').populate('likedBy').exec(),
            FileModel.countDocuments(filters).exec(),
        ]));

        res.json({ files, total, page: pageNum, limit: limitNum, hasMore: skip + files.length < total });
    } catch (err) {
        logger.error("get-all failed", err);
        sendError(res, 500, "Internal server error");
    }
});

router.post("/upload", authenticateUser, upload.fields([{ name: 'file', maxCount: 10 }]), async (req: Request, res: Response): Promise<void> => {
    const body = req.body as { eventId?: string; userId?: string; challengeId?: string; caption?: string };
    const { eventId, userId, challengeId, caption } = body;
    if (!eventId || !userId) { sendError(res, 400, "Missing required fields: eventId or userId"); return; }

    const rawFiles = req.files;
    if (!rawFiles || typeof rawFiles !== 'object') { sendError(res, 400, "No file uploaded"); return; }
    const files = rawFiles as Record<string, Express.Multer.File[]>;
    if (!files['file']?.length) { sendError(res, 400, "No file uploaded"); return; }

    const uploadResults: { fileName: string; success: boolean; dbId?: string }[] = [];

    for (const file of files['file']) {
        const video = isVideoMime(file.mimetype);

        if (!video && file.size > MAX_IMAGE_SIZE) {
            sendError(res, 400, `Image too large: ${file.originalname}`);
            return;
        }

        if (!video) {
            try {
                await sharp(file.buffer).metadata();
            } catch (err) {
                logger.error(`invalid image file: ${file.originalname}`, err);
                sendError(res, 400, `Invalid image file: ${file.originalname}`);
                return;
            }
        }

        const extension = path.extname(file.originalname);
        const filePath = `${folder}${eventId}/${userId}-${Date.now()}${extension}`;
        const fileSaved = saveFile(filePath, file.buffer);

        let cloudinaryFullUrl: string;
        let cloudinaryCompressedUrl: string;

        if (video) {
            try {
                cloudinaryFullUrl = await uploadFileToCloudinary(filePath, eventId);
                cloudinaryCompressedUrl = videoThumbnailUrl(cloudinaryFullUrl);
            } catch (err) {
                logger.error("Cloudinary video upload failed", err);
                sendError(res, 500, `Cloudinary upload error: ${err instanceof Error ? err.message : String(err)}`);
                return;
            }
            deleteFile(filePath);
        } else {
            const webpImage = await convertToWebp(filePath);
            if (!webpImage) { sendError(res, 500, "Failed to convert image to WebP"); return; }

            try {
                cloudinaryFullUrl = await uploadFileToCloudinary(webpImage, eventId);
            } catch (err) {
                logger.error("Cloudinary full upload failed", err);
                sendError(res, 500, `Cloudinary upload error: ${err instanceof Error ? err.message : String(err)}`);
                return;
            }

            const imageCompressed = await compressImage(filePath);
            if (!imageCompressed) { sendError(res, 500, "Failed to compress image"); return; }

            try {
                cloudinaryCompressedUrl = await uploadFileToCloudinary(imageCompressed, eventId);
            } catch (err) {
                logger.error("Cloudinary compressed upload failed", err);
                sendError(res, 500, `Cloudinary compressed upload error: ${err instanceof Error ? err.message : String(err)}`);
                return;
            }

            deleteFile(filePath);
            deleteFile(imageCompressed);
            deleteFile(webpImage);
        }

        let dbId: string | undefined;
        if (fileSaved) {
            try {
                const fileDoc = new FileModel({ fullSrc: cloudinaryFullUrl, compressedSrc: cloudinaryCompressedUrl, eventId, userId, caption: caption ?? '', isVideo: video });
                const savedFile = await useDatabase<IFile>(() => fileDoc.save());

                if (challengeId) {
                    const challenge = await useDatabase(() => ChallengeModel.findById(challengeId));
                    if (!challenge) { sendError(res, 404, "Challenge not found"); return; }
                    if (challenge.participants.some((p: Participant) => p.user.toString() === userId)) {
                        sendError(res, 400, "User is already participating in this challenge"); return;
                    }
                    const updated = await useDatabase(() =>
                        ChallengeModel.updateOne(
                            { _id: challengeId },
                            { $push: { participants: { user: userId, file: savedFile.id, uploadedAt: new Date() } } }
                        ).exec()
                    );
                    if (!updated) { sendError(res, 500, "Failed to update challenge with new participant"); return; }
                }

                dbId = savedFile.id;
                if (!challengeId) {
                    emitToEvent(eventId, 'new-photo', { id: savedFile.id, fullSrc: cloudinaryFullUrl, compressedSrc: cloudinaryCompressedUrl, eventId, userId });
                }
            } catch (err) {
                logger.error("DB save failed during upload", err);
                sendError(res, 500, "Failed to save file metadata");
                return;
            }
        }

        uploadResults.push({ fileName: file.originalname, success: !!fileSaved && !!dbId, dbId });
    }

    const failed = uploadResults.filter(r => !r.success);
    if (failed.length > 0) { sendError(res, 500, "Failed to save some files"); return; }
    res.json({ message: "Files uploaded successfully", files: uploadResults });
});

router.delete("/:fileId", authenticateUser, async (req: Request, res: Response) => {
    const { fileId } = req.params;
    try {
        const file = await useDatabase<IFile | null>(() => FileModel.findById(fileId).exec());
        if (!file) { sendError(res, 404, "File not found"); return; }

        const cloudinaryFullId = file.fullSrc.split('/').pop()?.split('.')[0];
        const cloudinaryCompressedId = file.compressedSrc.split('/').pop()?.split('.')[0];
        if (!cloudinaryCompressedId || !cloudinaryFullId) { sendError(res, 400, "Invalid file name format"); return; }

        const [deletedFull, deletedCompressed] = await Promise.all([
            deleteFileFromCloudinary(cloudinaryFullId),
            deleteFileFromCloudinary(cloudinaryCompressedId),
        ]);

        if (!deletedFull || !deletedCompressed) { sendError(res, 500, "Failed to delete file from Cloudinary"); return; }

        await useDatabase(() => FileModel.deleteOne({ _id: fileId }).exec());

        const challenge = await useDatabase(() => ChallengeModel.findOne({ "participants.file": fileId }).exec());
        if (challenge) {
            await useDatabase(() => ChallengeModel.updateOne({ _id: challenge._id }, { $pull: { participants: { file: fileId } } }).exec());
        }

        res.json({ message: "File deleted successfully" });
    } catch (err) {
        logger.error("delete failed", err);
        sendError(res, 500, "Internal server error");
    }
});

router.patch("/:fileId/like", authenticateUser, async (req: Request, res: Response) => {
    const { fileId } = req.params;
    const { userId } = req.body as { userId?: string };
    if (!userId) { sendError(res, 400, "Missing required field: userId"); return; }

    try {
        const file = await useDatabase<IFile | null>(() => FileModel.findById(fileId).exec());
        if (!file) { sendError(res, 404, "File not found"); return; }

        const likedBy = file.likedBy || [];
        const userObjectId = new mongoose.Types.ObjectId(userId);
        const alreadyLiked = likedBy.some((id: mongoose.Types.ObjectId) => id.equals(userObjectId));

        await useDatabase(async () => {
            file.likedBy = alreadyLiked
                ? likedBy.filter((id: mongoose.Types.ObjectId) => !id.equals(userObjectId))
                : [...likedBy, userObjectId];
            await file.save();
        });

        emitToEvent(file.eventId.toString(), 'like', { fileId, liked: !alreadyLiked, userId });
        res.json({ message: alreadyLiked ? "Like removed" : "File liked", liked: !alreadyLiked });
    } catch (err) {
        logger.error("like failed", err);
        sendError(res, 500, "Internal server error");
    }
});

router.get('/download-all', authenticateUser, async (req: Request, res: Response) => {
    const { eventId } = req.query;
    if (!eventId) { sendError(res, 400, 'Missing eventId'); return; }

    try {
        const files = await useDatabase<IFile[]>(() =>
            FileModel.find({ eventId }).select('fullSrc').lean().exec()
        );

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename="fotos-boda.zip"');

        const archive = archiver('zip', { zlib: { level: 6 } });
        archive.on('error', (err) => { logger.error('archiver error', err); });
        archive.pipe(res);

        for (const file of files) {
            const fetchRes = await fetch(file.fullSrc);
            if (!fetchRes.ok) continue;
            const buffer = Buffer.from(await fetchRes.arrayBuffer());
            const filename = file.fullSrc.split('/').pop() || `${file._id}.webp`;
            archive.append(buffer, { name: filename });
        }

        await archive.finalize();
    } catch (err) {
        logger.error('download-all failed', err);
        if (!res.headersSent) sendError(res, 500, 'Internal server error');
    }
});

router.get('/:id', authenticateUser, async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const file = await useDatabase<IFile | null>(() =>
            FileModel.findById(id).populate('userId').populate('likedBy').exec()
        );
        if (!file) { sendError(res, 404, 'File not found'); return; }
        res.json(file);
    } catch (err) {
        logger.error('get file by id failed', err);
        sendError(res, 500, 'Internal server error');
    }
});

router.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        sendError(res, 413, "File too large. Maximum size is 20MB");
        return;
    }
    if (err.message?.startsWith('File type not allowed')) {
        res.status(415).json({ error: err.message });
        return;
    }
    next(err);
});

export { router };
