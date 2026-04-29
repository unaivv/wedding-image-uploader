import mongoose, { Schema, Document } from 'mongoose';

export const commentSchema = new Schema(
    {
        fileId: { type: Schema.Types.ObjectId, ref: 'File', required: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        text: { type: String, required: true, maxlength: 500 },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

export interface IComment extends Document {
    fileId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    text: string;
    createdAt?: Date;
}

const CommentModel = mongoose.model<IComment>('Comment', commentSchema);

export default CommentModel;
