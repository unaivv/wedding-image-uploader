import { GoogleLogin } from "@react-oauth/google";

const Login = () => {
    return <>
        <h1>Inicia sesión con google:</h1>
        <GoogleLogin
            onSuccess={(credentialResponse) => {
                console.log(credentialResponse);
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