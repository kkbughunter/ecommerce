import { Navigate, createBrowserRouter } from "react-router-dom";
import AppEntryRedirect from "./core/auth/AppEntryRedirect";
import adminRoutes from "./features/admin/routes";
import authRoutes from "./features/auth/routes";
import clientRoutes from "./features/client/routes";
import productRoutes from "./features/product/routes";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppEntryRedirect />,
  },
  ...authRoutes,
  ...adminRoutes,
  ...clientRoutes,
  ...productRoutes,
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);

export default router;
