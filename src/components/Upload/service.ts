import { get } from "../../utils/fetch";

export const deleteFile = async (fileId: string): Promise<boolean> => {
    try {
        await get({
            url: `${import.meta.env.VITE_BACKEND_URL}/files/delete?fileId=${fileId}`,
            auth: true
        });

        return true;
    } catch (error) {
        console.error('Error deleting file:', error);
        return false;
    }
}

export const likeFile = async (fileId: string, userId: string): Promise<boolean> => {
    try {
        const likedresponse = await get<{ liked: boolean }>({
            url: `${import.meta.env.VITE_BACKEND_URL}/files/like?fileId=${fileId}&userId=${userId}`,
            auth: true
        });
        return likedresponse.liked;
    } catch (error) {
        console.error('Error liking file:', error);
        return false;
    }
}