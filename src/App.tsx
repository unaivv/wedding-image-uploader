import './App.css'
import './index.css'
import 'rsuite/dist/rsuite-no-reset.min.css';
import { CustomProvider } from 'rsuite';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { HomePage } from './pages/home';
import { UploadPage } from './pages/upload';
import { Login } from './pages/login';
import { GoogleOAuthProvider } from '@react-oauth/google';
import PrivateRoute from './components/PrivateRoute';

const App = () => (
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    <BrowserRouter>
      <CustomProvider theme="dark">
        <Routes>
          <Route element={<PrivateRoute />}>
            <Route path="/" element={<HomePage />} />
            <Route path="subir" element={<UploadPage />} />
          </Route>
          <Route path="login" element={<Login />} />
        </Routes>
      </CustomProvider>
    </BrowserRouter>
  </GoogleOAuthProvider>
);

export { App };
