import { get } from "../../utils/fetch";
import type { IPhotosFromBackend } from "./types";

export const getAllPhotos = async (eventId: string, userId?: string) => {
    let url = `${import.meta.env.VITE_BACKEND_URL}/files/get-all?eventId=${eventId}`
    if (userId) {
        url += `&userId=${userId}`;
    }
    const allPhotos = await get<IPhotosFromBackend[]>({ url, auth: true });
    const photos: IPhotosFromBackend[] = allPhotos.map((photo) => {
        const { _id, ...rest } = photo;
        return { ...rest, id: _id } as IPhotosFromBackend;
    });

    return photos;
}