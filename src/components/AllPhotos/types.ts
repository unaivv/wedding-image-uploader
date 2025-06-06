export interface IPhoto {
    src: string
    width: number
    height: number
    id: string
    alt: string
    userName?: string
    userEmail?: string
}

export interface IPhotosFromBackend {
    createdAt: string
    eventId: string
    fileName: string
    updatedAt: string
    userName: string
    userEmail?: string
    user?: string
    id: string
}