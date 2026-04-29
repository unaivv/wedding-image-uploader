import { get } from "./fetch";

const TOKEN_KEY = 'google_token';
const USER_ID_KEY = 'user_id';

export interface UserAuth {
    createdAt: string
    email: string
    fullName: string
    name: string
    picture: string
    updatedAt: string
    _id: string
}

const decodePayload = (token: string): Record<string, unknown> | null => {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch {
        return null;
    }
};

export const auth = {
    isLoggedIn(): boolean {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) return false;
        const payload = decodePayload(token);
        if (!payload) return false;
        const exp = payload['exp'] as number | undefined;
        if (exp && Date.now() / 1000 > exp) {
            auth.logout();
            return false;
        }
        return true;
    },
    saveToken(token: string) {
        localStorage.setItem(TOKEN_KEY, token);
    },
    getToken(): string | null {
        if (!auth.isLoggedIn()) return null;
        return localStorage.getItem(TOKEN_KEY);
    },
    logout() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_ID_KEY);
        window.location.href = '/login';
    },
    getUserEmail(): string | null {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) return null;
        return (decodePayload(token)?.['email'] as string) ?? null;
    },
    getUserName(): string | null {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) return null;
        return (decodePayload(token)?.['given_name'] as string) ?? null;
    },
    setUserId(userId: string) {
        localStorage.setItem(USER_ID_KEY, userId);
    },
    getUserId(): string | null {
        return localStorage.getItem(USER_ID_KEY);
    },
    async login(token: string) {
        const user = await get<UserAuth>({
            url: `${import.meta.env.VITE_BACKEND_URL}/user/login?token=${token}`
        });
        auth.setUserId(user._id);
        auth.saveToken(token);
        return true;
    }
};
