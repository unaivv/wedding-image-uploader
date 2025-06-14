import { get } from "../../utils/fetch";
import type { Challenge } from "./types";

export const getAllChallenges = async (eventId: string) => {
    const url = `${import.meta.env.VITE_BACKEND_URL}/challenge/list?eventId=${eventId}`

    const allChallenges = await get<Challenge[]>({ url, auth: true });
    const challenges: Challenge[] = allChallenges.map((challenge) => {
        const newChallenge = { ...challenge, id: challenge._id ?? "" };
        delete newChallenge._id;
        return newChallenge;
    });

    return challenges;
}