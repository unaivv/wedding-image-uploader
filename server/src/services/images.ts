import sharp from "sharp";
import { logger } from "./logger";

export const compressImage = async (filePath: string): Promise<string | undefined> => {
    try {
        const buffer = await sharp(filePath)
            .resize({ width: 400, height: 400 })
            .webp({ lossless: true, quality: 70 })
            .toBuffer();
        const newPath = filePath.replace(/(\.\w+)$/, '-compressed.webp');
        await sharp(buffer).toFile(newPath);
        return newPath;
    } catch (error) {
        logger.error('compressImage failed', error);
    }
};

export const convertToWebp = async (filePath: string): Promise<string | undefined> => {
    try {
        const buffer = await sharp(filePath)
            .webp({ lossless: true, quality: 70 })
            .toBuffer();
        const newPath = filePath.replace(/(\.\w+)$/, '.webp');
        await sharp(buffer).toFile(newPath);
        return newPath;
    } catch (error) {
        logger.error('convertToWebp failed', error);
    }
};
