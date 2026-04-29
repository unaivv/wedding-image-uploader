import { Button, Message, Uploader, useToaster } from 'rsuite';
import { auth } from '../../utils/auth';
import { useRef, useState } from 'react';
import type { FileType, UploaderInstance } from 'rsuite/esm/Uploader/Uploader';
import styles from './Upload.module.css';
import CloseIcon from '@rsuite/icons/Close';
import CheckRoundIcon from '@rsuite/icons/CheckRound';
import type { IUploadProps } from './types';
import { cn } from '../../utils/cn';
import { logger } from '../../utils/logger';

const Upload = ({ onlyButton, extraParams = {}, onUpload = () => null }: IUploadProps) => {
    const userEmail = auth.getUserEmail();
    const userName = auth.getUserName();
    const toaster = useToaster();

    const uploaderRef = useRef<UploaderInstance>(null);

    const [loading, setLoading] = useState(false);
    const [files, setFiles] = useState<FileType[]>([]);
    const [progress, setProgress] = useState<Map<string | number, number>>(new Map());
    const [caption, setCaption] = useState('');

    const renderUploadInterior = () => {
        if (onlyButton) {
            return <Button appearance="ghost">Selecciona tus fotos</Button>;
        }
        return <>
            <span style={{
                textAlign: 'center',
                fontSize: 16,
                color: '#888',
                marginBottom: 10,
                maxWidth: '100%',
                overflowWrap: 'break-word',
                wordBreak: 'break-word',
                whiteSpace: 'normal',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                Haz clic o arrastra archivos a esta área para subirlos. Maximos archivos a la vez 10.
            </span>
            <Button appearance="ghost">Selecciona tus fotos</Button>
        </>;
    };

    return (
        <div className={styles.upload}>
            {!onlyButton && (
                <textarea
                    value={caption}
                    onChange={e => setCaption(e.target.value)}
                    placeholder="Añade un caption (opcional)"
                    maxLength={200}
                    rows={2}
                    className={styles.captionInput}
                />
            )}
            <Uploader
                ref={uploaderRef}
                action={`${import.meta.env.VITE_BACKEND_URL}/files/upload`}
                draggable
                accept="image/*,video/*"
                multiple={!onlyButton}
                listType="picture"
                data={{
                    eventId: import.meta.env.VITE_EVENT_ID,
                    userId: auth.getUserId(),
                    caption,
                    ...extraParams
                }}
                style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'stretch' }}
                headers={{
                    userId: auth.getUserId() || '',
                    'google-token': auth.getToken() || '',
                }}
                autoUpload={onlyButton}
                renderThumbnail={(file) => {
                    const pct = file.fileKey !== undefined ? (progress.get(file.fileKey) ?? null) : null;
                    return (
                        <>
                            {file.status === "finished" && (
                                <div className={styles.success}>
                                    <CheckRoundIcon fontSize={'2em'} color='#000' />
                                </div>
                            )}
                            {file.status !== "finished" && (
                                <button
                                    type="button"
                                    className={styles.remove}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setFiles(prev => prev.filter(f => f.fileKey !== file.fileKey));
                                    }}
                                >
                                    <CloseIcon fontSize={'0.7em'} />
                                </button>
                            )}
                            {pct !== null && pct < 100 && (
                                <div className={styles.progressOverlay}>
                                    <div className={styles.progressBar} style={{ width: `${pct}%` }} />
                                    <span className={styles.progressLabel}>{pct}%</span>
                                </div>
                            )}
                            <img
                                src={
                                    file?.blobFile
                                        ? (file.blobFile instanceof File ? URL.createObjectURL(file.blobFile) : typeof file.blobFile === 'string' ? file.blobFile : undefined)
                                        : file.url
                                }
                                alt={file.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        </>
                    );
                }}
                onChange={(fileList) => setFiles(fileList)}
                onProgress={(percent, file) => {
                    if (file.fileKey !== undefined) {
                        setProgress(prev => new Map(prev).set(file.fileKey!, percent));
                    }
                }}
                onSuccess={(response, file) => {
                    setLoading(false);
                    if (file.fileKey !== undefined) {
                        setProgress(prev => { const next = new Map(prev); next.delete(file.fileKey!); return next; });
                    }
                    if (response?.files?.length > 0) {
                        setFiles(prev => {
                            const newFiles = prev.map(f => f.blobFile === file.blobFile ? { ...file } : f);
                            onUpload(newFiles);
                            return newFiles;
                        });
                        toaster.push(
                            <Message type="success" showIcon closable>Foto subida correctamente</Message>,
                            { placement: 'topEnd' }
                        );
                    }
                }}
                onError={(reason) => {
                    setLoading(false);
                    logger.error('upload failed', reason);
                    toaster.push(
                        <Message type="error" showIcon closable>Error al subir la foto. Inténtalo de nuevo.</Message>,
                        { placement: 'topEnd' }
                    );
                }}
                onUpload={() => setLoading(true)}
                fileList={files}
            >
                <div className={cn(styles.uploadContainer, onlyButton && styles.onlyButton)}>
                    {renderUploadInterior()}
                </div>
            </Uploader>
            {!onlyButton && (
                <Button
                    appearance="primary"
                    className={styles.submitButton}
                    onClick={() => uploaderRef.current?.start()}
                    disabled={!userEmail || !userName || loading || files.length === 0}
                >
                    Subir imágenes
                </Button>
            )}
        </div>
    );
};

export { Upload };
