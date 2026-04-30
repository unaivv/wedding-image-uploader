import type { IChallengeProps } from "./types";
import styles from "./Challenge.module.css";
import { renderCountdown } from "./util";
import { useEffect, useState } from "react";
import { Upload } from "../../Upload";
import type { FileType } from "rsuite/esm/Uploader";
import { Image, Message, Modal, useToaster, Loader, Button } from "rsuite";
import { CloseIcon } from "yet-another-react-lightbox";
import { auth } from "../../../utils/auth";
import { deleteParticipation } from "./service";
import { Lightbox } from "../../Lightbox";
import type { IPhoto } from "../../AllPhotos/types";
import { getCommentCounts } from "../../Comments/service";
import { logger } from "../../../utils/logger";
import { getMyPhotos } from "../../AllPhotos/service";

const Challenge = ({ challenge }: IChallengeProps) => {
    const toaster = useToaster();
    const [now, setNow] = useState(new Date());
    const [winnerLightboxOpen, setWinnerLightboxOpen] = useState(false);
    const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
    const [myPhotosModalOpen, setMyPhotosModalOpen] = useState(false);
    const [myPhotos, setMyPhotos] = useState<{ id: string; compressedSrc: string; fullSrc: string }[]>([]);
    const [myPhotosLoading, setMyPhotosLoading] = useState(false);
    const [file, setFile] = useState<FileType | null>(() => {
        const backendFile = challenge.participants.find(p => p.user._id === auth.getUserId())?.file || null;
        if (!backendFile) return null;
        return {
            name: backendFile.id,
            url: backendFile.compressedSrc,
            fileKey: backendFile.id,
            blobFile: undefined,
        } as FileType;
    });

    // winnerPhoto needs to be defined before handleOpenWinnerLightbox
    const winnerParticipant = challenge?.winner ? challenge.participants.find(p => p.user._id === challenge.winner!._id) : null;
    const winnerFile = winnerParticipant?.file;
    const winnerPhoto: IPhoto | null = winnerFile
        ? {
              id: winnerFile.id || winnerFile._id || 'MISSING_ID',
              src: winnerFile.compressedSrc,
              fullSrc: winnerFile.fullSrc ?? winnerFile.compressedSrc,
              alt: winnerFile.id,
              width: 0,
              height: 0,
              user: challenge.winner!,
              likedBy: [],
          }
        : null;

    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    const handleOpenWinnerLightbox = () => {
        if (!winnerPhoto) return;
        setWinnerLightboxOpen(true);
        getCommentCounts([winnerPhoto.id])
            .then(setCommentCounts)
            .catch((err: unknown) => logger.error('load comment counts failed', err));
    };

    const handleOpenMyPhotos = async () => {
        setMyPhotosModalOpen(true);
        setMyPhotosLoading(true);
        try {
            const photos = await getMyPhotos(import.meta.env.VITE_EVENT_ID as string);
            setMyPhotos(photos);
        } catch (err) {
            logger.error('load my photos failed', err);
            toaster.push(<Message type="error" showIcon closable>Error al cargar tus fotos</Message>, { placement: 'topEnd' });
        } finally {
            setMyPhotosLoading(false);
        }
    };

    const handleSelectMyPhoto = (photo: { id: string; compressedSrc: string; fullSrc: string }) => {
        setFile({
            name: photo.id,
            url: photo.compressedSrc,
            fileKey: photo.id,
            blobFile: undefined,
        } as FileType);
        setMyPhotosModalOpen(false);
        toaster.push(<Message type="success" showIcon closable>Foto seleccionada</Message>, { placement: 'topEnd' });
    };

    const renderFile = () => {
        if (file === null) {
            return <p className={styles.noUpload}>No subiste ninguna foto a este reto.</p>;
        }
        return (
            <div className={styles.uploadUniqueImage}>
                <button
                    type="button"
                    className={styles.remove}
                    onClick={(e) => {
                        e.stopPropagation();
                        const userId = auth.getUserId();
                        if (userId) {
                            deleteParticipation(challenge.id, userId)
                                .then(() => setFile(null))
                                .catch(() => {
                                    toaster.push(
                                        <Message type="error" showIcon closable>No se pudo retirar la participación</Message>,
                                        { placement: 'topEnd' }
                                    );
                                });
                        }
                    }}
                >
                    <CloseIcon fontSize={'14px'} />
                </button>
                <Image
                    src={
                        file.blobFile instanceof File
                            ? URL.createObjectURL(file.blobFile)
                            : typeof file.blobFile === 'string'
                                ? file.blobFile
                                : file.url
                    }
                    alt={file.name}
                    style={{ width: '100%', height: 'auto' }}
                />
            </div>
        );
    };

    if (challenge?.winner) {
        return (
            <div className={styles.challengeCard}>
                <div>
                    <h2>{challenge.title}</h2>
                    <p>{challenge.description}</p>
                    <div className={styles.winnerBadge}>🥇 {challenge.winner.name}</div>
                </div>
                {winnerPhoto && (
                    <div className={styles.uploadUniqueImage} onClick={handleOpenWinnerLightbox}>
                        <Image src={winnerPhoto.src} alt={winnerPhoto.alt} style={{ width: '100%', height: 'auto' }} />
                    </div>
                )}
                {winnerLightboxOpen && winnerPhoto && (
                    <Lightbox
                        slides={[winnerPhoto]}
                        index={0}
                        onClose={() => setWinnerLightboxOpen(false)}
                        onIndexChange={() => {}}
                        commentCounts={commentCounts}
                        onCommentPosted={(fileId) => {
                            setCommentCounts(prev => ({
                                ...prev,
                                [fileId]: (prev[fileId] || 0) + 1,
                            }));
                        }}
                        onCommentDeleted={(fileId) => {
                            setCommentCounts(prev => ({
                                ...prev,
                                [fileId]: Math.max(0, (prev[fileId] || 1) - 1),
                            }));
                        }}
                    />
                )}
            </div>
        );
    }

    const isExpired = new Date(challenge.endDate).getTime() <= now.getTime();

    return (
        <div className={styles.challengeCard}>
            <div>
                <h2>{challenge.title}</h2>
                <p>{challenge.description}</p>
                <p>{challenge.topic}</p>
                <span className={styles.countdown}>⏱ {renderCountdown(challenge.endDate, now)}</span>
            </div>
            {file
                ? renderFile()
                : !isExpired && (
                    <div style={{ display: 'flex', gap: 8 }}>
                        <Upload
                            onlyButton
                            extraParams={{ challengeId: challenge.id }}
                            onUpload={(files) => {
                                if (files.length === 0) return;
                                setFile(files[0]);
                            }}
                        />
                        <Button appearance="ghost" onClick={handleOpenMyPhotos}>
                            Mis fotos
                        </Button>
                    </div>
                )
            }

            <Modal open={myPhotosModalOpen} onClose={() => setMyPhotosModalOpen(false)} size="lg">
                <Modal.Header>
                    <Modal.Title>Elige una foto tuya</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                    {myPhotosLoading ? (
                        <Loader center size="lg" />
                    ) : myPhotos.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#888' }}>No tienes fotos subidas a este evento.</p>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                            {myPhotos.map(photo => (
                                <div
                                    key={photo.id}
                                    style={{ cursor: 'pointer', borderRadius: 8, overflow: 'hidden' }}
                                    onClick={() => handleSelectMyPhoto(photo)}
                                >
                                    <img src={photo.compressedSrc} alt={photo.id} style={{ width: '100%', height: 'auto', display: 'block' }} />
                                </div>
                            ))}
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <button onClick={() => setMyPhotosModalOpen(false)}>Cerrar</button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export { Challenge };
