import { Navigate } from "react-router-dom";
import { getHomePathByRole, isAuthenticated } from "./session";

const AppEntryRedirect = () => {
  if (isAuthenticated()) {
    return <Navigate to={getHomePathByRole()} replace />;
  }

  return <Navigate to="/login" replace />;
};

export default AppEntryRedirect;
