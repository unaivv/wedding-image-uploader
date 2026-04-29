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

export const deleteFileFromCloudinary = async (publicId: string): Promise<boolean> => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result.result === 'ok';
    } catch (error) {
        console.error('Error deleting file from Cloudinary:', error);
        return false;
    }
}
