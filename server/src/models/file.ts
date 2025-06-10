import mongoose, { Schema, Document } from 'mongoose';

export const fileSchema = new Schema(
    {
        fullSrc: { type: String, required: true },
        compressedSrc: { type: String, required: true },
        eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
    }, 
    {
        timestamps: true,
        versionKey: false
    }
);

export interface IFile extends Document {
    fileName: string;
    eventId: mongoose.Types.ObjectId;
    createdAt?: Date;
}

const FileModel = mongoose.model<IFile>('File', fileSchema);

export default FileModel;