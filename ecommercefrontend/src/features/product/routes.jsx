import ProtectedRoute from "../../core/auth/ProtectedRoute";
import ProductDetailView from "./views/ProductDetailView";

const productRoutes = [
  {
    path: "/products/:productId",
    element: (
      <ProtectedRoute allowedRoles={["SELLER", "USER"]}>
        <ProductDetailView />
      </ProtectedRoute>
    ),
  },
];

export default productRoutes;
