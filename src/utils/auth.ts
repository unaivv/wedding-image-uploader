const TOKEN_KEY = 'google_token';

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
    }
};