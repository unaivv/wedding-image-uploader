import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { authenticateAdmin } from '../services/auth';
import { useDatabase } from '../services/ddbb';
import UserModel from '../models/user';
import FileModel from '../models/file';
import CommentModel from '../models/comment';
import ChallengeModel from '../models/challenge';
import EventModel from '../models/event';
import { deleteFileFromCloudinary, extractPublicId } from '../services/useCloudinary';
import { logger } from '../services/logger';

const router = Router();

const sendError = (res: Response, status: number, message: string) => {
    res.status(status).json({ error: message });
};

// ── Stats ─────────────────────────────────────────────────
router.get('/stats', authenticateAdmin, async (_req: Request, res: Response): Promise<void> => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [totalPhotos, totalUsers, totalComments, photosToday, totalParticipations] = await useDatabase(async () =>
            Promise.all([
                FileModel.countDocuments(),
                UserModel.countDocuments(),
                CommentModel.countDocuments(),
                FileModel.countDocuments({ createdAt: { $gte: today } }),
                ChallengeModel.aggregate([
                    { $project: { count: { $size: '$participants' } } },
                    { $group: { _id: null, total: { $sum: '$count' } } },
                ]),
            ])
        );

        res.json({
            totalPhotos,
            totalUsers,
            totalComments,
            photosToday,
            totalParticipations: (totalParticipations as { total: number }[])[0]?.total ?? 0,
        });
    } catch (err) {
        logger.error('admin stats failed', err);
        sendError(res, 500, 'Internal server error');
    }
});

// ── Event ──────────────────────────────────────────────────
router.get('/event/:id', authenticateAdmin, async (req: Request, res: Response): Promise<void> => {
    try {
        const event = await useDatabase(async () => EventModel.findById(req.params.id).exec());
        if (!event) { sendError(res, 404, 'Event not found'); return; }
        res.json({ event });
    } catch (err) {
        logger.error('admin get event failed', err);
        sendError(res, 500, 'Internal server error');
    }
});

router.patch('/event/:id', authenticateAdmin, async (req: Request, res: Response): Promise<void> => {
    const { name, date, location, description } = req.body as {
        name?: string; date?: string; location?: string; description?: string;
    };
    try {
        const event = await useDatabase(async () =>
            EventModel.findByIdAndUpdate(
                req.params.id,
                { $set: { name, date, location, description } },
                { new: true, runValidators: true }
            ).exec()
        );
        if (!event) { sendError(res, 404, 'Event not found'); return; }
        res.json({ event });
    } catch (err) {
        logger.error('admin update event failed', err);
        sendError(res, 500, 'Internal server error');
    }
});

// ── Challenges ─────────────────────────────────────────────
router.get('/challenges', authenticateAdmin, async (req: Request, res: Response): Promise<void> => {
    const { eventId } = req.query;
    try {
        const query = eventId ? { event: new mongoose.Types.ObjectId(eventId as string) } : {};
        const challenges = await useDatabase(async () =>
            ChallengeModel.find(query)
                .populate('participants.user')
                .populate('participants.file')
                .populate('winner')
                .sort({ createdAt: -1 })
                .exec()
        );
        res.json({ challenges });
    } catch (err) {
        logger.error('admin list challenges failed', err);
        sendError(res, 500, 'Internal server error');
    }
});

router.post('/challenges', authenticateAdmin, async (req: Request, res: Response): Promise<void> => {
    const { title, description, topic, endDate, eventId } = req.body as {
        title: string; description?: string; topic?: string; endDate: string; eventId: string;
    };
    if (!title || !endDate || !eventId) { sendError(res, 400, 'Missing required fields'); return; }
    try {
        const challenge = await useDatabase(async () =>
            ChallengeModel.create({ title, description, topic, endDate: new Date(endDate), event: eventId, participants: [] })
        );
        res.status(201).json({ challenge });
    } catch (err) {
        logger.error('admin create challenge failed', err);
        sendError(res, 500, 'Internal server error');
    }
});

router.patch('/challenges/:id', authenticateAdmin, async (req: Request, res: Response): Promise<void> => {
    const { title, description, topic, endDate } = req.body as {
        title?: string; description?: string; topic?: string; endDate?: string;
    };
    try {
        const update: Record<string, unknown> = {};
        if (title !== undefined) update.title = title;
        if (description !== undefined) update.description = description;
        if (topic !== undefined) update.topic = topic;
        if (endDate !== undefined) update.endDate = new Date(endDate);

        const challenge = await useDatabase(async () =>
            ChallengeModel.findByIdAndUpdate(req.params.id, { $set: update }, { new: true })
                .populate('participants.user')
                .populate('participants.file')
                .populate('winner')
                .exec()
        );
        if (!challenge) { sendError(res, 404, 'Challenge not found'); return; }
        res.json({ challenge });
    } catch (err) {
        logger.error('admin update challenge failed', err);
        sendError(res, 500, 'Internal server error');
    }
});

router.delete('/challenges/:id', authenticateAdmin, async (req: Request, res: Response): Promise<void> => {
    try {
        await useDatabase(async () => ChallengeModel.findByIdAndDelete(req.params.id).exec());
        res.json({ success: true });
    } catch (err) {
        logger.error('admin delete challenge failed', err);
        sendError(res, 500, 'Internal server error');
    }
});

router.patch('/challenges/:id/winner', authenticateAdmin, async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.body as { userId: string };
    if (!userId) { sendError(res, 400, 'Missing userId'); return; }
    try {
        const challenge = await useDatabase(async () =>
            ChallengeModel.findByIdAndUpdate(
                req.params.id,
                { $set: { winner: userId } },
                { new: true }
            ).populate('participants.user').populate('participants.file').populate('winner').exec()
        );
        if (!challenge) { sendError(res, 404, 'Challenge not found'); return; }
        res.json({ challenge });
    } catch (err) {
        logger.error('admin set winner failed', err);
        sendError(res, 500, 'Internal server error');
    }
});

// ── Users ──────────────────────────────────────────────────
router.get('/users', authenticateAdmin, async (_req: Request, res: Response): Promise<void> => {
    try {
        const [users, photoCounts] = await useDatabase(async () =>
            Promise.all([
                UserModel.find().sort({ createdAt: -1 }).exec(),
                FileModel.aggregate([
                    { $group: { _id: '$userId', count: { $sum: 1 } } },
                ]),
            ])
        );
        const countMap: Record<string, number> = {};
        for (const row of photoCounts as { _id: mongoose.Types.ObjectId; count: number }[]) {
            countMap[String(row._id)] = row.count;
        }
        const result = users.map(u => ({ ...u.toObject(), photoCount: countMap[String(u._id)] ?? 0 }));
        res.json({ users: result });
    } catch (err) {
        logger.error('admin list users failed', err);
        sendError(res, 500, 'Internal server error');
    }
});

router.patch('/users/:id/admin', authenticateAdmin, async (req: Request, res: Response): Promise<void> => {
    const { isAdmin } = req.body as { isAdmin: boolean };
    try {
        const user = await useDatabase(async () =>
            UserModel.findByIdAndUpdate(req.params.id, { $set: { isAdmin } }, { new: true }).exec()
        );
        if (!user) { sendError(res, 404, 'User not found'); return; }
        res.json({ user });
    } catch (err) {
        logger.error('admin toggle admin failed', err);
        sendError(res, 500, 'Internal server error');
    }
});

// ── Photos ─────────────────────────────────────────────────
router.get('/photos', authenticateAdmin, async (req: Request, res: Response): Promise<void> => {
    const { page, limit, userId } = req.query;
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 30));
    const skip = (pageNum - 1) * limitNum;
    try {
        const query = userId ? { userId: new mongoose.Types.ObjectId(userId as string) } : {};
        const [files, total] = await useDatabase(async () =>
            Promise.all([
                FileModel.find(query).populate('userId').sort({ createdAt: -1 }).skip(skip).limit(limitNum).exec(),
                FileModel.countDocuments(query),
            ])
        );
        res.json({ files, total, hasMore: skip + files.length < total });
    } catch (err) {
        logger.error('admin list photos failed', err);
        sendError(res, 500, 'Internal server error');
    }
});

router.delete('/photos', authenticateAdmin, async (req: Request, res: Response): Promise<void> => {
    const { ids } = req.body as { ids: string[] };
    if (!ids?.length) { sendError(res, 400, 'Missing ids'); return; }
    try {
        const files = await useDatabase(async () => FileModel.find({ _id: { $in: ids } }).exec());
        await Promise.all(files.flatMap(f => {
            const resourceType = f.isVideo ? 'video' : 'image';
            const tasks = [deleteFileFromCloudinary(extractPublicId(f.fullSrc), resourceType).catch(() => null)];
            if (!f.isVideo) tasks.push(deleteFileFromCloudinary(extractPublicId(f.compressedSrc), 'image').catch(() => null));
            return tasks;
        }));
        await useDatabase(async () => FileModel.deleteMany({ _id: { $in: ids } }).exec());
        res.json({ deleted: files.length });
    } catch (err) {
        logger.error('admin bulk delete photos failed', err);
        sendError(res, 500, 'Internal server error');
    }
});

export { router };
