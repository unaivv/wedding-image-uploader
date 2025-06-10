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
    },
    getUserEmail() {
        try{
            const token = auth.getToken()
            if (!token) {
                return null;
            }
            return JSON.parse(atob(token.split('.')[1])).email
        }catch(e){
            console.error('Error parsing token:', e);
            return null;
        }
    },
    getUserName() {
        try{
            const token = auth.getToken()
            if (!token) {
                return null;
            }
            return JSON.parse(atob(token.split('.')[1])).given_name
        }catch(e){
            console.error('Error parsing token:', e);
            return null;
        }
    },
    setUserId(userId: string) {
        localStorage.setItem('user_id', userId);
    },
    getUserId(): string | null {
        return localStorage.getItem('user_id');
    },
    async login(token: string) {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/user/login?token=${token}`,{
            headers:{
                "ngrok-skip-browser-warning": "69420", //TODO: ONLY FOR DEV
            }
        });
        if(!response.ok) {
            console.error('Login failed:', response.statusText);
            return false
        }

        const data = await response.json();
        if (data.error) {
            console.error('Login error:', data.error);
            return false;
        }
        auth.setUserId(data._id);
        auth.saveToken(token);
        return true;
    }
};