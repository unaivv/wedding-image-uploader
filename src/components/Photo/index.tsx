import { type RenderImageContext, type RenderImageProps } from "react-photo-album";
import { Image, Loader, Message, Tooltip, Whisper, useToaster } from "rsuite";
import type { IPhoto, IUser } from "../AllPhotos/types";
import styles from "./Photo.module.css";
import CloseIcon from '@rsuite/icons/Close';
import { deleteFile, likeFile } from "../Upload/service";
import { useState, useRef } from "react";
import { auth } from "../../utils/auth";
import ArrowDownLineIcon from '@rsuite/icons/ArrowDownLine';

interface PhotoComponentProps {
    renderProps: RenderImageProps;
    context: RenderImageContext;
    deleteLocalPhotos: (photoId: string) => void;
}

const PhotoComponent = ({ renderProps, context, deleteLocalPhotos }: PhotoComponentProps) => {
    const { alt = "", title, sizes } = renderProps;
    const { photo, width, height } = context;
    const toaster = useToaster();

    const [loading, setLoading] = useState(false);
    const isHolding = useRef(false);

    const userName = (photo as IPhoto).user.name || (photo as IPhoto).user.email || 'User';
    const canDelete = auth.getUserId() === (photo as IPhoto).user._id;

    const [liked, setLiked] = useState(
        ((photo as IPhoto).likedBy || []).some(
            (user) => (typeof user === "object" ? user._id : user) === (auth.getUserId() || "")
        )
    );

    const [likes, setLikes] = useState<{ id: string; name: string }[]>(
        ((photo as IPhoto).likedBy || [])
            .filter((user) => typeof user === "object")
            .map((user) => ({ id: user._id, name: user.name || user.email || 'User' }))
    );

    const handleDelete = (e: React.MouseEvent<HTMLSpanElement>) => {
        e.stopPropagation();
        if (loading || !canDelete) return;
        setLoading(true);
        deleteFile((photo as IPhoto).id || "")
            .then((success) => {
                if (success) {
                    deleteLocalPhotos((photo as IPhoto).id || "");
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
            .catch(() => {
                toaster.push(
                    <Message type="error" showIcon closable>Error al eliminar la foto</Message>,
                    { placement: 'topEnd' }
                );
            })
            .finally(() => setLoading(false));
    };

    const handleLike = (e: React.MouseEvent<HTMLSpanElement> | React.TouchEvent<HTMLSpanElement>) => {
        e.stopPropagation();
        if (isHolding.current) return;
        likeFile((photo as IPhoto).id || "", auth.getUserId() || "")
            .then((isLiked) => {
                setLiked(isLiked);
                const userId = auth.getUserId();
                if (isLiked && userId) {
                    setLikes(prev => [...prev, { id: userId, name: auth.getUserName() || 'User' }]);
                } else {
                    setLikes(prev => prev.filter(like => like.id !== userId));
                }
            })
            .catch(() => {
                toaster.push(
                    <Message type="error" showIcon closable>Error al procesar el me gusta</Message>,
                    { placement: 'topEnd' }
                );
            });
    };

    return (
        <div style={{ width, height: height + 30, position: "relative" }}>
            {loading && (
                <div className={styles.loadingOverlay}>
                    <Loader size="md" content="Borrando..." />
                </div>
            )}
            {canDelete && (
                <span onClick={handleDelete} className={styles.removeButton}>
                    <CloseIcon fontSize={'1em'} color="white" />
                </span>
            )}
            <Image
                src={photo.src}
                alt={alt}
                title={title}
                sizes={sizes}
                style={{ objectFit: "cover", width: "100%", height: "calc(100% - 30px)" }}
            />
            <div className={styles.photoBottom}>
                <div className={styles.userNameWrapper}>
                    <div className={styles.avatar}>
                        <Image src={(photo as IPhoto).user.picture} alt={userName} circle style={{ width: '20px', height: '20px' }} />
                    </div>
                    <span>{userName?.split('@')[0]}</span>
                </div>
                <div className={styles.actions} style={{ position: "relative" }}>
                    <span className={`${styles.likeButton} ${liked ? styles.liked : ''}`} onClick={handleLike}>
                        {liked ? '❤️' : '🤍'}{' '}
                        <Whisper
                            placement="top"
                            trigger="click"
                            speaker={
                                <Tooltip onClick={(e) => e.stopPropagation()}>
                                    {likes.length > 0
                                        ? likes.map((like, idx) => (
                                            <div key={idx} className={styles.likeUser} onClick={(e) => e.stopPropagation()}>{like.name}</div>
                                        ))
                                        : <div>No hay usuarios que le gusten</div>
                                    }
                                </Tooltip>
                            }
                        >
                            <span onClick={(e) => e.stopPropagation()}>
                                {likes.length}<ArrowDownLineIcon />
                            </span>
                        </Whisper>
                    </span>
                </div>
            </div>
        </div>
    );
};

const Photo = (
    props: RenderImageProps,
    context: RenderImageContext,
    deleteLocalPhotos: (photoId: string) => void
) => <PhotoComponent renderProps={props} context={context} deleteLocalPhotos={deleteLocalPhotos} />;

export { Photo };
