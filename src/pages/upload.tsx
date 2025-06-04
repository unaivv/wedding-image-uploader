import { Link } from "react-router-dom";
import Upload from "../components/Upload";
import { Button } from "rsuite";

const UploadPage = () => {
    return (
        <div>
            <h1>Sube tus fotos.</h1>
            <Link to="/">
                <Button appearance="link">
                    Ver todas las fotos subidas
                </Button>
            </Link>
            <Upload />
        </div>
    );
}

export default UploadPage;