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
            resource_type: 'auto'
        });
        return result.secure_url || false;
    } catch (error) {
        console.error('Error uploading file to Cloudinary:', error);
        return false;
    }
}