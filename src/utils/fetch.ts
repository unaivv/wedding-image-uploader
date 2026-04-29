import { auth as userAuth } from './auth';

interface FetchServiceParams {
    url: string;
    options?: RequestInit;
    auth?: boolean;
}

const fetchService = async <T>({
    url,
    options = {},
    auth = false
}: FetchServiceParams): Promise<T> => {
    try {
        const headers: Record<string, string> = {
            ...(options.headers as Record<string, string> || {}),
        };

        if (auth) {
            headers['userId'] = userAuth.getUserId() || '';
            headers['google-token'] = userAuth.getToken() || '';
        }

        const response = await fetch(url, { ...options, headers });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json() as T;
    } catch (error) {
        if (error instanceof Error && (error.message.includes('status: 401') || error.message.includes('status: 403'))) {
            userAuth.logout();
        }
        throw error;
    }
};

export const get = async <T>({ url, params = {}, options = {}, auth = false }: {
    url: string; params?: Record<string, string>; options?: RequestInit; auth?: boolean;
}): Promise<T> => {
    const qs = new URLSearchParams(params).toString();
    return fetchService<T>({ url: qs ? `${url}?${qs}` : url, options, auth });
};

export const post = async <T>({ url, body, options = {}, auth = false }: {
    url: string; body: unknown; options?: RequestInit; auth?: boolean;
}): Promise<T> => fetchService<T>({
    url,
    options: { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), ...options },
    auth,
});

export const patch = async <T>({ url, body = {}, auth = false }: {
    url: string; body?: unknown; auth?: boolean;
}): Promise<T> => fetchService<T>({
    url,
    options: { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
    auth,
});

export const del = async <T>({ url, auth = false }: {
    url: string; auth?: boolean;
}): Promise<T> => fetchService<T>({ url, options: { method: 'DELETE' }, auth });
