import { get } from "../../../utils/fetch";

export const deleteParticipation = async (challengeId: string, userId: string) => {
    const url = `${import.meta.env.VITE_BACKEND_URL}/challenge/delete-participant?challengeId=${challengeId}&userId=${userId}`;

    const data = await get<{ error?: string }>({ url, auth: true });
    if (data.error) {
        throw new Error(data.error);
    }
    return data;
}