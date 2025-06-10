export const deleteFile = async (fileId: string): Promise<boolean> => {
    try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/files/delete?fileId=${fileId}`, {
            headers: {
                "ngrok-skip-browser-warning": "69420", //TODO: ONLY FOR DEV
            }
        });

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