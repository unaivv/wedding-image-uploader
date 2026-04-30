import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getAllPhotos, downloadAllPhotos, downloadSelectedPhotos } from "./service";
import { RowsPhotoAlbum } from "react-photo-album";
import "react-photo-album/rows.css";
import styles from './allPhotos.module.css';
import { auth } from "../../utils/auth";
import { Button, Loader, Message, Placeholder, SelectPicker, Toggle, useToaster } from "rsuite";
import { Photo } from "../Photo";
import { Lightbox } from "../Lightbox";
import type { IPhoto, IPhotosFromBackend, IUser } from "./types";
import { Link } from "react-router-dom";
import PlusIcon from '@rsuite/icons/Plus';
import ReloadIcon from '@rsuite/icons/Reload';
import FileDownloadIcon from '@rsuite/icons/FileDownload';
import HeartIcon from '@rsuite/icons/Heart';
import CalendarIcon from '@rsuite/icons/Calendar';
import PlayOutlineIcon from '@rsuite/icons/PlayOutline';
import PauseOutlineIcon from '@rsuite/icons/PauseOutline';
import { useSSE } from "../../hooks/useSSE";
import { logger } from "../../utils/logger";
import type { IComment } from "../Comments/service";
import { getCommentCounts } from "../Comments/service";

const SLIDESHOW_SPEEDS = { slow: 5000, normal: 3000, fast: 1500 } as const;
type SlideshowSpeed = keyof typeof SLIDESHOW_SPEEDS;

const PAGE_LIMIT = 20;

const toPhoto = (photo: IPhotosFromBackend, fullRes: boolean): IPhoto => ({
    src: fullRes ? photo.fullSrc : photo.compressedSrc,
    fullSrc: photo.fullSrc,
    width: fullRes ? 1500 : 200,
    height: fullRes ? 1500 : 200,
    id: photo.id,
    alt: fullRes ? photo.fullSrc : '',
    user: photo.userId,
    likedBy: photo.likedBy || [],
    caption: photo.caption,
    createdAt: photo.createdAt,
    isVideo: photo.isVideo,
});

const objectIdToDate = (id: string): number => {
    const ts = parseInt(id.substring(0, 8), 16);
    return Number.isNaN(ts) ? 0 : ts * 1000;
};

const AllPhotos = () => {
    const toaster = useToaster();
    const [searchParams, setSearchParams] = useSearchParams();

    const [photos, setPhotos] = useState<IPhoto[]>([]);
    const [lightboxPhotos, setLightboxPhotos] = useState<IPhoto[]>([]);
    const [index, setIndex] = useState(-1);
    const [orderByLikes, setOrderByLikes] = useState(false);
    const [seeAllFotos, setAllPhotos] = useState<'true' | 'false'>('true');
    const [refreshKey, setRefreshKey] = useState(0);
    const [downloading, setDownloading] = useState(false);
    const [downloadingSelected, setDownloadingSelected] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [slideshowActive, setSlideshowActive] = useState(false);
    const [slideshowSpeed, setSlideshowSpeed] = useState<SlideshowSpeed>('normal');
    const slideshowRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});

    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState(false);
    const pageRef = useRef(1);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const initialPhotoOpened = useRef(false);

    useEffect(() => {
        pageRef.current = 1;
        setPhotos([]);
        setLightboxPhotos([]);
        setLoading(true);
        setError(false);
        initialPhotoOpened.current = false;

        const userId = auth.getUserId();
        if (!auth.isLoggedIn() || !userId) { setLoading(false); return; }

        getAllPhotos(import.meta.env.VITE_EVENT_ID, 1, PAGE_LIMIT, seeAllFotos === 'true' ? undefined : userId)
            .then(async data => {
                setPhotos(data.files.map(p => toPhoto(p, false)));
                setLightboxPhotos(data.files.map(p => toPhoto(p, true)));
                setHasMore(data.hasMore);
                const counts = await getCommentCounts(data.files.map(f => f.id)).catch(() => ({}));
                setCommentCounts(counts);
            })
            .catch((err: unknown) => {
                logger.error('initial load failed', err);
                setError(true);
                toaster.push(<Message type="error" showIcon closable>Error cargando las fotos</Message>, { placement: 'topEnd' });
            })
            .finally(() => setLoading(false));
    }, [seeAllFotos, refreshKey, toaster]);

    useEffect(() => {
        if (loading || initialPhotoOpened.current) return;
        const photoId = searchParams.get('photo');
        if (!photoId) return;
        const idx = lightboxPhotos.findIndex(p => p.id === photoId);
        if (idx !== -1) {
            setIndex(idx);
            initialPhotoOpened.current = true;
        }
    }, [loading, lightboxPhotos, searchParams]);

    // useCallback keeps reference stable for the IntersectionObserver closure
    const fetchMore = useCallback(async (page: number) => {
        const userId = auth.getUserId();
        if (!auth.isLoggedIn() || !userId) return;
        try {
            const data = await getAllPhotos(import.meta.env.VITE_EVENT_ID, page, PAGE_LIMIT, seeAllFotos === 'true' ? undefined : userId);
            setPhotos(prev => [...prev, ...data.files.map(p => toPhoto(p, false))]);
            setLightboxPhotos(prev => [...prev, ...data.files.map(p => toPhoto(p, true))]);
            setHasMore(data.hasMore);
            const counts = await getCommentCounts(data.files.map(f => f.id)).catch(() => ({}));
            setCommentCounts(prev => ({ ...prev, ...counts }));
        } catch (err) {
            logger.error('fetchMore failed', err);
            toaster.push(<Message type="error" showIcon closable>Error cargando las fotos</Message>, { placement: 'topEnd' });
        }
    }, [seeAllFotos, toaster]);

    useSSE(import.meta.env.VITE_EVENT_ID, {
        'new-photo': (data) => {
            const photo = data as IPhotosFromBackend & { id: string };
            if (seeAllFotos === 'false' && photo.userId._id !== auth.getUserId()) return;
            setPhotos(prev => [toPhoto(photo, false), ...prev]);
            setLightboxPhotos(prev => [toPhoto(photo, true), ...prev]);
        },
        'new-comment': (data) => {
            const { fileId } = data as { fileId: string; comment: IComment };
            setCommentCounts(prev => ({ ...prev, [fileId]: (prev[fileId] ?? 0) + 1 }));
        },
    });

    useEffect(() => {
        if (!sentinelRef.current || !hasMore || loading) return;
        const observer = new IntersectionObserver(async ([entry]) => {
            if (!entry.isIntersecting || loadingMore) return;
            setLoadingMore(true);
            pageRef.current += 1;
            await fetchMore(pageRef.current);
            setLoadingMore(false);
        }, { threshold: 0.1 });
        observer.observe(sentinelRef.current);
        return () => observer.disconnect();
    }, [hasMore, loading, loadingMore, fetchMore]);

    const deleteLocalPhotos = (photoId: string) => {
        setPhotos(prev => prev.filter(p => p.id !== photoId));
        setLightboxPhotos(prev => prev.filter(p => p.id !== photoId));
        setIndex(-1);
    };

    const handleDownloadAll = () => {
        setDownloading(true);
        downloadAllPhotos(import.meta.env.VITE_EVENT_ID)
            .catch(() => toaster.push(<Message type="error" showIcon closable>Error al descargar las fotos</Message>, { placement: 'topEnd' }))
            .finally(() => setDownloading(false));
    };

    const handleDownloadSelected = () => {
        const toDownload = sortedPhotos
            .filter(p => selectedIds.has(p.id))
            .map(p => ({ url: p.fullSrc ?? p.src, id: p.id }));
        setDownloadingSelected(true);
        downloadSelectedPhotos(toDownload)
            .catch(() => toaster.push(<Message type="error" showIcon closable>Error al descargar las fotos</Message>, { placement: 'topEnd' }))
            .finally(() => { setDownloadingSelected(false); setSelectedIds(new Set()); });
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const stopSlideshow = () => {
        if (slideshowRef.current) clearInterval(slideshowRef.current);
        slideshowRef.current = null;
        setSlideshowActive(false);
    };

    const startSlideshow = (photos: IPhoto[]) => {
        if (photos.length === 0) return;
        setIndex(0);
        setSlideshowActive(true);
        slideshowRef.current = setInterval(() => {
            setIndex(prev => {
                const next = prev + 1;
                if (next >= photos.length) { stopSlideshow(); return -1; }
                return next;
            });
        }, SLIDESHOW_SPEEDS[slideshowSpeed]);
    };

    const uniqueUsers: IUser[] = [];
    const seenIds = new Set<string>();
    for (const p of photos) {
        if (!seenIds.has(p.user._id)) {
            seenIds.add(p.user._id);
            uniqueUsers.push(p.user);
        }
    }

    const photoComparator = (a: IPhoto, b: IPhoto) =>
        orderByLikes
            ? b.likedBy.length - a.likedBy.length
            : objectIdToDate(b.id) - objectIdToDate(a.id);

    const matchesFilters = (p: IPhoto) => {
        if (selectedUserId && p.user._id !== selectedUserId) return false;
        return true;
    };

    const filtered = photos.filter(matchesFilters);
    const filteredLightbox = lightboxPhotos.filter(matchesFilters);

    const sortedPhotos = [...filtered].sort(photoComparator);
    const sortedLightbox = [...filteredLightbox].sort(photoComparator);

    const activeFilterCount = [selectedUserId].filter(Boolean).length;

    return (
        <div className={styles.container}>
            <div className={styles.toolbar}>
                <div className={styles.toolbarLeft}>
                    <Link to="/subir">
                        <Button appearance="primary" size="sm" endIcon={<PlusIcon />}>Subir fotos</Button>
                    </Link>
                    <Button size="sm" appearance="subtle" onClick={() => setRefreshKey(k => k + 1)} startIcon={<ReloadIcon />}>
                        Refrescar
                    </Button>
                    <Button size="sm" appearance="subtle" onClick={handleDownloadAll} loading={downloading} startIcon={<FileDownloadIcon />}>
                        Descargar todas
                    </Button>
                    {sortedPhotos.length > 0 && (
                        slideshowActive
                            ? <Button size="sm" appearance="subtle" onClick={stopSlideshow} startIcon={<PauseOutlineIcon />}>Pausar</Button>
                            : <div className={styles.slideshowGroup}>
                                <Button size="sm" appearance="subtle" onClick={() => startSlideshow(sortedPhotos)} startIcon={<PlayOutlineIcon />}>Presentación</Button>
                                <select
                                    className={styles.speedSelect}
                                    value={slideshowSpeed}
                                    onChange={e => setSlideshowSpeed(e.target.value as SlideshowSpeed)}
                                >
                                    <option value="slow">Lenta</option>
                                    <option value="normal">Normal</option>
                                    <option value="fast">Rápida</option>
                                </select>
                            </div>
                    )}
                    {selectedIds.size > 0 && (
                        <Button size="sm" appearance="ghost" onClick={handleDownloadSelected} loading={downloadingSelected} startIcon={<FileDownloadIcon />}>
                            Descargar seleccionadas ({selectedIds.size})
                        </Button>
                    )}
                </div>
                <div className={styles.toolbarRight}>
                    <div className={styles.toggleGroup}>
                        <span>Ordenar</span>
                        <Toggle size="md" checkedChildren={<HeartIcon />} unCheckedChildren={<CalendarIcon />} checked={orderByLikes} onChange={(v: boolean) => setOrderByLikes(v)} />
                    </div>
                    <div className={styles.toggleGroup}>
                        <span>Fotos</span>
                        <Toggle size="md" checkedChildren="Todas" unCheckedChildren="Mías" checked={seeAllFotos === 'true'} onChange={(v: boolean) => setAllPhotos(v ? 'true' : 'false')} />
                    </div>
                </div>
            </div>

            <div className={styles.filterBar}>
                <SelectPicker
                    data={uniqueUsers.map(u => ({ label: u.name || u.email, value: u._id }))}
                    value={selectedUserId}
                    onChange={setSelectedUserId}
                    placeholder="Fotógrafo"
                    cleanable
                    size="sm"
                    style={{ width: 150 }}
                />
                {activeFilterCount > 0 && (
                    <button
                        type="button"
                        className={styles.activeCount}
                        onClick={() => setSelectedUserId(null)}
                    >
                        × {activeFilterCount} {activeFilterCount === 1 ? 'filtro' : 'filtros'}
                    </button>
                )}
            </div>

            {loading && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: '1em' }}>
                    {Array.from({ length: 12 }).map((_, i) => (
                        <Placeholder.Graph key={`skeleton-${i}`} active style={{ width: 150, height: 150, borderRadius: 4 }} />
                    ))}
                </div>
            )}

            {!loading && error && photos.length === 0 && (
                <div className={styles.emptyState}><span>📷</span><span>Error cargando las fotos</span></div>
            )}
            {!loading && !error && photos.length === 0 && (
                <div className={styles.emptyState}><span>🖼️</span><span>Todavía no hay fotos</span></div>
            )}

            {sortedPhotos.length > 0 && (
                <>
                    <RowsPhotoAlbum
                        photos={sortedPhotos}
                        targetRowHeight={150}
                        onClick={({ index: current }) => {
                            const id = sortedPhotos[current]?.id;
                            if (id && selectedIds.size > 0) { toggleSelect(id); return; }
                            setIndex(current);
                        }}
                        padding={2.5}
                        render={{ image: (props, context) => Photo(props, context, deleteLocalPhotos, toggleSelect, selectedIds.has((context.photo as IPhoto).id), commentCounts[(context.photo as IPhoto).id] ?? 0) }}
                    />
                    {index >= 0 && (
                        <Lightbox
                            slides={sortedLightbox}
                            index={index}
                            onClose={() => { setIndex(-1); setSearchParams({}); stopSlideshow(); }}
                            onIndexChange={(i) => { setIndex(i); setSearchParams({ photo: sortedLightbox[i]?.id ?? '' }); }}
                            commentCounts={commentCounts}
                        />
                    )}
                </>
            )}

            <div ref={sentinelRef} style={{ height: 1 }} />
            {loadingMore && <Loader style={{ margin: '1em auto', display: 'block' }} />}
        </div>
    );
};

export { AllPhotos };
