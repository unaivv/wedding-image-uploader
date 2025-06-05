import mongoose, { Schema, Document } from 'mongoose';

export const fileSchema = new Schema(
    {
        fileName: { type: String, required: true },
        eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
        createdAt: { type: Date, default: Date.now },
        user: { type: String, required: true }
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