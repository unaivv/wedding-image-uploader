export const deleteParticipation = async (challengeId: string, userId: string) => {
    const url = `${import.meta.env.VITE_BACKEND_URL}/challenge/delete-participant?challengeId=${challengeId}&userId=${userId}`;

    const response = await fetch(url, {
        headers: new Headers({
            "ngrok-skip-browser-warning": "69420",
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to fetch photos');
    }

    const data = await response.json();
    if (data.error) {
        throw new Error(data.error);
    }
    return data;
}