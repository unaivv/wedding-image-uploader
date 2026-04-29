import { useEffect, useRef, useState } from 'react';
import type { IPhoto } from '../AllPhotos/types';
import { Comments } from '../Comments';
import { downloadPhoto } from '../AllPhotos/service';
import { cn } from '../../utils/cn';
import { logger } from '../../utils/logger';
import { Message, useToaster } from 'rsuite';
import FileDownloadIcon from '@rsuite/icons/FileDownload';
import MessageIcon from '@rsuite/icons/Message';
import styles from './Lightbox.module.css';

interface LightboxProps {
    slides: IPhoto[];
    index: number;
    onClose: () => void;
    onIndexChange: (i: number) => void;
    commentCounts?: Record<string, number>;
}

const Lightbox = ({ slides, index, onClose, onIndexChange, commentCounts = {} }: LightboxProps) => {
    const toaster = useToaster();
    const [commentsOpen, setCommentsOpen] = useState(false);
    const [zoomed, setZoomed] = useState(false);
    const touchStartX = useRef(0);
    const touchStartY = useRef(0);

    const photo = slides[index];
    const hasPrev = index > 0;
    const hasNext = index < slides.length - 1;

    const goTo = (i: number) => {
        if (i >= 0 && i < slides.length) {
            setZoomed(false);
            onIndexChange(i);
        }
    };

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft' && index > 0) { setZoomed(false); onIndexChange(index - 1); }
            else if (e.key === 'ArrowRight' && index < slides.length - 1) { setZoomed(false); onIndexChange(index + 1); }
            else if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [index, slides.length, onClose, onIndexChange]);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    const onTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
    };

    const onTouchEnd = (e: React.TouchEvent) => {
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        const dy = e.changedTouches[0].clientY - touchStartY.current;
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
            if (dx < 0) goTo(index + 1);
            else goTo(index - 1);
        }
    };

    const handleDownload = () => {
        if (!photo) return;
        downloadPhoto(photo.fullSrc ?? photo.src, `foto-${photo.id}.jpg`).catch((err: unknown) => {
            logger.error('download failed', err);
            toaster.push(<Message type="error" showIcon closable>Error al descargar la foto</Message>, { placement: 'topEnd' });
        });
    };

    if (!photo) return null;

    const commentCount = commentCounts[photo.id] ?? 0;

    return (
        <div className={styles.overlay} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
            <div className={styles.main}>
                <div className={styles.toolbar}>
                    <span className={styles.counter}>{index + 1} / {slides.length}</span>
                    <div className={styles.toolbarActions}>
                        <button
                            type="button"
                            onClick={() => setCommentsOpen(o => !o)}
                            className={cn(styles.toolbarBtn, commentsOpen && styles.toolbarBtnActive)}
                            title="Comentarios"
                        >
                            <MessageIcon fontSize="1.1em" />
                            {commentCount > 0 && <span className={styles.badge}>{commentCount}</span>}
                        </button>
                        <button type="button" onClick={handleDownload} className={styles.toolbarBtn} title="Descargar">
                            <FileDownloadIcon fontSize="1.1em" />
                        </button>
                        <button type="button" onClick={onClose} className={styles.toolbarBtn} title="Cerrar">
                            ✕
                        </button>
                    </div>
                </div>

                <div className={styles.stage}>
                    {hasPrev && (
                        <button type="button" className={cn(styles.navBtn, styles.navPrev)} onClick={() => goTo(index - 1)}>
                            ‹
                        </button>
                    )}

                    <div className={styles.imageWrap} onDoubleClick={() => !photo.isVideo && setZoomed(z => !z)}>
                        {photo.isVideo ? (
                            <video
                                key={photo.id}
                                src={photo.fullSrc ?? photo.src}
                                controls
                                className={styles.media}
                            />
                        ) : (
                            <img
                                key={photo.id}
                                src={photo.fullSrc ?? photo.src}
                                alt={photo.alt}
                                className={cn(styles.media, zoomed && styles.zoomed)}
                                draggable={false}
                            />
                        )}
                    </div>

                    {hasNext && (
                        <button type="button" className={cn(styles.navBtn, styles.navNext)} onClick={() => goTo(index + 1)}>
                            ›
                        </button>
                    )}
                </div>

                {photo.caption && <p className={styles.caption}>{photo.caption}</p>}
            </div>

            {commentsOpen && (
                <div className={styles.commentsSide}>
                    <Comments fileId={photo.id} />
                </div>
            )}
        </div>
    );
};

export { Lightbox };
