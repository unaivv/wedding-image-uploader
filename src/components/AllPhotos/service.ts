export const getAllPhotos = async (eventId: string, userId?: string) => {
    let url = `${import.meta.env.VITE_BACKEND_URL}/files/get-all?eventId=${eventId}`
    if (userId) {
        url += `&userId=${userId}`;
    }
    const response = await fetch(url, {
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