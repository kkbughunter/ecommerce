import { Navigate, useLocation } from "react-router-dom";
import { getHomePathByRole, hasAnyRole, isAuthenticated } from "./session";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles.length && !hasAnyRole(allowedRoles)) {
    return <Navigate to={getHomePathByRole()} replace />;
  }

  return children;
};

export default ProtectedRoute;
