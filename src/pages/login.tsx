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
            onSuccess={(credentialResponse) => {
                if (credentialResponse.credential) {
                    auth.saveToken(credentialResponse.credential);
                    navigate("/");
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