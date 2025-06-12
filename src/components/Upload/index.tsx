import { Button, Uploader } from 'rsuite';
import { auth } from '../../utils/auth';
import { useRef, useState } from 'react';
import type { FileType, UploaderInstance } from 'rsuite/esm/Uploader/Uploader';
import styles from './Upload.module.css';
import CloseIcon from '@rsuite/icons/Close';
import CheckRoundIcon from '@rsuite/icons/CheckRound';
import type { IUploadProps } from './types';

const Upload = ({ onlyButton, extraParams = {}, onUpload = () => null }: IUploadProps) => {
    const userEmail = auth.getUserEmail();
    const userName = auth.getUserName();

    const uploaderRef = useRef<UploaderInstance>(null);

    const [loading, setLoading] = useState(false);
    const [files, setFiles] = useState<FileType[]>([]);

    const renderUploadInterior = () => {
        if (onlyButton) {
            return <Button appearance="ghost" style={{ marginTop: 10 }}>
                Selecciona tus foto!
            </Button>
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
            }}>
                Haz clic o arrastra archivos a esta área para subirlos. Maximos archivos a la vez 10.
            </span><Button appearance="ghost" style={{ marginTop: 10 }}>
                Selecciona tus fotos!
            </Button>
        </>
    }

    return (
        <div className={styles.upload}>
            <Button
                appearance="primary"
                style={{ marginTop: 20, width: '100%' }}
                onClick={() => {
                    if (uploaderRef.current) {
                        uploaderRef.current.start();
                    }
                }}
                disabled={!userEmail || !userName || loading || files.length === 0}
            >
                Subir imagen{!onlyButton && 'es'}
            </Button>
            <Uploader
                ref={uploaderRef}
                action={`${import.meta.env.VITE_BACKEND_URL}/files/upload`}
                draggable
                accept="image/*"
                multiple={!onlyButton}
                listType="picture"
                data={{
                    eventId: '683ef05ad8795795535d3b4f',
                    userId: auth.getUserId(),
                    ...extraParams
                }}
                style={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'stretch',
                }}
                headers={{
                    "ngrok-skip-browser-warning": "69420"
                }}
                autoUpload={false}
                renderThumbnail={(file) => {
                    return (
                        <>
                            {
                                file.status === "finished" && <div className={styles.success}>
                                    <CheckRoundIcon fontSize={'2em'} color='#000' />
                                </div>
                            }
                            {
                                file.status !== "finished" &&
                                <span
                                    className={styles.remove}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setFiles((prevFiles) => {
                                            return prevFiles.filter((f) => f.fileKey !== file.fileKey);
                                        });
                                    }}
                                >
                                    <CloseIcon fontSize={'0.7em'} />
                                </span>
                            }
                            <img
                                src={
                                    file?.blobFile
                                        ? (file.blobFile instanceof File
                                            ? URL.createObjectURL(file.blobFile)
                                            : typeof file.blobFile === 'string'
                                                ? file.blobFile
                                                : undefined)
                                        : file.url
                                }
                                alt={file.name}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                }}
                            />
                        </>
                    );
                }}
                onChange={(fileList) => {
                    setFiles(fileList);
                }}
                onSuccess={(response, file) => {
                    setLoading(false);
                    if (response && response.files && response.files.length > 0) {
                        setFiles((prevFiles) => {
                            const newFiles = prevFiles.map((f) => {
                                if (f.blobFile === file.blobFile) {
                                    return { ...file };
                                }
                                return f;
                            })
                            onUpload(newFiles);
                            return newFiles;
                        });
                    }
                }}
                onUpload={() => {
                    setLoading(true);
                }}
                fileList={files}
            >
                <div className={`${styles.uploadContainer} ${onlyButton ? styles.onlyButton : ''}`}>
                    {renderUploadInterior()}
                </div>
            </Uploader>
        </div>
    );
}

export default Upload;