import { useNavigate } from "react-router-dom";
import { clearAuthSession } from "../../../core/auth/session";
import FullLayout from "../../../layouts/FullLayout";
import AdminStatCard from "../components/AdminStatCard";
import ProductTable from "../components/ProductTable";
import useAdminDashboard from "../hooks/useAdminDashboard";

const AdminHomeView = () => {
  const navigate = useNavigate();
  const {
    filters,
    products,
    pageMeta,
    dashboardStats,
    isLoadingProducts,
    updatingMaxPriceProductId,
    updatingTagProductId,
    error,
    success,
    updateSearch,
    goToPage,
    refreshProducts,
    updateProductMaxPrice,
    updateProductTag,
  } = useAdminDashboard();

  const handleLogout = () => {
    clearAuthSession();
    navigate("/login", { replace: true });
  };

  return (
    <FullLayout
      title="Admin Dashboard"
      subtitle="Manage products and inventory from one place."
      onLogout={handleLogout}
    >
      <div className="space-y-5">
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <AdminStatCard label="Total Products" value={dashboardStats.totalProducts} tone="violet" />
          <AdminStatCard label="Active" value={dashboardStats.activeCount} tone="blue" />
          <AdminStatCard label="Inactive" value={dashboardStats.inactiveCount} tone="slate" />
          <AdminStatCard label="Low Stock" value={dashboardStats.lowStock} tone="amber" />
          <AdminStatCard label="Out Of Stock" value={dashboardStats.outOfStock} tone="rose" />
        </section>

        <section className="flex flex-wrap items-end justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-900">Product Search</p>
            <p className="text-xs text-slate-500">
              Search by product or category name.
            </p>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={filters.q}
              onChange={(event) => updateSearch(event.target.value)}
              placeholder="Search products..."
              className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            />
            <button
              type="button"
              onClick={refreshProducts}
              className="h-10 rounded-lg border border-violet-200 bg-white px-3 text-sm font-semibold text-violet-700 hover:bg-violet-50"
            >
              Refresh
            </button>
          </div>
        </section>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {success}
          </div>
        )}

        <ProductTable
          products={products}
          isLoading={isLoadingProducts}
          pageMeta={pageMeta}
          onPrev={() => goToPage(Math.max(pageMeta.page - 1, 0))}
          onNext={() => goToPage(pageMeta.page + 1)}
          onNewProduct={() => navigate("/admin/products/new")}
          updatingMaxPriceProductId={updatingMaxPriceProductId}
          updatingTagProductId={updatingTagProductId}
          onUpdateMaxPrice={updateProductMaxPrice}
          onUpdateTag={updateProductTag}
        />
      </div>
    </FullLayout>
  );
};

export default AdminHomeView;
