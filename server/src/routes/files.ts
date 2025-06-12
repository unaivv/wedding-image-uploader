import { Router, Request, Response } from "express";
import { useDatabase } from "../services/ddbb";
import { deleteFile, saveFile } from "../services/files";
import multer from "multer";
import path from "path";
import FileModel, { IFile } from "../models/file";
import { deleteFileFromCloudinary, uploadFileToCloudinary } from "../services/useCloudinary";
import { compressImage, convertToWebp } from "../services/images";
import ChallengeModel from "../models/challenge";

const router = Router();
const folder = path.join(__dirname, '../buckets/images/');
const upload = multer({ storage: multer.memoryStorage() });

router.get("/get-all", async (req: Request, res: Response) => {
  const params = req.query;

  if (!params) {
    res.status(400).json({ error: "Request params is required" });
    return;
  }
  const { eventId, userId } = params;
  if (!eventId) {
    res.status(400).json({ error: "Missing required field: eventId" });
    return;
  }
  try {
    const files = await useDatabase<IFile[]>(async () => {
      const filters: { eventId: string; userId?: string; } = {
        eventId: eventId as string
      }
      if (userId && typeof userId === "string") {
        filters.userId = userId;
      }
      return FileModel.find(filters)
        .sort({ createdAt: -1 })
        .populate('userId')
        .populate('likedBy')
        .exec();
    });

    res.json(files);
  } catch (error) {
    console.error("Error fetching files:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/upload", upload.fields([{ name: 'file', maxCount: 10 }]), async (req: Request, res: Response): Promise<void> => {
  const body = req.body;

  if (!body) {
    return;
  }

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
    const extension = path.extname(file.originalname);
    const localPath = `${eventId}/${userId}-${Date.now()}${extension}`
    const filePath = `${folder}${localPath}`;
    const fileSaved = saveFile(filePath, file.buffer);

    const webpImage = await convertToWebp(filePath);

    if (!webpImage) {
      console.error("Error converting image to WebP");
      res.status(500).json({ error: "Failed to convert image to WebP" });
      return;
    }

    const cloudinaryFullImageUrl = await uploadFileToCloudinary(webpImage, eventId)

    if (!cloudinaryFullImageUrl) {
      console.error("Error uploading file to Cloudinary");
      res.status(500).json({ error: "Failed to upload file to Cloudinary" });
      return;
    }

    const imageCompressed = await compressImage(filePath)

    if (!imageCompressed) {
      console.error("Error compressing image");
      res.status(500).json({ error: "Failed to compress image" });
      return;
    }

    const cloudinaryCompressedImageUrl = await uploadFileToCloudinary(imageCompressed, eventId)

    if (!cloudinaryCompressedImageUrl) {
      console.error("Error uploading compressed image to Cloudinary");
      res.status(500).json({ error: "Failed to upload compressed image to Cloudinary" });
      return;
    }

    deleteFile(filePath)
    deleteFile(imageCompressed)
    deleteFile(webpImage)

    let dbId: string | undefined = undefined;
    if (fileSaved && cloudinaryFullImageUrl) {
      try {
        const fileDoc = new FileModel({
          fullSrc: cloudinaryFullImageUrl,
          compressedSrc: cloudinaryCompressedImageUrl,
          eventId: eventId,
          userId: userId
        });

        const savedFile = await useDatabase<IFile>(async () => {
          const document = await fileDoc.save();
          return document
        })

        if (challengeId) {
          const challenge = await useDatabase(async () => {
            return ChallengeModel.findById(challengeId)
          });

          if (!challenge) {
            console.error("Challenge not found");
            res.status(404).json({ error: "Challenge not found" });
            return;
          }
          console.log(challenge.participants, userId)
          const isParticipating = challenge.participants.some(participant => participant.user.toString() === body.userId);
          if (isParticipating) {
            console.error("User is already participating in this challenge");
            res.status(400).json({ error: "User is already participating in this challenge" });
            return;
          }

          const updatedChallenge = await useDatabase(async () => {
            const updatedChallenge = await ChallengeModel.updateOne(
              { _id: challengeId },
              {
                $push: {
                  participants: {
                    user: body.userId,
                    file: savedFile.id,
                    uploadedAt: new Date()
                  }
                }
              }
            ).exec();
            return updatedChallenge;
          })

          if (!updatedChallenge) {
            console.error("Error updating challenge with new participant");
            res.status(500).json({ error: "Failed to update challenge with new participant" });
            return;
          }
        }

        dbId = savedFile.id;
      } catch (err) {
        console.error("Error saving file info to DB:", err);
      }
    }

    uploadResults.push({
      fileName: file.originalname,
      success: !!fileSaved && !!dbId,
      dbId
    });
  }

  const failed = uploadResults.filter(r => !r.success);

  if (failed.length > 0) {
    res.status(500).json({ error: "Failed to save some files", details: failed });
    return;
  }

  res.json({ message: "Files uploaded successfully", files: uploadResults });
});

router.get("/delete", async (req: Request, res: Response) => {
  const params = req.query;

  if (!params) {
    res.status(400).json({ error: "Request params is required" });
    return;
  }
  const { fileId } = params;
  if (!fileId) {
    res.status(400).json({ error: "Missing required field: fileId" });
    return;
  }

  try {
    const file = await useDatabase<IFile | null>(async () => {
      return FileModel.findById(fileId).exec();
    });

    if (!file) {
      res.status(404).json({ error: "File not found" });
      return;
    }
    const cloudinaryFullId = file.fullSrc.split('/').pop()?.split('.')[0];
    const cloudinaryCompressedId = file.compressedSrc.split('/').pop()?.split('.')[0];
    if (!cloudinaryCompressedId || !cloudinaryFullId) {
      res.status(400).json({ error: "Invalid file name format" });
      return;
    }

    const deletedFIleInCloudinary = deleteFileFromCloudinary(cloudinaryFullId);
    if (!deletedFIleInCloudinary) {
      res.status(500).json({ error: "Failed to delete file from Cloudinary" });
      return;
    }

    const deletedCompressedFileInCloudinary = deleteFileFromCloudinary(cloudinaryCompressedId);
    if (!deletedCompressedFileInCloudinary) {
      res.status(500).json({ error: "Failed to delete compressed file from Cloudinary" });
      return;
    }

    await useDatabase(async () => {
      await FileModel.deleteOne({ _id: fileId }).exec();
    });

    res.json({ message: "File deleted successfully" });
  } catch (error) {
    console.error("Error deleting file:", error);
    res.status(500).json({ error: "Internal server error" });
  }
})

router.get('/like', async (req: Request, res: Response) => {
  const params = req.query;
  if (!params) {
    res.status(400).json({ error: "Request params is required" });
    return;
  }
  const { fileId, userId } = params;
  if (!fileId || !userId) {
    res.status(400).json({ error: "Missing required fields: fileId or userId" });
    return;
  }
  try {
    const file = await useDatabase<IFile | null>(async () => {
      return FileModel
        .findById(fileId)
        .exec();
    }
    );
    if (!file) {
      res.status(404).json({ error: "File not found" });
      return;
    }
    const likedBy = file.likedBy || [];
    const mongoose = require("mongoose");
    const userObjectId = new mongoose.Types.ObjectId(userId as string);

    if (likedBy.some((id: any) => id.equals(userObjectId))) {
      await useDatabase(async () => {
        file.likedBy = likedBy.filter((id: any) => !id.equals(userObjectId));
        await file.save();
      });
      res.json({ message: "Like removed", liked: false });
    } else {
      await useDatabase(async () => {
        if (!file.likedBy) {
          file.likedBy = [];
        }
        file.likedBy.push(userObjectId);
        await file.save();
      });
      res.json({ message: "File liked", liked: true });
    }
  } catch (error) {
    console.error("Error liking file:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
