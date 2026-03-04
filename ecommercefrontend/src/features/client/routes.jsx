import ProtectedRoute from "../../core/auth/ProtectedRoute";
import ClientHomeView from "./views/ClientHomeView";
import ClientCartView from "./views/ClientCartView";
import ClientAccountView from "./views/ClientAccountView";
import ClientOrdersView from "./views/ClientOrdersView";

const clientRoutes = [
  {
    path: "/client",
    element: (
      <ProtectedRoute allowedRoles={["USER"]}>
        <ClientHomeView />
      </ProtectedRoute>
    ),
  },
  {
    path: "/client/cart",
    element: (
      <ProtectedRoute allowedRoles={["USER"]}>
        <ClientCartView />
      </ProtectedRoute>
    ),
  },
  {
    path: "/client/account",
    element: (
      <ProtectedRoute allowedRoles={["USER"]}>
        <ClientAccountView />
      </ProtectedRoute>
    ),
  },
  {
    path: "/client/orders",
    element: (
      <ProtectedRoute allowedRoles={["USER"]}>
        <ClientOrdersView />
      </ProtectedRoute>
    ),
  },
];

export default clientRoutes;
