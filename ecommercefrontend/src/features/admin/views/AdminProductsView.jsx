import { useNavigate } from "react-router-dom";
import AdminConsoleLayout from "../components/AdminConsoleLayout";
import ProductTable from "../components/ProductTable";
import useAdminDashboard from "../hooks/useAdminDashboard";

const AdminProductsView = () => {
  const navigate = useNavigate();
  const { filters, products, pageMeta, isLoadingProducts, error, updateSearch, goToPage, refreshProducts } =
    useAdminDashboard();

  return (
    <AdminConsoleLayout
      activeNav="products"
      title="Products"
      subtitle="Product catalog listing with key inventory and pricing information."
      searchValue={filters.q}
      onSearchChange={updateSearch}
      searchPlaceholder="Search products..."
      topActions={
        <div className="flex gap-2">
          <button
            type="button"
            onClick={refreshProducts}
            className="h-10 rounded-xl border border-[#d8dde6] bg-white px-3 text-xs font-semibold text-[#334155]"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/products/new")}
            className="h-10 rounded-xl bg-[#0f172a] px-3 text-xs font-semibold text-white"
          >
            + New Product
          </button>
        </div>
      }
    >
      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      ) : null}
      <ProductTable
        readOnly
        products={products}
        isLoading={isLoadingProducts}
        pageMeta={pageMeta}
        onPrev={() => goToPage(Math.max(pageMeta.page - 1, 0))}
        onNext={() => goToPage(pageMeta.page + 1)}
      />
    </AdminConsoleLayout>
  );
};

export default AdminProductsView;
