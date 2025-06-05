export interface IPhoto {
    src: string
    width: number
    height: number
    id: string
    alt: string
    user?: string
}

export interface IPhotosFromBackend {
    createdAt: string
    eventId: string
    fileName: string
    updatedAt: string
    user: string
    id: string
}