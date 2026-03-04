import { Navigate } from "react-router-dom";
import { getHomePathByRole, isAuthenticated } from "./session";

const PublicOnlyRoute = ({ children }) => {
  if (isAuthenticated()) {
    return <Navigate to={getHomePathByRole()} replace />;
  }

  return children;
};

export default PublicOnlyRoute;
