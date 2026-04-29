import { Link } from "react-router-dom";
import { Upload } from "../components/Upload";
import styles from "./Upload.module.css";

const UploadPage = () => {
    return (
        <div className={styles.page}>
            <Link to="/" className={styles.back}>
                ← Volver al álbum
            </Link>
            <h1 className={styles.heading}>Subí tus fotos</h1>
            <p className={styles.sub}>Tus fotos aparecerán en el álbum compartido al instante.</p>
            <div className={styles.card}>
                <Upload />
            </div>
        </div>
    );
};

export { UploadPage };
