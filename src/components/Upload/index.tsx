import { Button, Uploader } from 'rsuite';
import { auth } from '../../utils/auth';

const Upload = () => {
    const userEmail = auth.getUserEmail();
    const userName = auth.getUserName();

    return (
        <div style={{
            width: '100%',}}>
            <Uploader
                action={`${import.meta.env.VITE_BACKEND_URL}/files/upload`}
                draggable
                accept="image/*"
                multiple
                listType="picture"
                data={{
                    eventId: '683ef05ad8795795535d3b4f',
                    userEmail: userEmail,
                    userName: userName
                }}
                style={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'stretch',
                }}
                headers={{
                    "ngrok-skip-browser-warning": "69420",
                }}
            >
                <div style={{ 
                    width: '100%', 
                    height: 200, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    flexDirection: 'column',
                    padding: 20,
                }}>
                    <span style={{
                        textAlign: 'center',
                        fontSize: 16,
                        color: '#888',
                        marginBottom: 10,
                        maxWidth: '100%',
                        overflowWrap: 'break-word',
                        wordBreak: 'break-word',
                        whiteSpace: 'normal',
                    }}>
                        Haz clic o arrastra archivos a esta área para subirlos. Maximos archivos a la vez 10
                    </span>
                    <Button appearance="primary" style={{ marginTop: 10 }}>
                        Selecciona tus fotos!
                    </Button>
                </div>
            </Uploader>
        </div>
    );
}

export default Upload;