"use client";
import { useEffect, useRef, useState } from "react";
import { getAllPhotos, downloadAllPhotos } from "./service";
import { RowsPhotoAlbum } from "react-photo-album";
import "react-photo-album/rows.css";
import "yet-another-react-lightbox/styles.css";
import Lightbox from "yet-another-react-lightbox";
import styles from './allPhotos.module.css';
import { auth } from "../../utils/auth";
import { Button, Loader, Message, Placeholder, Toggle, useToaster } from "rsuite";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import { Photo } from "../Photo";
import type { IPhoto, IPhotosFromBackend } from "./types";
import { Link } from "react-router-dom";
import PlusIcon from '@rsuite/icons/Plus';
import ReloadIcon from '@rsuite/icons/Reload';
import ArrowDownLineIcon from '@rsuite/icons/ArrowDownLine';
import { useSSE } from "../../hooks/useSSE";

const PAGE_LIMIT = 20;

const toPhoto = (photo: IPhotosFromBackend, fullRes: boolean): IPhoto => ({
    src: fullRes ? photo.fullSrc : photo.compressedSrc,
    width: fullRes ? 1500 : 200,
    height: fullRes ? 1500 : 200,
    id: photo.id,
    alt: fullRes ? photo.fullSrc : '',
    user: photo.userId,
    likedBy: photo.likedBy || [],
});

const AllPhotos = () => {
    const toaster = useToaster();

    const [photos, setPhotos] = useState<IPhoto[]>([]);
    const [lightboxPhotos, setLightboxPhotos] = useState<IPhoto[]>([]);
    const [index, setIndex] = useState(-1);
    const [orderByLikes, setOrderByLikes] = useState(false);
    const [seeAllFotos, setAllPhotos] = useState<'true' | 'false'>('true');
    const [refreshKey, setRefreshKey] = useState(0);
    const [downloading, setDownloading] = useState(false);

    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState(false);
    const pageRef = useRef(1);
    const sentinelRef = useRef<HTMLDivElement>(null);

    const pushLoadError = () =>
        toaster.push(<Message type="error" showIcon closable>Error cargando las fotos</Message>, { placement: 'topEnd' });

    useEffect(() => {
        pageRef.current = 1;
        setPhotos([]);
        setLightboxPhotos([]);
        setLoading(true);
        setError(false);

        const userId = auth.getUserId();
        if (!auth.isLoggedIn() || !userId) {
            setLoading(false);
            return;
        }

        getAllPhotos(
            import.meta.env.VITE_EVENT_ID,
            1,
            PAGE_LIMIT,
            seeAllFotos === 'true' ? undefined : userId,
        )
            .then(data => {
                setPhotos(data.files.map(p => toPhoto(p, false)));
                setLightboxPhotos(data.files.map(p => toPhoto(p, true)));
                setHasMore(data.hasMore);
            })
            .catch(() => {
                setError(true);
                pushLoadError();
            })
            .finally(() => setLoading(false));
    }, [seeAllFotos, refreshKey]);

    const fetchMore = async (page: number) => {
        const userId = auth.getUserId();
        if (!auth.isLoggedIn() || !userId) return;

        try {
            const data = await getAllPhotos(
                import.meta.env.VITE_EVENT_ID,
                page,
                PAGE_LIMIT,
                seeAllFotos === 'true' ? undefined : userId,
            );
            setPhotos(prev => [...prev, ...data.files.map(p => toPhoto(p, false))]);
            setLightboxPhotos(prev => [...prev, ...data.files.map(p => toPhoto(p, true))]);
            setHasMore(data.hasMore);
        } catch {
            pushLoadError();
        }
    };

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
    }, [hasMore, loading, loadingMore]);

    const deleteLocalPhotos = (photoId: string) => {
        setPhotos(prev => prev.filter(p => p.id !== photoId));
        setLightboxPhotos(prev => prev.filter(p => p.id !== photoId));
        setIndex(-1);
    };

    const handleDownload = () => {
        setDownloading(true);
        downloadAllPhotos(import.meta.env.VITE_EVENT_ID)
            .catch(() => {
                toaster.push(<Message type="error" showIcon closable>Error al descargar las fotos</Message>, { placement: 'topEnd' });
            })
            .finally(() => setDownloading(false));
    };

    const photoComparator = (a: IPhoto, b: IPhoto) =>
        orderByLikes ? b.likedBy.length - a.likedBy.length : new Date(b.id).getTime() - new Date(a.id).getTime();

    const sortedPhotos = [...photos].sort(photoComparator);
    const sortedLightbox = [...lightboxPhotos].sort(photoComparator);

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
                    <Button
                        appearance="ghost"
                        onClick={handleDownload}
                        loading={downloading}
                        style={{ marginLeft: 8 }}
                        endIcon={<ArrowDownLineIcon />}
                    >
                        Descargar todo
                    </Button>
                </div>
                <div className={styles.right}>
                    <div className={styles.sort}>
                        <span>Ordenar por:</span>
                        <Toggle
                            size="lg"
                            checkedChildren="Me gusta"
                            unCheckedChildren="Fecha"
                            checked={orderByLikes}
                            onChange={(value: boolean) => setOrderByLikes(value)}
                        />
                    </div>
                    <div className={styles.filters}>
                        <span>Filtrar:</span>
                        <Toggle
                            size="lg"
                            checkedChildren="Todas"
                            unCheckedChildren="Mias"
                            checked={seeAllFotos === 'true'}
                            onChange={(value: boolean) => setAllPhotos(value ? 'true' : 'false')}
                        />
                    </div>
                </div>
            </div>

            {loading && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: '1em' }}>
                    {Array.from({ length: 12 }).map((_, i) => (
                        <Placeholder.Graph key={i} active style={{ width: 150, height: 150, borderRadius: 4 }} />
                    ))}
                </div>
            )}

            {!loading && error && photos.length === 0 && <p>Error cargando las fotos</p>}

            {!loading && !error && photos.length === 0 && <p>No hay fotos</p>}

            {photos.length > 0 && (
                <>
                    <RowsPhotoAlbum
                        photos={sortedPhotos}
                        targetRowHeight={150}
                        onClick={({ index: current }) => setIndex(current)}
                        padding={2.5}
                        render={{
                            image: (props, context) => Photo(props, context, deleteLocalPhotos)
                        }}
                    />
                    <Lightbox
                        index={index}
                        slides={sortedLightbox}
                        open={index >= 0}
                        close={() => setIndex(-1)}
                        plugins={[Zoom]}
                        zoom={{ maxZoomPixelRatio: 2, scrollToZoom: true }}
                    />
                </>
            )}

            <div ref={sentinelRef} style={{ height: 1 }} />
            {loadingMore && <Loader style={{ margin: '1em auto', display: 'block' }} />}
        </div>
    );
};

export { AllPhotos };
