import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../utils/authSession';

const RootRedirect = () => {
  return isAuthenticated() ? <Navigate to="/shop" replace /> : <Navigate to="/login" replace />;
};

export default RootRedirect;
