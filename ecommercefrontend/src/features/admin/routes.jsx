import ProtectedRoute from "../../core/auth/ProtectedRoute";
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
];

export default adminRoutes;
