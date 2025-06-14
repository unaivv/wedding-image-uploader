import { get } from "../../utils/fetch";

export const getAllChallenges = async (eventId: string) => {
    const url = `${import.meta.env.VITE_BACKEND_URL}/challenge/list?eventId=${eventId}`

    const allChallenges = await get<{ _id: string; }[]>({ url, auth: true });
    const challenges = allChallenges.map((challenge: { _id: string; }) => {
        const newChallenge = { ...challenge, id: challenge._id } as { _id?: string; id: string };
        delete newChallenge._id;
        return newChallenge;
    });

    return challenges;
}