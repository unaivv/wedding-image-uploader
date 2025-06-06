

import { type RenderImageContext, type RenderImageProps } from "react-photo-album";
import { Avatar, Image, Loader } from "rsuite";
import type { IPhoto } from "../AllPhotos/types";
import styles from "./Photo.module.css";
import CloseIcon from '@rsuite/icons/Close';
import { deleteFile } from "../Upload/service";
import { useState } from "react";
import { auth } from "../../utils/auth";

const Photo = (
  { alt = "", title, sizes }: RenderImageProps,
  { photo, width, height }: RenderImageContext,
  deleteLocalPhotos: (photoId: string) => void
) => {

  const [loading, setLoading] = useState<boolean>(false);

  const email = (photo as IPhoto).userEmail || (photo as IPhoto).userName;
  const userName = (photo as IPhoto).userName || (photo as IPhoto).userEmail || 'User'

  const canDelete = email === auth.getUserEmail();
  const handleDelete = (e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
    e.stopPropagation();
    if(loading || !canDelete) return;
    setLoading(true);
    deleteFile((photo as IPhoto).id || "")
      .then((success) => {
        if (success) {
          deleteLocalPhotos((photo as IPhoto).id || "");
          return true
        } 
        console.error("Failed to delete file");
        return false;
      })
      .catch((error) => {
        console.error("Error deleting file:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }

  return (
    <div
      style={{
        width: width,
        height: height + 30,
        position: "relative",
      }}
    >
      {
        loading && <div className={styles.loadingOverlay}>
          <Loader size="md" content="Borrando..." />
        </div>
      }
      {
        canDelete && (
          <span
            onClick={handleDelete}
            className={styles.removeButton}
          >
            <CloseIcon fontSize={'1em'} />
          </span>
        )
      }
      <Image
        src={photo.src}
        alt={alt}
        title={title}
        sizes={sizes}
        style={{
          objectFit: "cover",
          width: "100%",
          height: "calc(100% - 30px)",
        }}
      />
      <div className={styles.userNameWrapper}>
        <Avatar
          style={{
            backgroundColor: `#004299`,
          }}
          circle
          size="xs"
        >
          {
            userName.charAt(0)?.toUpperCase()
          }
        </Avatar>
        <span>{userName}</span>
      </div>
    </div>
  );
}

export default Photo