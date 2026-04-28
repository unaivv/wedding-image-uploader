import { Router, Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
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

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']);
const MAX_FILE_SIZE = 20 * 1024 * 1024;

const router = Router();
const folder = path.join(__dirname, '../buckets/images/');
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`File type not allowed: ${file.mimetype}`));
        }
    }
});

type Participant = IChallenge['participants'][number];

router.get("/get-all", authenticateUser, async (req: Request, res: Response) => {
  const { eventId, userId, page, limit } = req.query;

  if (!eventId) {
    res.status(400).json({ error: "Missing required field: eventId" });
    return;
  }

  const pageNum = Math.max(1, parseInt(page as string) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 20));
  const skip = (pageNum - 1) * limitNum;

  try {
    const challengeFiles = await useDatabase<string[]>(async () => {
      const challenges = await ChallengeModel.find({}, { "participants.file": 1 }).lean().exec();
      const fileIds: string[] = [];
      challenges.forEach(challenge => {
        if (challenge.participants && Array.isArray(challenge.participants)) {
          challenge.participants.forEach((p: Participant) => {
            if (p.file) fileIds.push(p.file.toString());
          });
        }
      });
      return fileIds;
    });

    const filters: { eventId: string; userId?: string; _id?: { $nin: string[] } } = {
      eventId: eventId as string
    };
    if (userId && typeof userId === "string") filters.userId = userId;
    if (challengeFiles.length > 0) filters._id = { $nin: challengeFiles };

    const [files, total] = await useDatabase<[IFile[], number]>(async () => Promise.all([
      FileModel.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limitNum).populate('userId').populate('likedBy').exec(),
      FileModel.countDocuments(filters).exec(),
    ]));

    res.json({ files, total, page: pageNum, limit: limitNum, hasMore: skip + files.length < total });
  } catch (err) {
    logger.error("get-all failed", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/upload", authenticateUser, upload.fields([{ name: 'file', maxCount: 10 }]), async (req: Request, res: Response): Promise<void> => {
  const body = req.body;
  if (!body) return;

  const { eventId, userId, challengeId } = body;
  if (!eventId || !userId) {
    res.status(400).json({ error: "Missing required fields: eventId or userId" });
    return;
  }

  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  if (!files || !files["file"] || files["file"].length === 0) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  const uploadResults: { fileName: string; success: boolean; dbId?: string }[] = [];

  for (const file of files["file"]) {
    try {
      await sharp(file.buffer).metadata();
    } catch {
      res.status(400).json({ error: `Invalid image file: ${file.originalname}` });
      return;
    }

    const extension = path.extname(file.originalname);
    const filePath = `${folder}${eventId}/${userId}-${Date.now()}${extension}`;
    const fileSaved = saveFile(filePath, file.buffer);

    const webpImage = await convertToWebp(filePath);
    if (!webpImage) { res.status(500).json({ error: "Failed to convert image to WebP" }); return; }

    const cloudinaryFullImageUrl = await uploadFileToCloudinary(webpImage, eventId);
    if (!cloudinaryFullImageUrl) { res.status(500).json({ error: "Failed to upload file to Cloudinary" }); return; }

    const imageCompressed = await compressImage(filePath);
    if (!imageCompressed) { res.status(500).json({ error: "Failed to compress image" }); return; }

    const cloudinaryCompressedImageUrl = await uploadFileToCloudinary(imageCompressed, eventId);
    if (!cloudinaryCompressedImageUrl) { res.status(500).json({ error: "Failed to upload compressed image to Cloudinary" }); return; }

    deleteFile(filePath);
    deleteFile(imageCompressed);
    deleteFile(webpImage);

    let dbId: string | undefined;
    if (fileSaved && cloudinaryFullImageUrl) {
      try {
        const fileDoc = new FileModel({ fullSrc: cloudinaryFullImageUrl, compressedSrc: cloudinaryCompressedImageUrl, eventId, userId });
        const savedFile = await useDatabase<IFile>(() => fileDoc.save());

        if (challengeId) {
          const challenge = await useDatabase(() => ChallengeModel.findById(challengeId));
          if (!challenge) { res.status(404).json({ error: "Challenge not found" }); return; }

          if (challenge.participants.some((p: Participant) => p.user.toString() === userId)) {
            res.status(400).json({ error: "User is already participating in this challenge" });
            return;
          }

          const updated = await useDatabase(() => ChallengeModel.updateOne(
            { _id: challengeId },
            { $push: { participants: { user: userId, file: savedFile.id, uploadedAt: new Date() } } }
          ).exec());

          if (!updated) { res.status(500).json({ error: "Failed to update challenge with new participant" }); return; }
        }

        dbId = savedFile.id;
      } catch (err) {
        logger.error("DB save failed during upload", err);
        res.status(500).json({ error: "Failed to save file metadata" });
        return;
      }
    }

    uploadResults.push({ fileName: file.originalname, success: !!fileSaved && !!dbId, dbId });
  }

  const failed = uploadResults.filter(r => !r.success);
  if (failed.length > 0) { res.status(500).json({ error: "Failed to save some files", details: failed }); return; }

  res.json({ message: "Files uploaded successfully", files: uploadResults });
});

router.get("/delete", authenticateUser, async (req: Request, res: Response) => {
  const { fileId } = req.query;
  if (!fileId) { res.status(400).json({ error: "Missing required field: fileId" }); return; }

  try {
    const file = await useDatabase<IFile | null>(() => FileModel.findById(fileId).exec());
    if (!file) { res.status(404).json({ error: "File not found" }); return; }

    const cloudinaryFullId = file.fullSrc.split('/').pop()?.split('.')[0];
    const cloudinaryCompressedId = file.compressedSrc.split('/').pop()?.split('.')[0];
    if (!cloudinaryCompressedId || !cloudinaryFullId) {
      res.status(400).json({ error: "Invalid file name format" });
      return;
    }

    const [deletedFull, deletedCompressed] = await Promise.all([
      deleteFileFromCloudinary(cloudinaryFullId),
      deleteFileFromCloudinary(cloudinaryCompressedId),
    ]);

    if (!deletedFull || !deletedCompressed) {
      res.status(500).json({ error: "Failed to delete file from Cloudinary" });
      return;
    }

    await useDatabase(() => FileModel.deleteOne({ _id: fileId }).exec());

    const challenge = await useDatabase(() => ChallengeModel.findOne({ "participants.file": fileId }).exec());
    if (challenge) {
      await useDatabase(() => ChallengeModel.updateOne({ _id: challenge._id }, { $pull: { participants: { file: fileId } } }).exec());
    }

    res.json({ message: "File deleted successfully" });
  } catch (err) {
    logger.error("delete failed", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get('/like', authenticateUser, async (req: Request, res: Response) => {
  const { fileId, userId } = req.query;
  if (!fileId || !userId) { res.status(400).json({ error: "Missing required fields: fileId or userId" }); return; }

  try {
    const file = await useDatabase<IFile | null>(() => FileModel.findById(fileId).exec());
    if (!file) { res.status(404).json({ error: "File not found" }); return; }

    const likedBy = file.likedBy || [];
    const userObjectId = new mongoose.Types.ObjectId(userId as string);
    const alreadyLiked = likedBy.some((id: mongoose.Types.ObjectId) => id.equals(userObjectId));

    await useDatabase(async () => {
      file.likedBy = alreadyLiked
        ? likedBy.filter((id: mongoose.Types.ObjectId) => !id.equals(userObjectId))
        : [...likedBy, userObjectId];
      await file.save();
    });

    res.json({ message: alreadyLiked ? "Like removed" : "File liked", liked: !alreadyLiked });
  } catch (err) {
    logger.error("like failed", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        res.status(413).json({ error: "File too large. Maximum size is 20MB" });
        return;
    }
    if (err.message?.startsWith('File type not allowed')) {
        res.status(415).json({ error: err.message });
        return;
    }
    next(err);
});

export { router };
