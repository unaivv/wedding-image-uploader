import { v2 as cloudinary } from 'cloudinary';
import { logger } from './logger';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadFileToCloudinary = async (filePath: string, folder = ''): Promise<string> => {
    const result = await cloudinary.uploader.upload(filePath, {
        folder,
        resource_type: 'auto',
        timeout: 120000
    });
    if (!result.secure_url) throw new Error('Cloudinary returned no secure_url');
    return result.secure_url;
}

/** Extracts the Cloudinary public_id (with folder) from a secure_url */
export const extractPublicId = (url: string): string => {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
    return match?.[1] ?? '';
};

export const deleteFileFromCloudinary = async (publicId: string, resourceType: 'image' | 'video' = 'image'): Promise<boolean> => {
    try {
        const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
        return result.result === 'ok';
    } catch (error) {
        console.error('Error deleting file from Cloudinary:', error);
        return false;
    }
}
