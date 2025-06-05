

import { type RenderImageContext, type RenderImageProps } from "react-photo-album";
import { Avatar, Image} from "rsuite";
import type { IPhoto } from "../AllPhotos/types";
import styles from "./Photo.module.css";

const Photo = (
  { alt = "", title, sizes }: RenderImageProps,
  { photo, width, height }: RenderImageContext,
) => {
  return (
    <div
      style={{
        width: width,
        height: height + 30,
        position: "relative",
      }}
    >
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
            (photo as IPhoto).user?.charAt(0)?.toUpperCase() || "U"
          }
        </Avatar>
        <span>{(photo as IPhoto).user?.split('@')[0]}</span>
      </div>
    </div>
  );
}

export default Photo