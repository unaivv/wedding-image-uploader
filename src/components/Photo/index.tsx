import { type RenderImageContext, type RenderImageProps } from "react-photo-album";
import { Image, Loader } from "rsuite";
import type { IPhoto, IUser } from "../AllPhotos/types";
import styles from "./Photo.module.css";
import CloseIcon from '@rsuite/icons/Close';
import { deleteFile, likeFile } from "../Upload/service";
import { useState, useRef } from "react";
import { auth } from "../../utils/auth";

const Photo = (
  { alt = "", title, sizes }: RenderImageProps,
  { photo, width, height }: RenderImageContext,
  deleteLocalPhotos: (photoId: string) => void
) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [showLikes, setShowLikes] = useState(false);
  const holdTimeout = useRef<NodeJS.Timeout | null>(null);
  const isHolding = useRef(false);

  const userName = (photo as IPhoto).user.name || (photo as IPhoto).user.email || 'User'
  const canDelete = auth.getUserId() === (photo as IPhoto).user._id

  const [liked, setLiked] = useState<boolean>(
    ((photo as IPhoto).likedBy || [])
      .some((user) => (typeof user === "object" ? user._id : user) === (auth.getUserId() || ""))
  );

  const likedUsers = ((photo as IPhoto).likedBy || []).map(
    (user) => {
      if (typeof user === "object") {
        return user.fullName || user.name || user.email || 'User';
      }
      return user;
    }
  );

  const handleDelete = (e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
    e.stopPropagation();
    if (loading || !canDelete) return;
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

  const handleLikeButtonTouchStart = (e: React.TouchEvent<HTMLSpanElement>) => {
    e.stopPropagation();
    isHolding.current = false;
    holdTimeout.current = setTimeout(() => {
      setShowLikes(true);
      isHolding.current = true;
    }, 400);
  };

  const handleLikeButtonTouchEnd = (e: React.TouchEvent<HTMLSpanElement>) => {
    e.stopPropagation();
    if (holdTimeout.current) {
      clearTimeout(holdTimeout.current);
    }
    if (isHolding.current) {
      setShowLikes(false);
      isHolding.current = false;
    }
  };

  const handleLike = (e: React.MouseEvent<HTMLSpanElement, MouseEvent> | React.TouchEvent<HTMLSpanElement>) => {
    e.stopPropagation();
    if (isHolding.current) return;
    likeFile((photo as IPhoto).id || "", auth.getUserId() || "")
      .then((liked) => {
        setLiked(liked);
        if (liked) {
          const userId = auth.getUserId();
          if (userId) {
            (photo as IPhoto).likedBy = [
              ...((photo as IPhoto).likedBy || []),
              { _id: userId } as IUser
            ];
          }
        } else {
          (photo as IPhoto).likedBy = (photo as IPhoto).likedBy?.filter(user => {
            const userId = typeof user === "object" ? user._id : user;
            return userId !== auth.getUserId();
          });
        }
      })
      .catch((error) => {
        console.error("Error liking file:", error);
      });
  };

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
            <CloseIcon fontSize={'1em'} color="white" />
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
      <div className={styles.photoBottom}>
        <div className={styles.userNameWrapper}>
          <div className={styles.avatar}>
            <Image
              src={(photo as IPhoto).user.picture}
              alt={userName}
              circle
              style={{ width: '20px', height: '20px' }}
            />
          </div>
          <span>{userName?.split('@')[0]}</span>
        </div>
        <div className={styles.actions} style={{ position: "relative" }}>
          <span
            className={`${styles.likeButton} ${liked ? styles.liked : ''}`}
            onClick={handleLike}
            onMouseEnter={() => setShowLikes(true)}
            onMouseLeave={() => setShowLikes(false)}
            onTouchStart={handleLikeButtonTouchStart}
            onTouchEnd={handleLikeButtonTouchEnd}
          >
            {liked ? '❤️' : '🤍'} {((photo as IPhoto).likedBy || []).length}
            {showLikes && likedUsers.length > 0 && (
              <div className={styles.likesTooltip}>
                <span>Le gusta a:</span>
                {likedUsers.map((name, idx) => (
                  <div key={idx}>{name}</div>
                ))}
              </div>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

export default Photo