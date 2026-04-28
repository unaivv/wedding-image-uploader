import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { auth } from "../utils/auth";
import { useToaster, Message } from "rsuite";

const Login = () => {
    const navigate = useNavigate();
    const toaster = useToaster();

    useEffect(() => {
        if (auth.isLoggedIn()) {
            navigate("/");
        }
    }, [navigate]);

    return <>
        <h1>Inicia sesión con google:</h1>
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
            logo_alignment="left"
            containerProps={{ style: { width: '100%' } }}
        />
    </>;
};

export { Login };
