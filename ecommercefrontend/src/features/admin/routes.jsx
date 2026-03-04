import ProtectedRoute from "../../core/auth/ProtectedRoute";
import AdminCreateProductView from "./views/AdminCreateProductView";
import AdminHomeView from "./views/AdminHomeView";
import AdminOrdersView from "./views/AdminOrdersView";

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
  {
    path: "/admin/orders",
    element: (
      <ProtectedRoute allowedRoles={["ADMIN"]}>
        <AdminOrdersView />
      </ProtectedRoute>
    ),
  },
];

export default adminRoutes;
