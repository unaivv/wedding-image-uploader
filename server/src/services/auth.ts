import { Request, Response, NextFunction } from 'express';
import UserModel from '../models/user';
import { useDatabase } from './ddbb';

export const authenticateUser = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.headers['userid'] as string;

        if (!userId) {
            res.status(401).json({ error: 'User ID missing from headers' });
            return;
        }

        const user = await useDatabase(async () => {
            return UserModel.findById(userId);
        });

        if (!user) {
            res.status(403).json({ error: 'User not found' });
            return;
        }

        next();
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
