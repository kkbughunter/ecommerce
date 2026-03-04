import ProtectedRoute from "../../core/auth/ProtectedRoute";
import ClientHomeView from "./views/ClientHomeView";
import ClientCartView from "./views/ClientCartView";
import ClientAccountView from "./views/ClientAccountView";

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
];

export default clientRoutes;
