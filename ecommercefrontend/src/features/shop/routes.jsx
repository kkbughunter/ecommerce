import ProtectedRoute from "../../core/auth/ProtectedRoute";
import Shop from "./pages/Shop";

const shopRoutes = [
  {
    path: "/shop",
    element: (
      <ProtectedRoute allowedRoles={["USER"]}>
        <Shop />
      </ProtectedRoute>
    ),
  },
];

export default shopRoutes;
