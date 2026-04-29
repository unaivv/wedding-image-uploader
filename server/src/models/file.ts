import mongoose, { Schema, Document } from 'mongoose';

export const fileSchema = new Schema(
    {
        fullSrc: { type: String, required: true },
        compressedSrc: { type: String, required: true },
        eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
        likedBy: [{ type: Schema.Types.ObjectId, ref: 'User', default: []}],
        caption: { type: String, default: '' },
        isVideo: { type: Boolean, default: false }
    }, 
    {
        timestamps: true,
        versionKey: false
    }
);

export interface IFile extends Document {
    fullSrc: string;
    compressedSrc: string;
    eventId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
    likedBy?: mongoose.Types.ObjectId[];
    caption?: string;
    isVideo?: boolean;
}

const FileModel = mongoose.model<IFile>('File', fileSchema);

export default FileModel;