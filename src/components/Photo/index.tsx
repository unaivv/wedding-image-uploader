import { type RenderImageContext, type RenderImageProps } from "react-photo-album";
import { Image, Loader, Message, Tooltip, Whisper, useToaster } from "rsuite";
import type { IPhoto } from "../AllPhotos/types";
import styles from "./Photo.module.css";
import CloseIcon from '@rsuite/icons/Close';
import FileDownloadIcon from '@rsuite/icons/FileDownload';
import { deleteFile, likeFile } from "../Upload/service";
import { downloadPhoto } from "../AllPhotos/service";
import { useState, useRef } from "react";
import { auth } from "../../utils/auth";
import { cn } from "../../utils/cn";
import { logger } from "../../utils/logger";
import ArrowDownLineIcon from '@rsuite/icons/ArrowDownLine';
import MessageIcon from '@rsuite/icons/Message';

const HeartFilled = () => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true">
        <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z" />
    </svg>
);

const HeartOutline = () => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
);

interface PhotoComponentProps {
    renderProps: RenderImageProps;
    context: RenderImageContext;
    deleteLocalPhotos: (photoId: string) => void;
    toggleSelect?: (id: string) => void;
    isSelected?: boolean;
    commentCount?: number;
}

const PhotoComponent = ({ renderProps, context, deleteLocalPhotos, toggleSelect, isSelected, commentCount = 0 }: PhotoComponentProps) => {
    const { alt = "", title, sizes } = renderProps;
    const { photo, width, height } = context;
    const toaster = useToaster();

    const [loading, setLoading] = useState(false);
    const isHolding = useRef(false);

    const iPhoto = photo as IPhoto;
    const photoId = iPhoto.id || "";
    const photoUser = iPhoto.user;
    const userName = photoUser.name || photoUser.email || 'User';
    const canDelete = auth.getUserId() === photoUser._id;

    const [liked, setLiked] = useState(
        (iPhoto.likedBy || []).some(
            (user) => (typeof user === "object" ? user._id : user) === (auth.getUserId() || "")
        )
    );

    const [likes, setLikes] = useState<{ id: string; name: string }[]>(
        (iPhoto.likedBy || [])
            .filter((user) => typeof user === "object")
            .map((user) => ({ id: user._id, name: user.name || user.email || 'User' }))
    );

    const handleDelete = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        if (loading || !canDelete) return;
        setLoading(true);
        deleteFile(photoId)
            .then((success) => {
                if (success) {
                    deleteLocalPhotos(photoId);
                    toaster.push(
                        <Message type="success" showIcon closable>Foto eliminada</Message>,
                        { placement: 'topEnd' }
                    );
                    return;
                }
                toaster.push(
                    <Message type="error" showIcon closable>No se pudo eliminar la foto</Message>,
                    { placement: 'topEnd' }
                );
            })
            .catch((err: unknown) => {
                logger.error('delete photo failed', err);
                toaster.push(
                    <Message type="error" showIcon closable>Error al eliminar la foto</Message>,
                    { placement: 'topEnd' }
                );
            })
            .finally(() => setLoading(false));
    };

    const handleLike = (e: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        if (isHolding.current) return;
        likeFile(photoId, auth.getUserId() || "")
            .then((isLiked) => {
                setLiked(isLiked);
                const userId = auth.getUserId();
                if (isLiked && userId) {
                    setLikes(prev => [...prev, { id: userId, name: auth.getUserName() || 'User' }]);
                } else {
                    setLikes(prev => prev.filter(like => like.id !== userId));
                }
            })
            .catch((err: unknown) => {
                logger.error('like failed', err);
                toaster.push(
                    <Message type="error" showIcon closable>Error al procesar el me gusta</Message>,
                    { placement: 'topEnd' }
                );
            });
    };

    const handleDownloadSingle = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        const url = iPhoto.fullSrc ?? iPhoto.src;
        downloadPhoto(url, `foto-${photoId}.jpg`).catch((err: unknown) => {
            logger.error('download failed', err);
            toaster.push(<Message type="error" showIcon closable>Error al descargar la foto</Message>, { placement: 'topEnd' });
        });
    };

    return (
        <div className={cn(styles.photoCard, isSelected && styles.selected)} style={{ width, height: height + 30, position: "relative" }}>
            {loading && (
                <div className={styles.loadingOverlay}>
                    <Loader size="md" content="Eliminando..." />
                </div>
            )}
            {canDelete && (
                <button type="button" onClick={handleDelete} className={styles.removeButton}>
                    <CloseIcon fontSize={'1em'} color="white" />
                </button>
            )}
            <button type="button" onClick={handleDownloadSingle} className={styles.downloadButton} title="Descargar foto">
                <FileDownloadIcon fontSize={'1em'} color="white" />
            </button>
            {toggleSelect && (
                <button
                    type="button"
                    className={cn(styles.selectButton, isSelected && styles.selectButtonActive)}
                    onClick={(e) => { e.stopPropagation(); toggleSelect(photoId); }}
                    title={isSelected ? 'Deseleccionar' : 'Seleccionar'}
                >
                    {isSelected ? '✓' : ''}
                </button>
            )}
            <Image
                src={photo.src}
                alt={alt}
                title={title}
                sizes={sizes}
                style={{ objectFit: "cover", width: "100%", height: "calc(100% - 30px)" }}
            />
            {iPhoto.isVideo && (
                <div className={styles.videoOverlay}>
                    <svg viewBox="0 0 24 24" width="2em" height="2em" fill="white" aria-hidden="true">
                        <path d="M8 5v14l11-7z" />
                    </svg>
                </div>
            )}
            <div className={styles.photoBottom}>
                <div className={styles.userNameWrapper}>
                    <div className={styles.avatar}>
                        <Image src={photoUser.picture} alt={userName} circle style={{ width: '20px', height: '20px' }} />
                    </div>
                    <span>{userName?.split('@')[0]}</span>
                </div>
                <div className={styles.actions} style={{ position: "relative" }}>
                    {commentCount > 0 && (
                        <span className={styles.commentCount}>
                            <MessageIcon fontSize="0.8em" />
                            {commentCount}
                        </span>
                    )}
                    <button
                        type="button"
                        className={cn(styles.likeButton, liked && styles.liked)}
                        onClick={handleLike}
                    >
                        {liked ? <HeartFilled /> : <HeartOutline />}
                    </button>
                    <Whisper
                        placement="top"
                        trigger="click"
                        speaker={
                            <Tooltip onClick={(e) => e.stopPropagation()}>
                                {likes.length > 0
                                    ? likes.map((like) => (
                                        <div key={like.id} className={styles.likeUser} onClick={(e) => e.stopPropagation()}>{like.name}</div>
                                    ))
                                    : <div>No hay usuarios que les guste</div>
                                }
                            </Tooltip>
                        }
                    >
                        <button type="button" onClick={(e) => e.stopPropagation()} className={styles.likeCount}>
                            {likes.length}<ArrowDownLineIcon />
                        </button>
                    </Whisper>
                </div>
            </div>
        </div>
    );
};

const Photo = (
    props: RenderImageProps,
    context: RenderImageContext,
    deleteLocalPhotos: (photoId: string) => void,
    toggleSelect?: (id: string) => void,
    isSelected?: boolean,
    commentCount?: number,
) => <PhotoComponent renderProps={props} context={context} deleteLocalPhotos={deleteLocalPhotos} toggleSelect={toggleSelect} isSelected={isSelected} commentCount={commentCount} />;

export { Photo };
