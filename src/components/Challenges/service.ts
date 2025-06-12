export const getAllChallenges = async (eventId: string) => {
    const url = `${import.meta.env.VITE_BACKEND_URL}/challenge/list?eventId=${eventId}`
    
    const response = await fetch(url, {
        headers: new Headers({
            "ngrok-skip-browser-warning": "69420",
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to fetch photos');
    }

    const data = await response.json();
    const challenges = data.map((challenge: { _id: string; }) => {
        const newChallenge = { ...challenge, id: challenge._id } as { _id?: string; id: string };
        delete newChallenge._id;
        return newChallenge;
    });

    return challenges;
}