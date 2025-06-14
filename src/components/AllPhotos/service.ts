import { get } from "../../utils/fetch";
import type { IPhotosFromBackend } from "./types";

export const getAllPhotos = async (eventId: string, userId?: string) => {
    let url = `${import.meta.env.VITE_BACKEND_URL}/files/get-all?eventId=${eventId}`
    if (userId) {
        url += `&userId=${userId}`;
    }
    const allPhotos = await get<IPhotosFromBackend[]>({ url, auth: true });
    const photos = allPhotos.map((photo) => {
        const newPhoto = { ...photo, id: photo._id } as { _id?: string; id: string };
        delete newPhoto._id;
        return newPhoto;
    });

    return photos;
}