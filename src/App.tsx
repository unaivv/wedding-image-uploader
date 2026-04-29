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
import { ThemeContext } from './context/ThemeContext';
import { useTheme } from './hooks/useTheme';

const App = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <ThemeContext.Provider value={{ theme, toggleTheme }}>
        <BrowserRouter>
          <CustomProvider theme={theme}>
            <Routes>
              <Route element={<PrivateRoute />}>
                <Route path="/" element={<HomePage />} />
                <Route path="subir" element={<UploadPage />} />
              </Route>
              <Route path="login" element={<Login />} />
            </Routes>
          </CustomProvider>
        </BrowserRouter>
      </ThemeContext.Provider>
    </GoogleOAuthProvider>
  );
};

export { App };
