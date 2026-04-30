import './App.css'
import './index.css'
import 'rsuite/dist/rsuite-no-reset.min.css';
import './rsuite-theme.css';
import { CustomProvider } from 'rsuite';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { HomePage } from './pages/home';
import { UploadPage } from './pages/upload';
import { AdminPage } from './pages/admin';
import { Login } from './pages/login';
import { GoogleOAuthProvider } from '@react-oauth/google';
import PrivateRoute from './components/PrivateRoute';
import { AdminRoute } from './components/Admin/AdminRoute';
import { ThemeContext } from './context/ThemeContext';
import { useTheme } from './hooks/useTheme';
import { useEffect } from 'react';

const App = () => {
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    document.body.dataset.theme = theme;
  }, [theme]);

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <ThemeContext.Provider value={{ theme, toggleTheme }}>
        <BrowserRouter>
          <CustomProvider theme={theme}>
            <div className="appShell">
            <Routes>
              <Route element={<PrivateRoute />}>
                <Route path="/" element={<HomePage />} />
                <Route path="subir" element={<UploadPage />} />
              </Route>
              <Route element={<AdminRoute />}>
                <Route path="admin" element={<AdminPage />} />
              </Route>
              <Route path="login" element={<Login />} />
            </Routes>
            </div>
          </CustomProvider>
        </BrowserRouter>
      </ThemeContext.Provider>
    </GoogleOAuthProvider>
  );
};

export { App };
