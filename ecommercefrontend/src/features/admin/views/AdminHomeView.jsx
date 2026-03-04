import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import orderApi from "../../../core/api/orderApi";
import getApiErrorMessage from "../../../core/utils/apiError";
import AdminConsoleLayout from "../components/AdminConsoleLayout";
import AdminStatCard from "../components/AdminStatCard";
import useAdminDashboard from "../hooks/useAdminDashboard";

const formatMoney = (value, currency = "INR") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const formatDateTime = (value) => {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

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
    refreshProducts,
  } = useAdminDashboard();

  const [recentOrders, setRecentOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState("");

  const loadRecentOrders = async () => {
    setIsLoadingOrders(true);
    setOrdersError("");
    try {
      const response = await orderApi.getAdminOrders({ page: 0, size: 8 });
      const list = Array.isArray(response?.data?.data?.content) ? response.data.data.content : [];
      setRecentOrders(list);
    } catch (err) {
      setOrdersError(getApiErrorMessage(err, "Unable to load recent orders."));
      setRecentOrders([]);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  useEffect(() => {
    loadRecentOrders();
  }, []);

  const financeMetrics = useMemo(() => {
    const totalRevenue = recentOrders.reduce((sum, item) => sum + Number(item?.totalAmount || 0), 0);
    const paidRevenue = recentOrders
      .filter((item) => item?.paymentStatus === "PAID")
      .reduce((sum, item) => sum + Number(item?.totalAmount || 0), 0);
    const paidOrders = recentOrders.filter((item) => item?.paymentStatus === "PAID").length;
    const pendingPayments = recentOrders.filter((item) => item?.paymentStatus === "PENDING").length;
    const averageOrderValue = recentOrders.length ? totalRevenue / recentOrders.length : 0;
    const deliveredCount = recentOrders.filter((item) => item?.status === "DELIVERED").length;
    const fulfillmentRate = recentOrders.length ? (deliveredCount / recentOrders.length) * 100 : 0;

    return {
      totalRevenue,
      paidRevenue,
      paidOrders,
      pendingPayments,
      averageOrderValue,
      fulfillmentRate,
    };
  }, [recentOrders]);

  const paymentMix = useMemo(() => {
    const total = recentOrders.length || 1;
    const paid = Math.round((recentOrders.filter((item) => item?.paymentStatus === "PAID").length / total) * 100);
    const pending = Math.round(
      (recentOrders.filter((item) => item?.paymentStatus === "PENDING").length / total) * 100,
    );
    const failed = Math.max(0, 100 - paid - pending);
    return { paid, pending, failed };
  }, [recentOrders]);

  return (
    <AdminConsoleLayout
      activeNav="dashboard"
      title="Dashboard"
      subtitle="Orders, products, payments and invoices in one modern admin panel."
      searchValue={filters.q}
      onSearchChange={updateSearch}
      searchPlaceholder="Search products by name or category..."
      topActions={
        <div className="flex gap-2">
          <button
            type="button"
            onClick={loadRecentOrders}
            className="h-10 rounded-xl border border-[#d8dde6] bg-white px-3 text-xs font-semibold text-[#334155]"
          >
            Refresh Data
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/orders")}
            className="h-10 rounded-xl border border-[#d8dde6] bg-white px-3 text-xs font-semibold text-[#334155]"
          >
            Manage Orders
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
      <div className="space-y-4">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-[#e2e6ee] bg-white p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-[#64748b]">Ecommerce Revenue</p>
            <p className="mt-2 text-2xl font-semibold text-[#0f172a]">{formatMoney(financeMetrics.totalRevenue)}</p>
            <p className="mt-1 text-xs text-[#16a34a]">{formatMoney(financeMetrics.paidRevenue)} paid</p>
          </div>
          <div className="rounded-2xl border border-[#e2e6ee] bg-white p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-[#64748b]">Paid Orders</p>
            <p className="mt-2 text-2xl font-semibold text-[#0f172a]">{financeMetrics.paidOrders}</p>
            <p className="mt-1 text-xs text-[#64748b]">Pending payments: {financeMetrics.pendingPayments}</p>
          </div>
          <div className="rounded-2xl border border-[#e2e6ee] bg-white p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-[#64748b]">Average Order Value</p>
            <p className="mt-2 text-2xl font-semibold text-[#0f172a]">
              {formatMoney(financeMetrics.averageOrderValue)}
            </p>
            <p className="mt-1 text-xs text-[#64748b]">Based on latest {recentOrders.length} orders</p>
          </div>
          <div className="rounded-2xl border border-[#e2e6ee] bg-white p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-[#64748b]">Fulfillment Rate</p>
            <p className="mt-2 text-2xl font-semibold text-[#0f172a]">{financeMetrics.fulfillmentRate.toFixed(1)}%</p>
            <p className="mt-1 text-xs text-[#64748b]">Delivered vs recent orders</p>
          </div>
        </section>

        <section className="grid gap-3 xl:grid-cols-[2fr_1fr]">
          <article className="rounded-2xl border border-[#e2e6ee] bg-white p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#111827]">Products Overview</h2>
              <button
                type="button"
                onClick={refreshProducts}
                className="h-8 rounded-lg border border-[#d8dde6] px-3 text-xs font-semibold text-[#475569]"
              >
                Refresh Products
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <AdminStatCard label="Total Products" value={dashboardStats.totalProducts} tone="slate" />
              <AdminStatCard label="Active" value={dashboardStats.activeCount} tone="blue" />
              <AdminStatCard label="Inactive" value={dashboardStats.inactiveCount} tone="slate" />
              <AdminStatCard label="Low Stock" value={dashboardStats.lowStock} tone="amber" />
              <AdminStatCard label="Out Of Stock" value={dashboardStats.outOfStock} tone="rose" />
            </div>
            <div className="mt-5 overflow-hidden rounded-xl border border-[#eef1f5] bg-[#f8fafc] p-3">
              <svg viewBox="0 0 760 180" className="h-[180px] w-full">
                <defs>
                  <linearGradient id="lineA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0f172a" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="lineB" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M20 140 C90 40, 150 160, 230 95 C300 40, 370 155, 450 85 C520 25, 610 120, 730 55" fill="none" stroke="#0f172a" strokeWidth="2.8" />
                <path d="M20 125 C100 180, 180 25, 260 75 C335 128, 430 30, 505 110 C590 175, 665 68, 730 98" fill="none" stroke="#22c55e" strokeWidth="2.8" />
                <path d="M20 140 C90 40, 150 160, 230 95 C300 40, 370 155, 450 85 C520 25, 610 120, 730 55 L730 180 L20 180 Z" fill="url(#lineA)" />
                <path d="M20 125 C100 180, 180 25, 260 75 C335 128, 430 30, 505 110 C590 175, 665 68, 730 98 L730 180 L20 180 Z" fill="url(#lineB)" />
              </svg>
            </div>
          </article>

          <article className="rounded-2xl border border-[#e2e6ee] bg-white p-4">
            <h2 className="text-lg font-semibold text-[#111827]">Payment Mix</h2>
            <div className="mt-4 flex items-center justify-center">
              <div
                className="relative flex h-44 w-44 items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(#0f172a 0 ${paymentMix.paid}%, #22c55e ${paymentMix.paid}% ${
                    paymentMix.paid + paymentMix.pending
                  }%, #d1d5db ${paymentMix.paid + paymentMix.pending}% 100%)`,
                }}
              >
                <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-[#64748b]">Paid</p>
                  <p className="text-xl font-semibold text-[#0f172a]">{paymentMix.paid}%</p>
                </div>
              </div>
            </div>
            <div className="mt-5 space-y-2 text-sm text-[#475569]">
              <p>Paid: {paymentMix.paid}%</p>
              <p>Pending: {paymentMix.pending}%</p>
              <p>Failed/Other: {paymentMix.failed}%</p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/admin/payments")}
              className="mt-4 h-9 w-full rounded-lg border border-[#d8dde6] text-xs font-semibold text-[#334155]"
            >
              Open Payments
            </button>
          </article>
        </section>

        <section className="rounded-2xl border border-[#e2e6ee] bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#111827]">Recent Orders</h2>
            <button
              type="button"
              onClick={() => navigate("/admin/orders")}
              className="h-8 rounded-lg border border-[#d8dde6] px-3 text-xs font-semibold text-[#475569]"
            >
              View All
            </button>
          </div>
          {ordersError ? <p className="mb-2 text-sm text-red-600">{ordersError}</p> : null}
          {isLoadingOrders ? (
            <p className="text-sm text-[#64748b]">Loading recent orders...</p>
          ) : recentOrders.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="border-b border-[#edf0f3] text-left text-xs uppercase tracking-[0.08em] text-[#94a3b8]">
                    <th className="py-2 pr-3">Order</th>
                    <th className="py-2 pr-3">Purchased</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Payment</th>
                    <th className="py-2 pr-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.orderId} className="border-b border-[#f1f5f9] text-sm text-[#334155]">
                      <td className="py-2 pr-3 font-medium text-[#111827]">{order.orderNumber}</td>
                      <td className="py-2 pr-3">{formatDateTime(order.createdDt)}</td>
                      <td className="py-2 pr-3">{order.status || "-"}</td>
                      <td className="py-2 pr-3">{order.paymentStatus || "-"}</td>
                      <td className="py-2 pr-3 text-right">{formatMoney(order.totalAmount, order.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-[#64748b]">No orders available.</p>
          )}
        </section>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        ) : null}
        {success ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {success}
          </div>
        ) : null}

      </div>
    </AdminConsoleLayout>
  );
};

export default AdminHomeView;
