import { useEffect, useState } from "react";
import { getAllPhotos } from "./service";
import { RowsPhotoAlbum } from "react-photo-album";
import "react-photo-album/rows.css";
import "yet-another-react-lightbox/styles.css";
import Lightbox from "yet-another-react-lightbox";
import styles from './allPhotos.module.css';
import { auth } from "../../utils/auth";
import { Button, ButtonGroup, Loader, SelectPicker, Toggle } from "rsuite";
import Zoom from "yet-another-react-lightbox/plugins/zoom";

const AllPhotos = () => {

    const [photos, setPhotos] = useState<any[] | undefined | null>(undefined);
    const [lightboxPhotos, setLightboxPhotos] = useState<any[] | undefined | null>(undefined);
    const [index, setIndex] = useState(-1);

    const [seeAllFotos, setAllPhotos] = useState<'true' | 'false'>('true');

    useEffect(() => {
        setPhotos(undefined);
        const user = auth.getUser()
        if (auth.isLoggedIn() && user) {
            getAllPhotos('683ef05ad8795795535d3b4f',
                seeAllFotos === 'true' ? undefined : user
            )
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
                defaultChecked 
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