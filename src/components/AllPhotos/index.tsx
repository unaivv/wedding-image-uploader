import { useEffect, useState } from "react";
import { getAllPhotos } from "./service";

import { RowsPhotoAlbum } from "react-photo-album";
import "react-photo-album/rows.css";
import "yet-another-react-lightbox/styles.css";
import Lightbox from "yet-another-react-lightbox";

import styles from './allPhotos.module.css';

const AllPhotos = () => {

    const [photos, setPhotos] = useState<any[] | undefined | null>(undefined);
    const [lightboxPhotos, setLightboxPhotos] = useState<any[] | undefined | null>(undefined);
    const [index, setIndex] = useState(-1);

    useEffect(() => {
        getAllPhotos('683ef05ad8795795535d3b4f')
            .then((data) => {
                setPhotos(data.map((photo: any) => ({
                    src: photo.fileName,
                    width: 200,
                    height: 200,
                    id: photo.id,
                    alt: photo.fileName
                })));
                setLightboxPhotos(data.map((photo: any) => ({
                    src: photo.fileName,
                    width: 1500,
                    height: 1500,
                    id: photo.id,
                    alt: photo.fileName
                })));
            })
            .catch(() => {
                setPhotos(null);
                setLightboxPhotos(null);
            });
    }, []);

    const renderPhotos = () => {
        if (photos === undefined) {
            return <p>Cargando...</p>
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
            />

            <Lightbox
                index={index}
                slides={lightboxPhotos || []}
                open={index >= 0}
                close={() => setIndex(-1)}
            />
        </>
    }


    return (
        <div className={styles.allPhotosConatiner}>
            {renderPhotos()}
        </div>
    );
}

export default AllPhotos;