import ProtectedRoute from "../../core/auth/ProtectedRoute";
import AdminCreateProductView from "./views/AdminCreateProductView";
import AdminHomeView from "./views/AdminHomeView";
import AdminInvoicesView from "./views/AdminInvoicesView";
import AdminOrdersView from "./views/AdminOrdersView";
import AdminPaymentsView from "./views/AdminPaymentsView";
import AdminProductsView from "./views/AdminProductsView";

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
    path: "/admin/products",
    element: (
      <ProtectedRoute allowedRoles={["ADMIN"]}>
        <AdminProductsView />
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
  {
    path: "/admin/payments",
    element: (
      <ProtectedRoute allowedRoles={["ADMIN"]}>
        <AdminPaymentsView />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/invoices",
    element: (
      <ProtectedRoute allowedRoles={["ADMIN"]}>
        <AdminInvoicesView />
      </ProtectedRoute>
    ),
  },
];

export default adminRoutes;
