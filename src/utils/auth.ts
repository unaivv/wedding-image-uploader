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

export const auth = {
    isLoggedIn(): boolean {
        return !!localStorage.getItem(TOKEN_KEY);
    },
    saveToken(token: string) {
        localStorage.setItem(TOKEN_KEY, token);
    },
    getToken(): string | null {
        return localStorage.getItem(TOKEN_KEY);
    },
    logout() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_ID_KEY);
        window.location.href = `/login`;
    },
    getUserEmail() {
        try {
            const token = auth.getToken()
            if (!token) {
                return null;
            }
            return JSON.parse(atob(token.split('.')[1])).email
        } catch (e) {
            console.error('Error parsing token:', e);
            return null;
        }
    },
    getUserName() {
        try {
            const token = auth.getToken()
            if (!token) {
                return null;
            }
            return JSON.parse(atob(token.split('.')[1])).given_name
        } catch (e) {
            console.error('Error parsing token:', e);
            return null;
        }
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