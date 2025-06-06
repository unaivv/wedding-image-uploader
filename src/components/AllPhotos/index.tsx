import { useCallback, useEffect, useState } from "react";
import { getAllPhotos } from "./service";
import { RowsPhotoAlbum } from "react-photo-album";
import "react-photo-album/rows.css";
import "yet-another-react-lightbox/styles.css";
import Lightbox from "yet-another-react-lightbox";
import styles from './allPhotos.module.css';
import { auth } from "../../utils/auth";
import { Loader, Toggle } from "rsuite";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Photo from "../Photo";
import type { IPhoto, IPhotosFromBackend } from "./types";

const AllPhotos = () => {

    const [photos, setPhotos] = useState<IPhoto[] | undefined | null>(undefined);
    const [lightboxPhotos, setLightboxPhotos] = useState<IPhoto[] | undefined | null>(undefined);
    const [index, setIndex] = useState(-1);

    const [seeAllFotos, setAllPhotos] = useState<'true' | 'false'>('true');

    const handleGetAllPhotos = useCallback(() => {
        if(photos !== undefined) return;

        setPhotos(undefined);
        const userEmail = auth.getUserEmail()
        if (auth.isLoggedIn() && userEmail) {
            getAllPhotos('683ef05ad8795795535d3b4f',
                seeAllFotos === 'true' ? undefined : userEmail
            )
                .then((data: IPhotosFromBackend[]) => {
                    setPhotos(data.map((photo: IPhotosFromBackend):IPhoto => ({
                        src: photo.fileName,
                        width: 200,
                        height: 200,
                        id: photo.id,
                        alt: photo.fileName,
                        userName: photo.userName || photo.userEmail || photo?.user?.split('@')[0],
                        userEmail: photo.userEmail
                    })));
                    setLightboxPhotos(data.map((photo: IPhotosFromBackend):IPhoto => ({
                        src: photo.fileName,
                        width: 1500,
                        height: 1500,
                        id: photo.id,
                        alt: photo.fileName,
                        userName: photo.userName || photo.userEmail || photo?.user?.split('@')[0]
                    })));
                })
                .catch(() => {
                    setPhotos(null);
                    setLightboxPhotos(null);
                });
        }
    }, [seeAllFotos]);

    useEffect(() => {
        handleGetAllPhotos();
    }, [handleGetAllPhotos]);

    const deleteLocalPhotos = (photoId:string) => {
        setPhotos((prevPhotos) => {
            if (!prevPhotos) return prevPhotos;
            return prevPhotos.filter(photo => photo.id !== photoId);
        });
        setLightboxPhotos((prevLightboxPhotos) => {
            if (!prevLightboxPhotos) return prevLightboxPhotos;
            return prevLightboxPhotos.filter(photo => photo.id !== photoId);
        });
        setIndex(-1);
    }

    const renderPhotos = () => {
        if (photos === undefined) {
            return <Loader size="lg" style={{marginTop: '2em'}} />
        }

        if (photos === null) {
            return <p>Error cargando las fotos</p>
        }

        if (photos.length === 0) {
            return <p>No hay fotos</p>
        }

        return (<>
            <RowsPhotoAlbum
                photos={photos}
                targetRowHeight={150}
                onClick={({ index: current }) => setIndex(current)}
                padding={2.5}
                render={{
                    image: (props, context) =>
                        Photo(
                            props,
                            context,
                            deleteLocalPhotos
                        )
                }}
            />
            <Lightbox
                index={index}
                slides={lightboxPhotos || []}
                open={index >= 0}
                close={() => setIndex(-1)}
                plugins={[Zoom]}
                zoom={{
                    maxZoomPixelRatio: 2,
                    scrollToZoom: true,
                }}
            />
        </>)
    }


    return (
        <div className={styles.allPhotosConatiner}>
            <Toggle
                size="lg"
                checkedChildren="Todas"
                unCheckedChildren="Mias"
                checked={seeAllFotos === 'true'}
                onChange={
                    (value: boolean) => setAllPhotos(value ? 'true' : 'false')
                }
                style={{ marginBottom: 20 }} 
            />
            <div>
                {renderPhotos()}
            </div>
        </div>
    );
}

export default AllPhotos;