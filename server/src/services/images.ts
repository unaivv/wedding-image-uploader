import sharp from "sharp";
import { logger } from "./logger";

export const compressImage = async (filePath: string): Promise<string | undefined> => {
    try {
        const newPath = filePath.replace(/(\.\w+)$/, '-compressed.webp');
        await sharp(filePath)
            .resize({ width: 400, height: 400, fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 60 })
            .toFile(newPath);
        return newPath;
    } catch (error) {
        logger.error('compressImage failed', error);
    }
};

export const convertToWebp = async (filePath: string): Promise<string | undefined> => {
    try {
        const newPath = filePath.replace(/(\.\w+)$/, '.webp');
        await sharp(filePath)
            .webp({ quality: 82 })
            .toFile(newPath);
        return newPath;
    } catch (error) {
        logger.error('convertToWebp failed', error);
    }
};
