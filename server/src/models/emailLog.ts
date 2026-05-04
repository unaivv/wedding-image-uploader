import mongoose, { Schema, Document } from 'mongoose';

export interface IEmailLog extends Document {
    sentAt: Date;
    recipientsCount: number;
    link: string;
    status: 'sent' | 'failed';
    errorMessage?: string;
}

const emailLogSchema = new Schema({
    sentAt: { type: Date, default: Date.now },
    recipientsCount: { type: Number, required: true },
    link: { type: String, required: true },
    status: { type: String, enum: ['sent', 'failed'], required: true },
    errorMessage: { type: String },
}, { versionKey: false });

const EmailLogModel = mongoose.model<IEmailLog>('EmailLog', emailLogSchema);

export default EmailLogModel;
