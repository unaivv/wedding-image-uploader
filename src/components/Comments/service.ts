import { auth } from '../../utils/auth';

export interface ICommentUser {
    _id: string;
    name?: string;
    email: string;
    picture?: string;
}

export interface IComment {
    _id: string;
    fileId: string;
    userId: ICommentUser;
    text: string;
    createdAt: string;
}

const headers = () => ({
    'Content-Type': 'application/json',
    userId: auth.getUserId() || '',
    'google-token': auth.getToken() || '',
});

export const getComments = async (fileId: string): Promise<IComment[]> => {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/comments/${fileId}`, { headers: headers() });
    if (!res.ok) throw new Error('Failed to fetch comments');
    const data = await res.json() as { comments: IComment[] };
    return data.comments;
};

export const postComment = async (fileId: string, text: string): Promise<IComment> => {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/comments/${fileId}`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error('Failed to post comment');
    const data = await res.json() as { comment: IComment };
    return data.comment;
};

export const getCommentCounts = async (fileIds: string[]): Promise<Record<string, number>> => {
    if (fileIds.length === 0) return {};
    const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/comments/counts?fileIds=${fileIds.join(',')}`,
        { headers: headers() }
    );
    if (!res.ok) throw new Error('Failed to fetch comment counts');
    const data = await res.json() as { counts: Record<string, number> };
    return data.counts;
};

export const deleteComment = async (commentId: string): Promise<void> => {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/comments/${commentId}`, {
        method: 'DELETE',
        headers: headers(),
    });
    if (!res.ok) throw new Error('Failed to delete comment');
};
