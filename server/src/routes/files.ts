import { Router, Request, Response } from "express";
import { useDatabase } from "../services/ddbb";
import { deleteFile, saveFile } from "../services/files";
import multer from "multer";
import path from "path";
import FileModel, { IFile } from "../models/file";
import { uploadFileToCloudinary } from "../services/useCloudinary";

const router = Router();

const folder = path.join(__dirname, '../buckets/images/');
router.get("/get-all", async (req: Request, res: Response) => {
  const params = req.query;

  if (!params) {
    res.status(400).json({ error: "Request params is required" });
    return;
  }
  const { eventId, user } = params;
  if (!eventId) {
    res.status(400).json({ error: "Missing required field: eventId" });
    return;
  }
  try {
    const files = await useDatabase<IFile[]>(async () => {
      const filter:any = { eventId: eventId };
      if (user) {
        filter.user = user;
      }
      return FileModel.find(filter).exec();
    });

    res.json(files);
  } catch (error) {
    console.error("Error fetching files:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload", upload.fields([{ name: 'file', maxCount: 10 }]), async (req: Request, res: Response): Promise<void> => {
  const body = req.body;

  if (!body) {
    return;
  }

  const { eventId, userName } = body;

  if (!eventId || !userName) {
    res.status(400).json({ error: "Missing required fields: eventId or userName" });
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
    const localPath = `${eventId}/${userName}-${Date.now()}${extension}`
    const filePath = `${folder}${localPath}`;
    const fileSaved = saveFile(filePath, file.buffer);

    const cloudinaryImageUrl = await uploadFileToCloudinary(filePath, eventId)

    if(!cloudinaryImageUrl){
      console.error("Error uploading file to Cloudinary");
      res.status(500).json({ error: "Failed to upload file to Cloudinary" });
      return;
    }

    deleteFile(filePath)

    let dbId: string | undefined = undefined;
    if (fileSaved && cloudinaryImageUrl) {
      try {
        const fileDoc = new FileModel({
          fileName: cloudinaryImageUrl,
          eventId: body.eventId,
          user: userName
        });

        const savedFile = await useDatabase<IFile>(async () => {
          const document = await fileDoc.save();
          return document
        })
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

export default router;
