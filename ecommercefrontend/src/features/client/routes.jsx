import ProtectedRoute from "../../core/auth/ProtectedRoute";
import ClientHomeView from "./views/ClientHomeView";

const clientRoutes = [
  {
    path: "/client",
    element: (
      <ProtectedRoute allowedRoles={["USER"]}>
        <ClientHomeView />
      </ProtectedRoute>
    ),
  },
];

export default clientRoutes;
