import { Request, Response, NextFunction } from 'express';
import { OAuth2Client } from 'google-auth-library';
import UserModel from '../models/user';
import { useDatabase } from './ddbb';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const authenticateUser = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.headers['userid'] as string;
        const googleToken = req.headers['google-token'] as string;

        if (!userId || !googleToken) {
            res.status(401).json({ error: 'Missing authentication headers' });
            return;
        }

        let tokenEmail: string | undefined;
        try {
            const ticket = await client.verifyIdToken({
                idToken: googleToken,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            tokenEmail = ticket.getPayload()?.email;
        } catch {
            res.status(401).json({ error: 'Invalid or expired token' });
            return;
        }

        const user = await useDatabase(async () => UserModel.findById(userId));

        if (!user) {
            res.status(403).json({ error: 'User not found' });
            return;
        }

        if (user.email !== tokenEmail) {
            res.status(403).json({ error: 'Token does not match user' });
            return;
        }

        next();
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
