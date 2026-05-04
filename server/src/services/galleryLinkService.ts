import jwt from 'jsonwebtoken';

const SECRET = process.env.GALLERY_TOKEN_SECRET;
if (!SECRET) throw new Error('GALLERY_TOKEN_SECRET env var is required');
const APP_URL = process.env.APP_URL ?? 'http://localhost:5173';
const EXPIRY_SECONDS = 7 * 24 * 60 * 60;

export const buildGalleryLink = (eventId: string): string => {
    const token = jwt.sign({ eventId }, SECRET, { expiresIn: EXPIRY_SECONDS });
    return `${APP_URL}/gallery/${token}`;
};

export const verifyGalleryToken = (token: string): { eventId: string } => {
    return jwt.verify(token, SECRET) as { eventId: string };
};
