import { useEffect, useRef, useState } from 'react';
import { Image, Loader, Message, useToaster } from 'rsuite';
import { auth } from '../../utils/auth';
import { getComments, postComment, deleteComment, type IComment } from './service';
import { logger } from '../../utils/logger';
import styles from './Comments.module.css';
import CloseIcon from '@rsuite/icons/Close';

interface CommentsProps {
    fileId: string;
    onCommentDeleted?: (fileId: string) => void;
}

const Comments = ({ fileId, onCommentDeleted }: CommentsProps) => {
    const toaster = useToaster();
    const [comments, setComments] = useState<IComment[]>([]);
    const [loading, setLoading] = useState(true);
    const [text, setText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!fileId) return;
        setLoading(true);
        setComments([]);
        console.log('[Comments] loading for fileId:', fileId);
        getComments(fileId)
            .then((data) => {
                console.log('[Comments] loaded:', data.length);
                setComments(data);
            })
            .catch((err: unknown) => { logger.error('load comments failed', err); })
            .finally(() => setLoading(false));
    }, [fileId]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [comments]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim() || submitting) return;
        setSubmitting(true);
        postComment(fileId, text.trim())
            .then(comment => {
                setComments(prev => [...prev, comment]);
                setText('');
            })
            .catch((err: unknown) => {
                logger.error('post comment failed', err);
                toaster.push(<Message type="error" showIcon closable>Error al publicar el comentario</Message>, { placement: 'topEnd' });
            })
            .finally(() => setSubmitting(false));
    };

    const handleDelete = (commentId: string) => {
        deleteComment(commentId)
            .then(() => {
                setComments(prev => prev.filter(c => c._id !== commentId));
                onCommentDeleted?.(fileId);
            })
            .catch((err: unknown) => {
                logger.error('delete comment failed', err);
                toaster.push(<Message type="error" showIcon closable>No se pudo eliminar el comentario</Message>, { placement: 'topEnd' });
            });
    };

    const userId = auth.getUserId();

    return (
        <div className={styles.panel}>
            <h3 className={styles.title}>Comentarios {comments.length > 0 && <span className={styles.count}>{comments.length}</span>}</h3>
            <div className={styles.list}>
                {loading && <Loader center content="Cargando..." />}
                {!loading && comments.length === 0 && (
                    <p className={styles.empty}>Sé el primero en comentar</p>
                )}
                {comments.map(c => {
                    const author = c.userId?.name || c.userId?.email?.split('@')[0] || 'Usuario';
                    const isOwn = c.userId?._id === userId;
                    return (
                        <div key={c._id} className={styles.comment}>
                            <Image src={c.userId?.picture} alt={author} circle style={{ width: 28, height: 28, flexShrink: 0 }} />
                            <div className={styles.bubble}>
                                <span className={styles.author}>{author}</span>
                                <span className={styles.commentText}>{c.text}</span>
                            </div>
                            {isOwn && (
                                <button type="button" className={styles.deleteBtn} onClick={() => handleDelete(c._id)}>
                                    <CloseIcon fontSize="0.7em" />
                                </button>
                            )}
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>
            <form className={styles.form} onSubmit={handleSubmit}>
                <input
                    className={styles.input}
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder="Escribe un comentario..."
                    maxLength={500}
                    disabled={submitting}
                />
                <button type="submit" className={styles.send} disabled={!text.trim() || submitting}>
                    {submitting ? '...' : '→'}
                </button>
            </form>
        </div>
    );
};

export { Comments };
