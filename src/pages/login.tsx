import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { auth } from "../utils/auth";

const Login = () => {
    const navigate = useNavigate();

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
                    const result = await auth.login(credentialResponse.credential)
                    if(result) {
                        navigate("/");
                        return
                    }
                    alert("Error al iniciar sesión, por favor inténtalo de nuevo.");
                }
            }}
            onError={() => {
                console.log('Login Failed');
            }}
            logo_alignment="left"
            containerProps={{ style: { width: '100%' } }}
        />
    </>
}

export default Login;