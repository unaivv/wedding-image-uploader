import { v2 as cloudinary } from 'cloudinary';

export const uploadFileToCloudinary = async (filePath: string, folder = ''): Promise<boolean | string> => {
    cloudinary.config({
        cloud_name: 'dbid6no6r',
        api_key: '875931171629178',
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder: folder,
            resource_type: 'auto',
            timeout: 120000
        });
        return result.secure_url || false;
    } catch (error) {
        console.error('Error uploading file to Cloudinary:', error);
        return false;
    }
}

export const deleteFileFromCloudinary = async (publicId: string): Promise<boolean> => {
    cloudinary.config({
        cloud_name: 'dbid6no6r',
        api_key: '875931171629178',
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result.result === 'ok';
    } catch (error) {
        console.error('Error deleting file from Cloudinary:', error);
        return false;
    }
}