import { Navigate, Outlet } from 'react-router-dom';
import { auth } from '../../../utils/auth';

const AdminRoute = () => {
    if (!auth.isLoggedIn()) return <Navigate to="/login" />;
    if (!auth.isAdmin()) return <Navigate to="/" />;
    return <Outlet />;
};

export { AdminRoute };
