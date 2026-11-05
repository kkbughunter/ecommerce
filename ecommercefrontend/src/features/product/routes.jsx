import ProductDetailView from "./views/ProductDetailView";

const productRoutes = [
  {
    path: "/products/:productId",
    // Product GET endpoints are public; editing and cart actions remain role-gated.
    element: <ProductDetailView />,
  },
];

export default productRoutes;
