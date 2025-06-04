import { Button } from "rsuite";
import AllPhotos from "../components/AllPhotos";
import { Link } from "react-router-dom";

const HomePage = () => {
    return (
        <>
            <h1>Unai Y MF</h1>
            <Link to="/subir">
                <Button appearance="link">
                    Subir fotos
                </Button>
            </Link>
            <AllPhotos />
        </>
    );
}

export default HomePage;