import { Router, Request, Response } from 'express';
import { verifyGalleryToken } from '../services/galleryLinkService';
import FileModel from '../models/file';
import { useDatabase } from '../services/ddbb';
import { logger } from '../services/logger';
import mongoose from 'mongoose';

const router = Router();

router.get('/:token', async (req: Request, res: Response): Promise<void> => {
    try {
        const { eventId } = verifyGalleryToken(req.params.token);
        const files = await useDatabase(async () =>
            FileModel.find({ eventId: new mongoose.Types.ObjectId(eventId) })
                .populate('userId', 'name email picture')
                .sort({ createdAt: -1 })
                .exec()
        );
        res.json({ files });
    } catch (err) {
        logger.error('gallery token failed', err);
        res.status(401).json({ error: 'Enlace inválido o expirado' });
    }
});

export { router };
