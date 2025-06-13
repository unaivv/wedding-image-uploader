export const deleteFile = async (fileId: string): Promise<boolean> => {
    try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/files/delete?fileId=${fileId}`);

        if (!response.ok) {
            console.error('Failed to delete file:', response);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error deleting file:', error);
        return false;
    }
}

export const likeFile = async (fileId: string, userId: string): Promise<boolean> => {
    try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/files/like?fileId=${fileId}&userId=${userId}`);

        if (!response.ok) {
            console.error('Failed to like file:', response);
            return false;
        }

        const data = await response.json();
        return data.liked;
    } catch (error) {
        console.error('Error liking file:', error);
        return false;
    }
}