import type { IChallengeProps } from "./types";
import styles from "./Challenge.module.css";
import { renderCountdown } from "./util";
import { useEffect, useState } from "react";
import Upload from "../../Upload";
import type { FileType } from "rsuite/esm/Uploader";
import { Image } from "rsuite";
import { CloseIcon } from "yet-another-react-lightbox";
import { auth } from "../../../utils/auth";

const Challenge = ({ challenge }: IChallengeProps) => {
    const [now, setNow] = useState(new Date());
    const [file, setFile] = useState<FileType | null>(() => {
        const backendFile = challenge.participants.find(participant => participant.user._id === auth.getUserId())?.file || null;
        if (!backendFile) return null;
        return {
            name: backendFile.id,
            url: backendFile.compressedSrc,
            fileKey: backendFile.id,
            blobFile: undefined,
        } as FileType;
    });

    useEffect(() => {
        const interval = setInterval(() => {
            setNow(new Date());
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    const renderFile = () => {
        if (file === null) {
            return <p className={styles.error}>No has subido ninguna foto a este reto.</p>;
        }
        return (
            <div className={styles.uploadUniqueImage}>
                <span
                    className={styles.remove}
                    onClick={(e) => {
                        e.stopPropagation();
                        alert('eliminar foto');
                    }}
                >
                    <CloseIcon fontSize={'16px'} />
                </span>
                <Image
                    src={
                        file.blobFile instanceof File
                            ? URL.createObjectURL(file.blobFile)
                            : typeof file.blobFile === 'string'
                                ? file.blobFile
                                : file.url
                    }
                    alt={file.name} style={{ width: '100%', height: 'auto', marginBottom: 10 }}
                />
            </div>
        )
    }

    return (
        <div
            key={challenge.id}
            className={styles.challengeCard}
        >
            <div>
                <h2>{challenge.title}</h2>
                <p>{challenge.description}</p>
                <p>
                    <strong>Topic:</strong> {challenge.topic}
                </p>
                <p>
                    <strong>Quedan</strong> {renderCountdown(challenge.endDate, now)}
                </p>
            </div>
            {
                file
                    ? renderFile()
                    : <Upload
                        onlyButton
                        extraParams={{
                            challengeId: challenge.id
                        }}
                        onUpload={(files) => {
                            console.log(files)
                            if (files.length === 0) {
                                return;
                            }
                            setFile(files[0]);
                        }}
                    />
            }
        </div>
    );
}

export default Challenge;