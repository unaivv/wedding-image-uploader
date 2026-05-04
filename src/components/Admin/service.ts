import { auth } from '../../utils/auth';

const BASE = `${import.meta.env.VITE_BACKEND_URL}/admin`;

const headers = (): Record<string, string> => ({
    'Content-Type': 'application/json',
    userId: auth.getUserId() || '',
    'google-token': auth.getToken() || '',
});

// ── Types ──────────────────────────────────────────────────
export interface AdminStats {
    totalPhotos: number;
    totalUsers: number;
    totalComments: number;
    photosToday: number;
    totalParticipations: number;
}

export interface AdminEvent {
    _id: string;
    name: string;
    date: string;
    location: string;
    description: string;
}

export interface AdminChallenge {
    _id: string;
    title: string;
    description?: string;
    topic?: string;
    endDate: string;
    event: string;
    participants: { user: AdminUser; file: AdminPhoto; uploadedAt: string }[];
    winner?: AdminUser;
}

export interface AdminUser {
    _id: string;
    name: string;
    fullName: string;
    email: string;
    picture?: string;
    isAdmin?: boolean;
    photoCount?: number;
    createdAt?: string;
}

export interface AdminPhoto {
    _id: string;
    id: string;
    fullSrc: string;
    compressedSrc: string;
    isVideo?: boolean;
    caption?: string;
    userId: AdminUser;
    createdAt?: string;
}

// ── Stats ──────────────────────────────────────────────────
export const getStats = async (): Promise<AdminStats> => {
    const res = await fetch(`${BASE}/stats`, { headers: headers() });
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json() as Promise<AdminStats>;
};

// ── Event ──────────────────────────────────────────────────
export const getEvent = async (id: string): Promise<AdminEvent> => {
    const res = await fetch(`${BASE}/event/${id}`, { headers: headers() });
    if (!res.ok) throw new Error('Failed to fetch event');
    const data = await res.json() as { event: AdminEvent };
    return data.event;
};

export const updateEvent = async (id: string, body: Partial<AdminEvent>): Promise<AdminEvent> => {
    const res = await fetch(`${BASE}/event/${id}`, {
        method: 'PATCH', headers: headers(), body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('Failed to update event');
    const data = await res.json() as { event: AdminEvent };
    return data.event;
};

// ── Challenges ─────────────────────────────────────────────
export const getChallenges = async (eventId: string): Promise<AdminChallenge[]> => {
    const res = await fetch(`${BASE}/challenges?eventId=${eventId}`, { headers: headers() });
    if (!res.ok) throw new Error('Failed to fetch challenges');
    const data = await res.json() as { challenges: AdminChallenge[] };
    return data.challenges;
};

export const createChallenge = async (body: {
    title: string; description?: string; topic?: string; endDate: string; eventId: string;
}): Promise<AdminChallenge> => {
    const res = await fetch(`${BASE}/challenges`, {
        method: 'POST', headers: headers(), body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('Failed to create challenge');
    const data = await res.json() as { challenge: AdminChallenge };
    return data.challenge;
};

export const updateChallenge = async (id: string, body: Partial<AdminChallenge>): Promise<AdminChallenge> => {
    const res = await fetch(`${BASE}/challenges/${id}`, {
        method: 'PATCH', headers: headers(), body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('Failed to update challenge');
    const data = await res.json() as { challenge: AdminChallenge };
    return data.challenge;
};

export const deleteChallenge = async (id: string): Promise<void> => {
    const res = await fetch(`${BASE}/challenges/${id}`, { method: 'DELETE', headers: headers() });
    if (!res.ok) throw new Error('Failed to delete challenge');
};

export const setWinner = async (challengeId: string, userId: string): Promise<AdminChallenge> => {
    const res = await fetch(`${BASE}/challenges/${challengeId}/winner`, {
        method: 'PATCH', headers: headers(), body: JSON.stringify({ userId }),
    });
    if (!res.ok) throw new Error('Failed to set winner');
    const data = await res.json() as { challenge: AdminChallenge };
    return data.challenge;
};

// ── Users ──────────────────────────────────────────────────
export const getUsers = async (): Promise<AdminUser[]> => {
    const res = await fetch(`${BASE}/users`, { headers: headers() });
    if (!res.ok) throw new Error('Failed to fetch users');
    const data = await res.json() as { users: AdminUser[] };
    return data.users;
};

export const toggleAdmin = async (userId: string, isAdmin: boolean): Promise<AdminUser> => {
    const res = await fetch(`${BASE}/users/${userId}/admin`, {
        method: 'PATCH', headers: headers(), body: JSON.stringify({ isAdmin }),
    });
    if (!res.ok) throw new Error('Failed to toggle admin');
    const data = await res.json() as { user: AdminUser };
    return data.user;
};

// ── Photos ─────────────────────────────────────────────────
export const getAdminPhotos = async (page = 1, limit = 30, userId?: string): Promise<{
    files: AdminPhoto[]; total: number; hasMore: boolean;
}> => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (userId) params.set('userId', userId);
    const res = await fetch(`${BASE}/photos?${params.toString()}`, { headers: headers() });
    if (!res.ok) throw new Error('Failed to fetch photos');
    return res.json() as Promise<{ files: AdminPhoto[]; total: number; hasMore: boolean }>;
};

export const bulkDeletePhotos = async (ids: string[]): Promise<void> => {
    const res = await fetch(`${BASE}/photos`, {
        method: 'DELETE', headers: headers(), body: JSON.stringify({ ids }),
    });
    if (!res.ok) throw new Error('Failed to delete photos');
};

// ── Gallery email ──────────────────────────────────────────
export const sendGalleryEmail = async (eventId: string): Promise<{ sent: number; link: string }> => {
    const res = await fetch(`${BASE}/send-gallery-link`, {
        method: 'POST', headers: headers(), body: JSON.stringify({ eventId }),
    });
    if (!res.ok) throw new Error('Failed to send gallery email');
    return res.json() as Promise<{ sent: number; link: string }>;
};
