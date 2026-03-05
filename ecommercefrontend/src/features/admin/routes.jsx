import AdminCategoriesView from "./views/AdminCategoriesView";
import ProtectedRoute from "../../core/auth/ProtectedRoute";
import AdminCreateProductView from "./views/AdminCreateProductView";
import AdminCustomersView from "./views/AdminCustomersView";
import AdminHomeView from "./views/AdminHomeView";
import AdminInvoicesView from "./views/AdminInvoicesView";
import AdminMainBannersView from "./views/AdminMainBannersView";
import AdminOrdersView from "./views/AdminOrdersView";
import AdminPaymentsView from "./views/AdminPaymentsView";
import AdminProductsView from "./views/AdminProductsView";
import AdminSlidersView from "./views/AdminSlidersView";

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
    path: "/admin/categories",
    element: (
      <ProtectedRoute allowedRoles={["ADMIN"]}>
        <AdminCategoriesView />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/sliders",
    element: (
      <ProtectedRoute allowedRoles={["ADMIN"]}>
        <AdminSlidersView />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/main-banners",
    element: (
      <ProtectedRoute allowedRoles={["ADMIN"]}>
        <AdminMainBannersView />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/customers",
    element: (
      <ProtectedRoute allowedRoles={["ADMIN"]}>
        <AdminCustomersView />
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
