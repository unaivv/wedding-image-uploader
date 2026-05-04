import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Loader, Message, SelectPicker, useToaster } from 'rsuite';
import { getAdminPhotos, bulkDeletePhotos, sendGalleryEmail, type AdminPhoto, type AdminUser } from '../service';
import { Lightbox } from '../../Lightbox';
import { ConfirmModal } from '../../ConfirmModal';
import { logger } from '../../../utils/logger';
import { cn } from '../../../utils/cn';
import type { IPhoto } from '../../AllPhotos/types';
import styles from './PhotosManager.module.css';

const PhotosManager = () => {
    const toaster = useToaster();
    const [photos, setPhotos] = useState<AdminPhoto[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [deleting, setDeleting] = useState(false);
    const [sendingEmail, setSendingEmail] = useState(false);
    const [filterUser, setFilterUser] = useState<string | null>(null);
    const [lightboxIndex, setLightboxIndex] = useState(-1);
    const [confirm, setConfirm] = useState<{ message: string; confirmLabel: string; danger?: boolean; onConfirm: () => void } | null>(null);
    const pageRef = useRef(1);
    const sentinelRef = useRef<HTMLDivElement>(null);

    const load = useCallback((page: number, userId?: string | null, replace = false) => {
        if (replace) setLoading(true);
        return getAdminPhotos(page, 30, userId ?? undefined)
            .then(data => {
                setPhotos(prev => replace ? data.files : [...prev, ...data.files]);
                setHasMore(data.hasMore);
            })
            .catch((err: unknown) => logger.error('admin photos failed', err))
            .finally(() => { if (replace) setLoading(false); });
    }, []);

    useEffect(() => {
        pageRef.current = 1;
        setSelectedIds(new Set());
        load(1, filterUser, true);
    }, [filterUser, load]);

    useEffect(() => {
        if (!sentinelRef.current || !hasMore || loading) return;
        const observer = new IntersectionObserver(async ([entry]) => {
            if (!entry.isIntersecting || loadingMore) return;
            setLoadingMore(true);
            pageRef.current += 1;
            await load(pageRef.current, filterUser);
            setLoadingMore(false);
        }, { threshold: 0.1 });
        observer.observe(sentinelRef.current);
        return () => observer.disconnect();
    }, [hasMore, loading, loadingMore, filterUser, load]);

    const toSlides = (list: AdminPhoto[]): IPhoto[] => list.map(p => ({
        src: p.compressedSrc,
        fullSrc: p.fullSrc,
        width: 1500,
        height: 1500,
        id: p._id,
        alt: p.userId?.name ?? '',
        user: { _id: p.userId?._id ?? '', name: p.userId?.name ?? '', email: p.userId?.email ?? '', picture: p.userId?.picture ?? '' },
        likedBy: [],
        caption: p.caption,
        isVideo: p.isVideo,
    }));

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const handleBulkDelete = () => {
        setConfirm({
            message: `¿Eliminar ${selectedIds.size} foto${selectedIds.size !== 1 ? 's' : ''}? Esta acción no se puede deshacer.`,
            confirmLabel: 'Eliminar',
            danger: true,
            onConfirm: () => {
                setDeleting(true);
                setConfirm(null);
                bulkDeletePhotos([...selectedIds])
                    .then(() => {
                        setPhotos(prev => prev.filter(p => !selectedIds.has(p._id)));
                        setSelectedIds(new Set());
                        toaster.push(<Message type="success" showIcon closable>Fotos eliminadas</Message>, { placement: 'topEnd' });
                    })
                    .catch((err: unknown) => {
                        logger.error('bulk delete failed', err);
                        toaster.push(<Message type="error" showIcon closable>Error al eliminar</Message>, { placement: 'topEnd' });
                    })
                    .finally(() => setDeleting(false));
            },
        });
    };

    const handleDeleteOne = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setConfirm({
            message: '¿Eliminar esta foto? Esta acción no se puede deshacer.',
            confirmLabel: 'Eliminar',
            danger: true,
            onConfirm: () => {
                setConfirm(null);
                bulkDeletePhotos([id])
                    .then(() => {
                        setPhotos(prev => prev.filter(p => p._id !== id));
                        setSelectedIds(prev => { const next = new Set(prev); next.delete(id); return next; });
                        toaster.push(<Message type="success" showIcon closable>Foto eliminada</Message>, { placement: 'topEnd' });
                    })
                    .catch((err: unknown) => {
                        logger.error('delete one failed', err);
                        toaster.push(<Message type="error" showIcon closable>Error al eliminar</Message>, { placement: 'topEnd' });
                    });
            },
        });
    };

    const handleSendGalleryEmail = () => {
        setConfirm({
            message: 'Se enviará un email con el enlace de la galería a todos los usuarios que hayan subido fotos. ¿Continuar?',
            confirmLabel: 'Enviar',
            onConfirm: () => {
                setSendingEmail(true);
                setConfirm(null);
                sendGalleryEmail(import.meta.env.VITE_EVENT_ID as string)
                    .then(({ sent }) => {
                        toaster.push(
                            <Message type="success" showIcon closable>
                                Email enviado a {sent} {sent === 1 ? 'destinatario' : 'destinatarios'}
                            </Message>,
                            { placement: 'topEnd' }
                        );
                    })
                    .catch((err: unknown) => {
                        logger.error('send gallery email failed', err);
                        toaster.push(<Message type="error" showIcon closable>Error al enviar el email</Message>, { placement: 'topEnd' });
                    })
                    .finally(() => setSendingEmail(false));
            },
        });
    };

    const uniqueUsers: AdminUser[] = [];
    const seenIds = new Set<string>();
    for (const p of photos) {
        if (p.userId && !seenIds.has(p.userId._id)) {
            seenIds.add(p.userId._id);
            uniqueUsers.push(p.userId);
        }
    }

    return (
        <div>
            <div className={styles.toolbar}>
                <h2 className={styles.title}>Fotos</h2>
                <div className={styles.toolbarRight}>
                    <SelectPicker
                        data={uniqueUsers
                            .filter(u => u._id)
                            .map(u => ({ label: u.name || u.email || 'Usuario desconocido', value: u._id }))
                        }
                        value={filterUser}
                        onChange={setFilterUser}
                        placeholder="Filtrar por usuario"
                        cleanable
                        size="sm"
                        style={{ width: 180 }}
                    />
                    <Button size="sm" appearance="ghost" onClick={handleSendGalleryEmail} loading={sendingEmail}>
                        Enviar galería por email
                    </Button>
                    {selectedIds.size > 0
                        ? <Button size="sm" color="red" appearance="ghost" onClick={handleBulkDelete} loading={deleting}>
                            Eliminar ({selectedIds.size})
                          </Button>
                        : <span className={styles.hint}>Click para ver · mantén para seleccionar</span>
                    }
                </div>
            </div>

            {loading && <Loader center content="Cargando fotos..." />}

            {!loading && photos.length === 0 && (
                <p className={styles.empty}>No hay fotos.</p>
            )}

            <div className={styles.grid}>
                {photos.map(photo => (
                    <button
                        key={photo._id}
                        type="button"
                        className={cn(styles.thumb, selectedIds.has(photo._id) && styles.selected)}
                        onClick={() => selectedIds.size > 0 ? toggleSelect(photo._id) : setLightboxIndex(photos.indexOf(photo))}
                        onContextMenu={e => { e.preventDefault(); toggleSelect(photo._id); }}
                    >
                        <img src={photo.compressedSrc} alt="" loading="lazy" />
                        {selectedIds.has(photo._id) && <span className={styles.check}>✓</span>}
                        {photo.isVideo && <span className={styles.videoTag}>▶</span>}
                        <button
                            type="button"
                            className={styles.deleteBtn}
                            onClick={e => handleDeleteOne(e, photo._id)}
                            title="Eliminar foto"
                        >✕</button>
                        <span className={styles.user}>{photo.userId?.name ?? '?'}</span>
                    </button>
                ))}
            </div>

            <div ref={sentinelRef} style={{ height: 1 }} />
            {loadingMore && <Loader style={{ margin: '1em auto', display: 'block' }} />}

            {lightboxIndex >= 0 && (
                <Lightbox
                    slides={toSlides(photos)}
                    index={lightboxIndex}
                    onClose={() => setLightboxIndex(-1)}
                    onIndexChange={setLightboxIndex}
                />
            )}

            <ConfirmModal
                open={confirm !== null}
                message={confirm?.message ?? ''}
                confirmLabel={confirm?.confirmLabel ?? 'Confirmar'}
                danger={confirm?.danger}
                loading={deleting || sendingEmail}
                onConfirm={() => confirm?.onConfirm()}
                onCancel={() => setConfirm(null)}
            />
        </div>
    );
};

export { PhotosManager };
