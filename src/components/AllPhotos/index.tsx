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
import { Button } from "rsuite";
import { Link } from "react-router-dom";
import PlusIcon from '@rsuite/icons/Plus';
import ReloadIcon from '@rsuite/icons/Reload'; // Agrega este import si tienes el icono, o usa otro

const AllPhotos = () => {

    const [photos, setPhotos] = useState<IPhoto[] | undefined | null>(undefined);
    const [lightboxPhotos, setLightboxPhotos] = useState<IPhoto[] | undefined | null>(undefined);
    const [index, setIndex] = useState(-1);
    const [orderByLikes, setOrderByLikes] = useState<boolean>(false);

    const [seeAllFotos, setAllPhotos] = useState<'true' | 'false'>('true');

    const handleGetAllPhotos = useCallback(() => {
        setPhotos(undefined);
        const userId = auth.getUserId()
        if (auth.isLoggedIn() && userId) {
            getAllPhotos(
                '683ef05ad8795795535d3b4f',
                seeAllFotos === 'true' ? undefined : userId
            )
                .then((data: IPhotosFromBackend[]) => {
                    setPhotos(data.map((photo: IPhotosFromBackend): IPhoto => ({
                        src: photo.compressedSrc,
                        width: 200,
                        height: 200,
                        id: photo.id,
                        alt: '',
                        user: photo.userId,
                        likedBy: photo.likedBy || [],
                    })));
                    setLightboxPhotos(data.map((photo: IPhotosFromBackend): IPhoto => ({
                        src: photo.fullSrc,
                        width: 1500,
                        height: 1500,
                        id: photo.id,
                        alt: photo.fullSrc,
                        user: photo.userId,
                        likedBy: photo.likedBy || [],
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

    const deleteLocalPhotos = (photoId: string) => {
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
            return <Loader size="lg" style={{ marginTop: '2em' }} />
        }

        if (photos === null) {
            return <p>Error cargando las fotos</p>
        }

        if (photos.length === 0) {
            return <p>No hay fotos</p>
        }

        return (<>
            <RowsPhotoAlbum
                photos={
                    [...photos].sort((a, b) => {
                        if (!orderByLikes) {
                            return new Date(b.id).getTime() - new Date(a.id).getTime();
                        }
                        return b.likedBy.length - a.likedBy.length;
                    })
                }
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
                slides={
                    [...(lightboxPhotos || [])].sort((a, b) => {
                        if (!orderByLikes) {
                            return new Date(b.id).getTime() - new Date(a.id).getTime();
                        }
                        return b.likedBy.length - a.likedBy.length;
                    })
                }
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
            <div className={styles.actions}>
                <div className={styles.left}>
                    <Link to="/subir">
                        <Button appearance="ghost" endIcon={<PlusIcon />}>
                            Subir fotos
                        </Button>
                    </Link>
                    <Button
                        appearance="ghost"
                        onClick={handleGetAllPhotos}
                        style={{ marginLeft: 8 }}
                        endIcon={<ReloadIcon />}
                    >
                        Refrescar
                    </Button>
                </div>
                <div className={styles.right}>
                    <div className={styles.sort}>
                        <span>Ordenar por:</span>
                        <Toggle
                            size="lg"
                            checkedChildren="Me gusta"
                            unCheckedChildren="Fecha"
                            checked={orderByLikes}
                            onChange={(value: boolean) => setOrderByLikes(value)}
                        />
                    </div>
                    <div className={styles.filters}>
                        <span>Filtrar:</span>
                        <Toggle
                            size="lg"
                            checkedChildren="Todas"
                            unCheckedChildren="Mias"
                            checked={seeAllFotos === 'true'}
                            onChange={
                                (value: boolean) => setAllPhotos(value ? 'true' : 'false')
                            }
                        />
                    </div>
                </div>
            </div>
            <div>
                {renderPhotos()}
            </div>
        </div>
    );
}

export default AllPhotos;