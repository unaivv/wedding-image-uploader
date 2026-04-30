import type { IChallengeProps } from "./types";
import styles from "./Challenge.module.css";
import { renderCountdown } from "./util";
import { useEffect, useState } from "react";
import { Upload } from "../../Upload";
import type { FileType } from "rsuite/esm/Uploader";
import { Image, Message, useToaster } from "rsuite";
import { CloseIcon } from "yet-another-react-lightbox";
import { auth } from "../../../utils/auth";
import { deleteParticipation } from "./service";
import { Lightbox } from "../../Lightbox";
import type { IPhoto } from "../../AllPhotos/types";

const Challenge = ({ challenge }: IChallengeProps) => {
    const toaster = useToaster();
    const [now, setNow] = useState(new Date());
    const [winnerLightboxOpen, setWinnerLightboxOpen] = useState(false);
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

    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

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
        const winnerParticipant = challenge.participants.find(p => p.user._id === challenge.winner!._id);
        const winnerFile = winnerParticipant?.file;
        const winnerPhoto: IPhoto | null = winnerFile
            ? {
                  id: winnerFile.id,
                  src: winnerFile.compressedSrc,
                  fullSrc: winnerFile.fullSrc ?? winnerFile.compressedSrc,
                  alt: winnerFile.id,
                  width: 0,
                  height: 0,
                  user: challenge.winner,
                  likedBy: [],
              }
            : null;

        return (
            <div className={styles.challengeCard}>
                <div>
                    <h2>{challenge.title}</h2>
                    <p>{challenge.description}</p>
                    <div className={styles.winnerBadge}>🥇 {challenge.winner.name}</div>
                </div>
                {winnerPhoto && (
                    <div className={styles.uploadUniqueImage} onClick={() => setWinnerLightboxOpen(true)}>
                        <Image src={winnerPhoto.src} alt={winnerPhoto.alt} style={{ width: '100%', height: 'auto' }} />
                    </div>
                )}
                {winnerLightboxOpen && winnerPhoto && (
                    <Lightbox
                        slides={[winnerPhoto]}
                        index={0}
                        onClose={() => setWinnerLightboxOpen(false)}
                        onIndexChange={() => {}}
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
                    <Upload
                        onlyButton
                        extraParams={{ challengeId: challenge.id }}
                        onUpload={(files) => {
                            if (files.length === 0) return;
                            setFile(files[0]);
                        }}
                    />
                )
            }
        </div>
    );
};

export { Challenge };
