import { Navigate } from "react-router-dom";
import { createElement } from "react";
import AdminCategoriesView from "./views/AdminCategoriesView";
import ProtectedRoute from "../../core/auth/ProtectedRoute";
import AdminCreateProductView from "./views/AdminCreateProductView";
import AdminCustomersView from "./views/AdminCustomersView";
import AdminHomeView from "./views/AdminHomeView";
import AdminInvoicesView from "./views/AdminInvoicesView";
import AdminMainBannersView from "./views/AdminMainBannersView";
import AdminOrdersView from "./views/AdminOrdersView";
import AdminPaymentsView from "./views/AdminPaymentsView";
import AdminPaymentGatewaysView from "./views/AdminPaymentGatewaysView";
import AdminProductsView from "./views/AdminProductsView";
import AdminSlidersView from "./views/AdminSlidersView";
import AdminReportsView from "./views/AdminReportsView";

const superAdminPages = [
  ["", AdminHomeView],
  ["products", AdminProductsView],
  ["products/new", AdminCreateProductView],
  ["categories", AdminCategoriesView],
  ["sliders", AdminSlidersView],
  ["main-banners", AdminMainBannersView],
  ["customers", AdminCustomersView],
  ["payments", AdminPaymentsView],
  ["payment-gateways", AdminPaymentGatewaysView],
  ["invoices", AdminInvoicesView],
  ["reports", AdminReportsView],
];

const adminRoutes = [
  ...superAdminPages.map(([path, View]) => ({
    path: `/superadmin${path ? `/${path}` : ""}`,
    element: <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>{createElement(View)}</ProtectedRoute>,
  })),
  ...["/admin", "/admin/orders", "/superadmin/orders"].map((path) => ({
    path,
    element: <ProtectedRoute allowedRoles={["ADMIN", "SUPER_ADMIN"]}><AdminOrdersView /></ProtectedRoute>,
  })),
  ...superAdminPages.filter(([path]) => path).map(([path]) => ({
    path: `/admin/${path}`,
    element: <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}><Navigate to={`/superadmin/${path}`} replace /></ProtectedRoute>,
  })),
];

export default adminRoutes;
