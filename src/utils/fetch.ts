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
        }

        const fetchOptions: RequestInit = {
            ...options,
            headers,
        };

        const response = await fetch(url, fetchOptions);

        if (!response.ok) {
            console.error('Fetch error:', response.statusText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        if (error instanceof Error && error.message.includes('HTTP error! status: 403')) {
            userAuth.logout();
        }
        throw error;
    }
};

export const post = async <T>({
    url,
    body,
    options = {},
    auth = false
}: {
    url: string;
    body: unknown;
    options?: RequestInit;
    auth?: boolean;
}): Promise<T> => {
    const fetchOptions: RequestInit = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        },
        body: JSON.stringify(body),
        ...options,
    };
    return fetchService<T>({ url, options: fetchOptions, auth });
};

export const get = async <T>({
    url,
    params = {},
    options = {},
    auth = false
}: {
    url: string;
    params?: Record<string, string>;
    options?: RequestInit;
    auth?: boolean;
}): Promise<T> => {
    const queryString = new URLSearchParams(params).toString();
    const fullUrl = queryString ? `${url}?${queryString}` : url;
    return fetchService<T>({ url: fullUrl, options, auth }) as Promise<T>;
};