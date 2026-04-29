import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getAllPhotos, downloadAllPhotos } from "./service";
import { RowsPhotoAlbum } from "react-photo-album";
import "react-photo-album/rows.css";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Share from "yet-another-react-lightbox/plugins/share";
import styles from './allPhotos.module.css';
import { auth } from "../../utils/auth";
import { Button, Loader, Message, Placeholder, SelectPicker, Toggle, useToaster } from "rsuite";
import { Photo } from "../Photo";
import type { IPhoto, IPhotosFromBackend, IUser } from "./types";
import { Link } from "react-router-dom";
import PlusIcon from '@rsuite/icons/Plus';
import ReloadIcon from '@rsuite/icons/Reload';
import ArrowDownLineIcon from '@rsuite/icons/ArrowDownLine';
import { useSSE } from "../../hooks/useSSE";
import { logger } from "../../utils/logger";

const PAGE_LIMIT = 20;

const toPhoto = (photo: IPhotosFromBackend, fullRes: boolean): IPhoto => ({
    src: fullRes ? photo.fullSrc : photo.compressedSrc,
    width: fullRes ? 1500 : 200,
    height: fullRes ? 1500 : 200,
    id: photo.id,
    alt: fullRes ? photo.fullSrc : '',
    user: photo.userId,
    likedBy: photo.likedBy || [],
    caption: photo.caption,
    createdAt: photo.createdAt,
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
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

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
            .then(data => {
                setPhotos(data.files.map(p => toPhoto(p, false)));
                setLightboxPhotos(data.files.map(p => toPhoto(p, true)));
                setHasMore(data.hasMore);
            })
            .catch(() => {
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

    const handleDownload = () => {
        setDownloading(true);
        downloadAllPhotos(import.meta.env.VITE_EVENT_ID)
            .catch(() => toaster.push(<Message type="error" showIcon closable>Error al descargar las fotos</Message>, { placement: 'topEnd' }))
            .finally(() => setDownloading(false));
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
        if (dateFrom && objectIdToDate(p.id) < new Date(dateFrom).getTime()) return false;
        if (dateTo && objectIdToDate(p.id) > new Date(dateTo + 'T23:59:59').getTime()) return false;
        return true;
    };

    const filtered = photos.filter(matchesFilters);
    const filteredLightbox = lightboxPhotos.filter(matchesFilters);

    const sortedPhotos = [...filtered].sort(photoComparator);
    const sortedLightbox = [...filteredLightbox].sort(photoComparator);

    const lightboxSlides = sortedLightbox.map(p => ({
        ...p,
        description: p.caption || undefined,
        share: { url: `${window.location.origin}/?photo=${p.id}`, title: 'Unai & Marifeli 💍' },
    }));

    return (
        <div className={styles.allPhotosConatiner}>
            <div className={styles.actions}>
                <div className={styles.left}>
                    <Link to="/subir">
                        <Button appearance="ghost" endIcon={<PlusIcon />}>Subir fotos</Button>
                    </Link>
                    <Button appearance="ghost" onClick={() => setRefreshKey(k => k + 1)} style={{ marginLeft: 8 }} endIcon={<ReloadIcon />}>
                        Refrescar
                    </Button>
                    <Button appearance="ghost" onClick={handleDownload} loading={downloading} style={{ marginLeft: 8 }} endIcon={<ArrowDownLineIcon />}>
                        Descargar todo
                    </Button>
                </div>
                <div className={styles.right}>
                    <div className={styles.sort}>
                        <span>Ordenar por:</span>
                        <Toggle size="lg" checkedChildren="Me gusta" unCheckedChildren="Fecha" checked={orderByLikes} onChange={(v: boolean) => setOrderByLikes(v)} />
                    </div>
                    <div className={styles.filters}>
                        <span>Filtrar:</span>
                        <Toggle size="lg" checkedChildren="Todas" unCheckedChildren="Mias" checked={seeAllFotos === 'true'} onChange={(v: boolean) => setAllPhotos(v ? 'true' : 'false')} />
                    </div>
                </div>
            </div>

            <div className={styles.extraFilters}>
                <SelectPicker
                    data={uniqueUsers.map(u => ({ label: u.name || u.email, value: u._id }))}
                    value={selectedUserId}
                    onChange={setSelectedUserId}
                    placeholder="Fotógrafo"
                    cleanable
                    size="sm"
                    style={{ width: 160 }}
                />
                <input
                    type="date"
                    value={dateFrom}
                    onChange={e => setDateFrom(e.target.value)}
                    className={styles.dateInput}
                    title="Desde"
                />
                <input
                    type="date"
                    value={dateTo}
                    onChange={e => setDateTo(e.target.value)}
                    className={styles.dateInput}
                    title="Hasta"
                />
                {(selectedUserId || dateFrom || dateTo) && (
                    <Button size="xs" appearance="subtle" onClick={() => { setSelectedUserId(null); setDateFrom(''); setDateTo(''); }}>
                        Limpiar
                    </Button>
                )}
            </div>

            {loading && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: '1em' }}>
                    {Array.from({ length: 12 }).map((_, i) => (
                        <Placeholder.Graph key={`skeleton-${i}`} active style={{ width: 150, height: 150, borderRadius: 4 }} />
                    ))}
                </div>
            )}

            {!loading && error && photos.length === 0 && <p>Error cargando las fotos</p>}
            {!loading && !error && photos.length === 0 && <p>No hay fotos</p>}

            {sortedPhotos.length > 0 && (
                <>
                    <RowsPhotoAlbum
                        photos={sortedPhotos}
                        targetRowHeight={150}
                        onClick={({ index: current }) => setIndex(current)}
                        padding={2.5}
                        render={{ image: (props, context) => Photo(props, context, deleteLocalPhotos) }}
                    />
                    <Lightbox
                        index={index}
                        slides={lightboxSlides}
                        open={index >= 0}
                        close={() => { setIndex(-1); setSearchParams({}); }}
                        on={{ view: ({ index: i }) => setSearchParams({ photo: sortedLightbox[i]?.id ?? '' }) }}
                        plugins={[Zoom, Captions, Share]}
                        zoom={{ maxZoomPixelRatio: 2, scrollToZoom: true }}
                        captions={{ showToggle: true, descriptionMaxLines: 2 }}
                    />
                </>
            )}

            <div ref={sentinelRef} style={{ height: 1 }} />
            {loadingMore && <Loader style={{ margin: '1em auto', display: 'block' }} />}
        </div>
    );
};

export { AllPhotos };
