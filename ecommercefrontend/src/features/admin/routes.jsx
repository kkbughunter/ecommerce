import AdminCategoriesView from "./views/AdminCategoriesView";
import ProtectedRoute from "../../core/auth/ProtectedRoute";
import AdminCreateProductView from "./views/AdminCreateProductView";
import AdminCustomersView from "./views/AdminCustomersView";
import AdminSellersView from "./views/AdminSellersView";
import AdminHomeView from "./views/AdminHomeView";
import AdminInvoicesView from "./views/AdminInvoicesView";
import AdminMainBannersView from "./views/AdminMainBannersView";
import AdminOrdersView from "./views/AdminOrdersView";
import AdminPaymentsView from "./views/AdminPaymentsView";
import AdminProductsView from "./views/AdminProductsView";
import AdminSlidersView from "./views/AdminSlidersView";

const adminRoutes = [
  {
    path: "/seller/dashboard",
    element: (
      <ProtectedRoute allowedRoles={["SELLER"]}>
        <AdminHomeView />
      </ProtectedRoute>
    ),
  },
  {
    path: "/seller/dashboard/products",
    element: (
      <ProtectedRoute allowedRoles={["SELLER"]}>
        <AdminProductsView />
      </ProtectedRoute>
    ),
  },
  {
    path: "/seller/dashboard/products/new",
    element: (
      <ProtectedRoute allowedRoles={["SELLER"]}>
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
    path: "/admin/categories",
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
    path: "/superadmin/sellers",
    element: (
      <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
        <AdminSellersView />
      </ProtectedRoute>
    ),
  },
  {
    path: "/seller/dashboard/orders",
    element: (
      <ProtectedRoute allowedRoles={["SELLER"]}>
        <AdminOrdersView />
      </ProtectedRoute>
    ),
  },
  {
    path: "/seller/dashboard/payments",
    element: (
      <ProtectedRoute allowedRoles={["SELLER"]}>
        <AdminPaymentsView />
      </ProtectedRoute>
    ),
  },
  {
    path: "/seller/dashboard/invoices",
    element: (
      <ProtectedRoute allowedRoles={["SELLER"]}>
        <AdminInvoicesView />
      </ProtectedRoute>
    ),
  },
];

export default adminRoutes;
