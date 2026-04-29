import { get } from "../../utils/fetch";
import { auth } from "../../utils/auth";
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

export const getPhotoById = async (id: string): Promise<IPhotosFromBackend> => {
    const data = await get<IPhotosFromBackend & { _id?: string }>({
        url: `${import.meta.env.VITE_BACKEND_URL}/files/${id}`,
        auth: true,
    });
    const { _id, ...rest } = data;
    return { ...rest, id: _id ?? rest.id } as IPhotosFromBackend;
};

export const downloadPhoto = async (url: string, filename: string): Promise<void> => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Download failed: ${response.status}`);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(objectUrl);
};

export const downloadSelectedPhotos = async (photos: { url: string; id: string }[]): Promise<void> => {
    for (const { url, id } of photos) {
        await downloadPhoto(url, `foto-${id}.jpg`);
    }
};

export const downloadAllPhotos = async (eventId: string): Promise<void> => {
    const url = `${import.meta.env.VITE_BACKEND_URL}/files/download-all?eventId=${eventId}`;
    const response = await fetch(url, {
        headers: {
            userId: auth.getUserId() || '',
            'google-token': auth.getToken() || '',
        },
    });
    if (!response.ok) throw new Error(`Download failed: ${response.status}`);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = 'fotos-boda.zip';
    anchor.click();
    URL.revokeObjectURL(objectUrl);
};
