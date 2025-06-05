export const getAllPhotos = async (eventId: string, user: string) => {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/files/get-all?eventId=${eventId}&user=${user}`, {
        headers: new Headers({
            "ngrok-skip-browser-warning": "69420",
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to fetch photos');
    }

    const data = await response.json();
    const photos = data.map((photo: { _id: string; }) => {
        const newPhoto = { ...photo, id: photo._id } as { _id?: string; id: string };
        delete newPhoto._id;
        return newPhoto;
    });

    return photos;
}