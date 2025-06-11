import mongoose, { Schema, Document } from 'mongoose';

export const challengeSchema = new Schema(
    {
        title: { type: String, required: true },
        event: { type: mongoose.Types.ObjectId, ref: 'Event', required: true },
        description: { type: String, required: false },
        endDate: { type: Date, required: true },
        topic: { type: String, required: false },
        participants: [
            {
                user: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
                file: { type: mongoose.Types.ObjectId, ref: 'File', required: true },
                uploadedAt: { type: Date, default: Date.now }
            }
        ],
        winner: { type: mongoose.Types.ObjectId, ref: 'User', required: false },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
    }, 
    {
        timestamps: true,
        versionKey: false
    }
);

export interface IChallenge extends Document {
    title: string;
    event: mongoose.Types.ObjectId;
    description?: string;
    endDate: Date;
    topic: string;
    participants: {
        user: mongoose.Types.ObjectId;
        file: mongoose.Types.ObjectId;
        uploadedAt?: Date;
    }[];
    winner?: mongoose.Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}

const ChallengeModel = mongoose.model<IChallenge>('Challenge', challengeSchema);

export default ChallengeModel;