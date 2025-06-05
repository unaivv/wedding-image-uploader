import { useEffect, useState } from "react";
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

    useEffect(() => {
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
                        user: photo.user
                    })));
                    setLightboxPhotos(data.map((photo: IPhotosFromBackend):IPhoto => ({
                        src: photo.fileName,
                        width: 1500,
                        height: 1500,
                        id: photo.id,
                        alt: photo.fileName,
                        user: photo.user
                    })));
                })
                .catch(() => {
                    setPhotos(null);
                    setLightboxPhotos(null);
                });
        }
    }, [seeAllFotos]);

    const renderPhotos = () => {
        if (photos === undefined) {
            return <Loader />
        }

        if (photos === null) {
            return <p>Error cargando las fotos</p>
        }

        if (photos.length === 0) {
            return <p>No hay fotos</p>
        }

        return <>
            <RowsPhotoAlbum
                photos={photos}
                targetRowHeight={150}
                onClick={({ index: current }) => setIndex(current)}
                padding={2.5}
                render={{ image: Photo }}
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
        </>
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
            {renderPhotos()}
        </div>
    );
}

export default AllPhotos;