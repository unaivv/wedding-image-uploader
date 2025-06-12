import type { IPhotosFromBackend, IUser } from "../AllPhotos/types";

export interface IParticipant {
    file: IPhotosFromBackend
    user: IUser;
    upladedAt: Date;

}

export type Challenge = {
    id: string;
    title: string;
    description: string;
    topic: string;
    endDate: string;
    participants: IParticipant[];
};