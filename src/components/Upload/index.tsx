import { Button, Uploader } from 'rsuite';

const Upload = () => {
    return (
        <div>
            <Uploader
                action="http://localhost:3000/files/upload"
                draggable
                accept="image/*"
                multiple
                listType="picture"
                data={{
                    eventId: '683ef05ad8795795535d3b4f',
                    userName: 'victor',
                }}
            >
                <div style={{
                    height: 200,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    padding: 20,
                    width: '100%',
                }}
                >
                    <span>
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