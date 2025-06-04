import { Navigate, Outlet } from "react-router-dom";
import { auth } from "../../utils/auth";

const PrivateRoute = () => {
  return auth.isLoggedIn() ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoute;