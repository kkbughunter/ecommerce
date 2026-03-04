import ProtectedRoute from "../../core/auth/ProtectedRoute";
import ProductDetailView from "./views/ProductDetailView";

const productRoutes = [
  {
    path: "/products/:productId",
    element: (
      <ProtectedRoute allowedRoles={["ADMIN", "USER"]}>
        <ProductDetailView />
      </ProtectedRoute>
    ),
  },
];

export default productRoutes;
