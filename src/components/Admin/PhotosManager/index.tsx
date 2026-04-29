import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Loader, Message, SelectPicker, useToaster } from 'rsuite';
import { getAdminPhotos, bulkDeletePhotos, type AdminPhoto, type AdminUser } from '../service';
import { logger } from '../../../utils/logger';
import { cn } from '../../../utils/cn';
import styles from './PhotosManager.module.css';

const PhotosManager = () => {
    const toaster = useToaster();
    const [photos, setPhotos] = useState<AdminPhoto[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [deleting, setDeleting] = useState(false);
    const [filterUser, setFilterUser] = useState<string | null>(null);
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

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const handleBulkDelete = () => {
        if (!window.confirm(`¿Eliminar ${selectedIds.size} fotos? Esta acción no se puede deshacer.`)) return;
        setDeleting(true);
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
                        data={uniqueUsers.map(u => ({ label: u.name || u.email, value: u._id }))}
                        value={filterUser}
                        onChange={setFilterUser}
                        placeholder="Filtrar por usuario"
                        cleanable
                        size="sm"
                        style={{ width: 180 }}
                    />
                    {selectedIds.size > 0 && (
                        <Button size="sm" color="red" appearance="ghost" onClick={handleBulkDelete} loading={deleting}>
                            Eliminar ({selectedIds.size})
                        </Button>
                    )}
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
                        onClick={() => toggleSelect(photo._id)}
                    >
                        <img src={photo.compressedSrc} alt="" loading="lazy" />
                        {selectedIds.has(photo._id) && <span className={styles.check}>✓</span>}
                        {photo.isVideo && <span className={styles.videoTag}>▶</span>}
                        <span className={styles.user}>{photo.userId?.name ?? '?'}</span>
                    </button>
                ))}
            </div>

            <div ref={sentinelRef} style={{ height: 1 }} />
            {loadingMore && <Loader style={{ margin: '1em auto', display: 'block' }} />}
        </div>
    );
};

export { PhotosManager };
