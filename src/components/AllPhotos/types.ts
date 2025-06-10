export interface IUser {
    email: string
    fullName: string
    _id: string
    createdAt: string
    updatedAt: string
    picture?: string
    name?: string
}

export interface IPhoto {
    src: string
    width: number
    height: number
    id: string
    alt: string
    user: IUser
    likedBy: string[]
}

export interface IPhotosFromBackend {
    createdAt: string
    eventId: string
    compressedSrc: string
    fullSrc: string
    updatedAt: string
    id: string
    userId: IUser
    likedBy: string[]
}