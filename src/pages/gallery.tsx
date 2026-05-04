import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { RowsPhotoAlbum } from 'react-photo-album';
import 'react-photo-album/rows.css';
import { Button, Loader, Message, useToaster } from 'rsuite';
import FileDownloadIcon from '@rsuite/icons/FileDownload';
import { Lightbox } from '../components/Lightbox';
import type { IPhoto } from '../components/AllPhotos/types';
import { downloadSelectedPhotos } from '../components/AllPhotos/service';
import { logger } from '../utils/logger';

interface RawFile {
    _id: string;
    fullSrc: string;
    compressedSrc: string;
    isVideo?: boolean;
    caption?: string;
    userId?: { _id: string; name: string; email: string; picture?: string };
}

const toPhoto = (f: RawFile): IPhoto => ({
    src: f.compressedSrc,
    fullSrc: f.fullSrc,
    width: 1500,
    height: 1500,
    id: f._id,
    alt: f.userId?.name ?? '',
    user: { _id: f.userId?._id ?? '', name: f.userId?.name ?? '', email: f.userId?.email ?? '', picture: f.userId?.picture ?? '' },
    likedBy: [],
    caption: f.caption,
    isVideo: f.isVideo,
});

const GalleryPage = () => {
    const { token } = useParams<{ token: string }>();
    const toaster = useToaster();
    const [photos, setPhotos] = useState<IPhoto[]>([]);
    const [index, setIndex] = useState(-1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        if (!token) return;
        fetch(`${import.meta.env.VITE_BACKEND_URL}/gallery/${token}`)
            .then(r => { if (!r.ok) throw new Error('invalid'); return r.json() as Promise<{ files: RawFile[] }>; })
            .then(data => setPhotos(data.files.map(toPhoto)))
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, [token]);

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const handleDownload = (subset: IPhoto[]) => {
        setDownloading(true);
        downloadSelectedPhotos(subset.map(p => ({ url: p.fullSrc ?? p.src, id: p.id })))
            .then(() => setSelectedIds(new Set()))
            .catch((err: unknown) => {
                logger.error('gallery download failed', err);
                toaster.push(<Message type="error" showIcon closable>Error al descargar</Message>, { placement: 'topEnd' });
            })
            .finally(() => setDownloading(false));
    };

    if (loading) return <Loader center size="lg" content="Cargando galería..." style={{ marginTop: '4rem' }} />;

    if (error) return (
        <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--rs-text-secondary)' }}>
            <p style={{ fontSize: '2rem' }}>🔗</p>
            <p>Este enlace no es válido o ha expirado.</p>
        </div>
    );

    const selected = photos.filter(p => selectedIds.has(p.id));

    return (
        <div style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.4rem', margin: 0, flexGrow: 1 }}>Galería de fotos</h1>
                {selectedIds.size > 0 && (
                    <Button
                        size="sm"
                        appearance="primary"
                        startIcon={<FileDownloadIcon />}
                        loading={downloading}
                        onClick={() => handleDownload(selected)}
                    >
                        Descargar seleccionadas ({selectedIds.size})
                    </Button>
                )}
                <Button
                    size="sm"
                    appearance="ghost"
                    startIcon={<FileDownloadIcon />}
                    loading={downloading}
                    disabled={photos.length === 0}
                    onClick={() => handleDownload(photos)}
                >
                    Descargar todas
                </Button>
            </div>

            {photos.length === 0 && <p style={{ color: 'var(--rs-text-secondary)' }}>No hay fotos disponibles.</p>}

            {photos.length > 0 && (
                <>
                    <RowsPhotoAlbum
                        photos={photos}
                        targetRowHeight={150}
                        padding={2.5}
                        onClick={({ index: i }) => {
                            const id = photos[i]?.id;
                            if (selectedIds.size > 0 && id) { toggleSelect(id); return; }
                            setIndex(i);
                        }}
                        render={{
                            image: (props, { photo }) => {
                                const p = photo as IPhoto;
                                const isSelected = selectedIds.has(p.id);
                                return (
                                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                        <img
                                            {...props}
                                            style={{ ...props.style as React.CSSProperties, opacity: isSelected ? 0.75 : 1, display: 'block' }}
                                        />
                                        {isSelected && (
                                            <div style={{ position: 'absolute', inset: 0, border: '3px solid var(--accent)', pointerEvents: 'none', boxSizing: 'border-box' }} />
                                        )}
                                        <button
                                            type="button"
                                            onClick={e => { e.stopPropagation(); toggleSelect(p.id); }}
                                            style={{
                                                position: 'absolute', top: 5, right: 5,
                                                width: 22, height: 22, borderRadius: '50%',
                                                border: '2px solid white',
                                                background: isSelected ? 'var(--accent)' : 'rgba(0,0,0,0.35)',
                                                color: 'white', fontSize: 12, fontWeight: 'bold',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                cursor: 'pointer', padding: 0,
                                            }}
                                            title={isSelected ? 'Deseleccionar' : 'Seleccionar'}
                                        >
                                            {isSelected ? '✓' : ''}
                                        </button>
                                    </div>
                                );
                            },
                        }}
                    />
                    {index >= 0 && (
                        <Lightbox
                            slides={photos}
                            index={index}
                            onClose={() => setIndex(-1)}
                            onIndexChange={setIndex}
                        />
                    )}
                </>
            )}
        </div>
    );
};

export { GalleryPage };
