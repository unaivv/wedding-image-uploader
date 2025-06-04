//create util to save in local folder files
import fs from 'fs';
import path from 'path';

export const saveFile = (filePath: string, data: Buffer): boolean => {
    try {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(filePath, data);
        console.log(`File saved at ${filePath}`);
        return true
    } catch (e:unknown) {
        console.error(`Error saving file at ${filePath}:`, e);
        return false
    }
}

export const getFile = (filePath: string): Buffer | null => {
    if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath);
    } else {
        console.error(`File not found: ${filePath}`);
        return null;
    }
}

export const deleteFile = (filePath: string): boolean => {
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`File deleted: ${filePath}`);
        return true;
    } else {
        console.error(`File not found: ${filePath}`);
        return false;
    }
}