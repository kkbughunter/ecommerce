import PublicOnlyRoute from "../../core/auth/PublicOnlyRoute";
import LoginView from "./views/LoginView";

const authRoutes = [
  {
    path: "/login",
    element: (
      <PublicOnlyRoute>
        <LoginView />
      </PublicOnlyRoute>
    ),
  },
];

export default authRoutes;
