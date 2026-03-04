import ProtectedRoute from "../../core/auth/ProtectedRoute";
import AdminCreateProductView from "./views/AdminCreateProductView";
import AdminHomeView from "./views/AdminHomeView";

const adminRoutes = [
  {
    path: "/admin",
    element: (
      <ProtectedRoute allowedRoles={["ADMIN"]}>
        <AdminHomeView />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/products/new",
    element: (
      <ProtectedRoute allowedRoles={["ADMIN"]}>
        <AdminCreateProductView />
      </ProtectedRoute>
    ),
  },
];

export default adminRoutes;
