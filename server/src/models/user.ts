import mongoose, { Schema, Document } from 'mongoose';

export const userSchema = new Schema(
    {
        picture: {type: String, required: false},
        email: {type: String, required: true},
        fullName: {type: String, required: true},
        name: {type: String, required: true}, 
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
    }, 
    {
        timestamps: true,
        versionKey: false
    }
);

export interface IUser extends Document {
    fileName: string;
    eventId: mongoose.Types.ObjectId;
    createdAt?: Date;
}

const UserModel = mongoose.model<IUser>('User', userSchema);

export default UserModel;