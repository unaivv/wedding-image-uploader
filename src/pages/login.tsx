import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { auth } from "../utils/auth";
import { useToaster, Message } from "rsuite";
import styles from "./Login.module.css";

const Login = () => {
    const navigate = useNavigate();
    const toaster = useToaster();

    useEffect(() => {
        if (auth.isLoggedIn()) {
            navigate("/");
        }
    }, [navigate]);

    return (
        <div className={styles.page}>
            <div className={styles.card}>
                <span className={styles.ring}>💍</span>
                <h1 className={styles.title}>Unai & Marifeli</h1>
                <p className={styles.date}>15 · Noviembre · 2025</p>
                <div className={styles.divider} />
                <p className={styles.subtitle}>
                    Bienvenido al álbum de nuestra boda.<br />
                    Inicia sesión para ver y subir fotos.
                </p>
                <div className={styles.loginWrapper}>
                    <GoogleLogin
                        onSuccess={async (credentialResponse) => {
                            if (credentialResponse.credential) {
                                const result = await auth.login(credentialResponse.credential);
                                if (result) {
                                    navigate("/");
                                    return;
                                }
                                toaster.push(
                                    <Message type="error" showIcon closable>Error al iniciar sesión, por favor inténtalo de nuevo.</Message>,
                                    { placement: 'topEnd' }
                                );
                            }
                        }}
                        onError={() => {
                            toaster.push(
                                <Message type="error" showIcon closable>Error al iniciar sesión con Google.</Message>,
                                { placement: 'topEnd' }
                            );
                        }}
                        logo_alignment="center"
                        containerProps={{ style: { display: 'flex', justifyContent: 'center' } }}
                    />
                </div>
            </div>
        </div>
    );
};

export { Login };
