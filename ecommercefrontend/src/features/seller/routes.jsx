import { Navigate } from "react-router-dom";
import ProtectedRoute from "../../core/auth/ProtectedRoute";
import SellerDashboardView from "./views/SellerDashboardView";
import SellerProfileView from "./views/SellerProfileView";

const sellerRoutes = [
    {
        path: "/seller",
        element: (
            <ProtectedRoute allowedRoles={["SELLER"]}>
                <Navigate to="/seller/dashboard" replace />
            </ProtectedRoute>
        ),
    },
    {
        path: "/seller/dashboard",
        element: (
            <ProtectedRoute allowedRoles={["SELLER"]}>
                <SellerDashboardView />
            </ProtectedRoute>
        ),
    },
    {
        path: "/seller/profile",
        element: (
            <ProtectedRoute allowedRoles={["SELLER"]}>
                <SellerProfileView />
            </ProtectedRoute>
        ),
    },
];

export default sellerRoutes;
