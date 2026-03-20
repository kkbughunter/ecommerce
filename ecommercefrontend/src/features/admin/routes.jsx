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
    path: "/superadmin/categories",
    element: (
      <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
        <AdminCategoriesView />
      </ProtectedRoute>
    ),
  },
  {
    path: "/superadmin/sliders",
    element: (
      <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
        <AdminSlidersView />
      </ProtectedRoute>
    ),
  },
  {
    path: "/superadmin/main-banners",
    element: (
      <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
        <AdminMainBannersView />
      </ProtectedRoute>
    ),
  },
  {
    path: "/superadmin/customers",
    element: (
      <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
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
