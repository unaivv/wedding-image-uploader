import { get } from "../../utils/fetch";
import type { IPhotosFromBackend } from "./types";

export interface PhotosPage {
    files: IPhotosFromBackend[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}

export const getAllPhotos = async (eventId: string, page = 1, limit = 20, userId?: string): Promise<PhotosPage> => {
    const params: Record<string, string> = { eventId, page: String(page), limit: String(limit) };
    if (userId) params.userId = userId;

    const data = await get<{ files: (IPhotosFromBackend & { _id?: string })[]; total: number; page: number; limit: number; hasMore: boolean }>({
        url: `${import.meta.env.VITE_BACKEND_URL}/files/get-all`,
        params,
        auth: true,
    });

    return {
        ...data,
        files: data.files.map((photo) => {
            const { _id, ...rest } = photo;
            return { ...rest, id: _id ?? rest.id } as IPhotosFromBackend;
        }),
    };
};
