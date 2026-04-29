import { Router, Request, Response } from 'express';
import { authenticateUser } from '../services/auth';
import { useDatabase } from '../services/ddbb';
import CommentModel from '../models/comment';
import { emitToEvent } from '../services/sseEmitter';
import FileModel from '../models/file';
import { logger } from '../services/logger';

const router = Router();

const sendError = (res: Response, status: number, message: string) => {
    res.status(status).json({ error: message });
};

router.get('/:fileId', authenticateUser, async (req: Request, res: Response): Promise<void> => {
    const { fileId } = req.params;
    try {
        const comments = await useDatabase(async () =>
            CommentModel.find({ fileId }).populate('userId').sort({ createdAt: 1 }).exec()
        );
        res.json({ comments });
    } catch (err) {
        logger.error('get comments failed', err);
        sendError(res, 500, 'Internal server error');
    }
});

router.post('/:fileId', authenticateUser, async (req: Request, res: Response): Promise<void> => {
    const { fileId } = req.params;
    const userId = req.headers['userid'] as string;
    const { text } = req.body as { text?: string };

    if (!text?.trim()) { sendError(res, 400, 'Missing comment text'); return; }
    if (text.length > 500) { sendError(res, 400, 'Comment too long'); return; }

    try {
        const file = await useDatabase(async () => FileModel.findById(fileId).exec());
        if (!file) { sendError(res, 404, 'Photo not found'); return; }

        const comment = await useDatabase(async () =>
            CommentModel.create({ fileId, userId, text: text.trim() })
        );
        const populated = await comment.populate('userId');

        const eventId = file.eventId.toString();
        emitToEvent(eventId, 'new-comment', { fileId, comment: populated });

        res.status(201).json({ comment: populated });
    } catch (err) {
        logger.error('create comment failed', err);
        sendError(res, 500, 'Internal server error');
    }
});

router.delete('/:commentId', authenticateUser, async (req: Request, res: Response): Promise<void> => {
    const { commentId } = req.params;
    const userId = req.headers['userid'] as string;

    try {
        const comment = await useDatabase(async () => CommentModel.findById(commentId).exec());
        if (!comment) { sendError(res, 404, 'Comment not found'); return; }
        if (comment.userId.toString() !== userId) { sendError(res, 403, 'Not authorized'); return; }

        await useDatabase(async () => CommentModel.findByIdAndDelete(commentId).exec());
        res.json({ success: true });
    } catch (err) {
        logger.error('delete comment failed', err);
        sendError(res, 500, 'Internal server error');
    }
});

export { router };
