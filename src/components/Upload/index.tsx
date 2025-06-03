import { Button, Uploader } from 'rsuite';

const Upload = () => {
    return (
        <div>
            <Uploader 
                action="https://jsonplaceholder.typicode.com/posts/"
                draggable
                accept="image/*"
                multiple
                listType="picture"
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
                        Haz clic o arrastra archivos a esta área para subirlos
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