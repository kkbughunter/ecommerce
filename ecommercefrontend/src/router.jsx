import { Navigate, createBrowserRouter } from "react-router-dom";
import adminRoutes from "./features/admin/routes";
import authRoutes from "./features/auth/routes";
import clientRoutes from "./features/client/routes";
import legalRoutes from "./features/legal/routes";
import LandingPageView from "./features/landing/views/LandingPageView";
import productRoutes from "./features/product/routes";

const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPageView />,
  },
  ...authRoutes,
  ...adminRoutes,
  ...clientRoutes,
  ...productRoutes,
  ...legalRoutes,
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);

export default router;
