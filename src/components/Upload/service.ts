import { del, patch } from "../../utils/fetch";
import { logger } from "../../utils/logger";

export const deleteFile = async (fileId: string): Promise<boolean> => {
    try {
        await del({ url: `${import.meta.env.VITE_BACKEND_URL}/files/${fileId}`, auth: true });
        return true;
    } catch (err) {
        logger.error('deleteFile failed', err);
        return false;
    }
};

export const likeFile = async (fileId: string, userId: string): Promise<boolean> => {
    try {
        const response = await patch<{ liked: boolean }>({
            url: `${import.meta.env.VITE_BACKEND_URL}/files/${fileId}/like`,
            body: { userId },
            auth: true,
        });
        return response.liked;
    } catch (err) {
        logger.error('likeFile failed', err);
        return false;
    }
};
