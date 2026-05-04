import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { RowsPhotoAlbum } from 'react-photo-album';
import 'react-photo-album/rows.css';
import { Loader } from 'rsuite';
import { Lightbox } from '../components/Lightbox';
import type { IPhoto } from '../components/AllPhotos/types';

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
    const [photos, setPhotos] = useState<IPhoto[]>([]);
    const [index, setIndex] = useState(-1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!token) return;
        fetch(`${import.meta.env.VITE_BACKEND_URL}/gallery/${token}`)
            .then(r => { if (!r.ok) throw new Error('invalid'); return r.json() as Promise<{ files: RawFile[] }>; })
            .then(data => setPhotos(data.files.map(toPhoto)))
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, [token]);

    if (loading) return <Loader center size="lg" content="Cargando galería..." style={{ marginTop: '4rem' }} />;

    if (error) return (
        <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--rs-text-secondary)' }}>
            <p style={{ fontSize: '2rem' }}>🔗</p>
            <p>Este enlace no es válido o ha expirado.</p>
        </div>
    );

    return (
        <div style={{ padding: '1rem' }}>
            <h1 style={{ marginBottom: '1rem', fontSize: '1.4rem' }}>Galería de fotos</h1>

            {photos.length === 0 && <p style={{ color: 'var(--rs-text-secondary)' }}>No hay fotos disponibles.</p>}

            {photos.length > 0 && (
                <>
                    <RowsPhotoAlbum
                        photos={photos}
                        targetRowHeight={150}
                        onClick={({ index: i }) => setIndex(i)}
                        padding={2.5}
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
