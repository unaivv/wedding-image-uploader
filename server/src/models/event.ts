import mongoose, { Schema, Document } from 'mongoose';

export const eventSchema = new Schema(
    {
        name: { type: String, required: true },
        date: { type: Date, required: true },
        location: { type: String, required: true },
        description: { type: String, required: false, default: '' },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
    }, 
    {
        timestamps: true,
        versionKey: false
    }
);

export interface IEvent extends Document {
    name: string;
    date: Date;
    location: string;
    description?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const EventModel = mongoose.model<IEvent>('Event', eventSchema);

export default EventModel;