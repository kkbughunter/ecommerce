import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import adminDashboardApi from "../../../core/api/adminDashboardApi";
import getApiErrorMessage from "../../../core/utils/apiError";
import AdminConsoleLayout from "../components/AdminConsoleLayout";
import AdminStatCard from "../components/AdminStatCard";

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

const toSmoothLinePath = (points) => {
  if (!points.length) {
    return "";
  }
  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`;
  }
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const curr = points[i];
    const controlX = (prev.x + curr.x) / 2;
    path += ` Q ${controlX} ${prev.y}, ${curr.x} ${curr.y}`;
  }
  return path;
};

const toSmoothAreaPath = (points, baseline = 180) => {
  if (!points.length) {
    return "";
  }
  return `${toSmoothLinePath(points)} L ${points[points.length - 1].x} ${baseline} L ${points[0].x} ${baseline} Z`;
};

const mapTrendToPoints = (trend = [], minX = 20, maxX = 730, topY = 28, bottomY = 156) => {
  if (!Array.isArray(trend) || !trend.length) {
    return [];
  }
  const maxValue = Math.max(...trend.map((item) => Number(item?.value || 0)), 1);
  const step = trend.length > 1 ? (maxX - minX) / (trend.length - 1) : 0;
  return trend.map((item, index) => {
    const rawValue = Number(item?.value || 0);
    const normalized = maxValue > 0 ? rawValue / maxValue : 0;
    return {
      day: item?.dayLabel || "",
      date: item?.date || "",
      value: rawValue,
      x: minX + step * index,
      y: bottomY - normalized * (bottomY - topY),
    };
  });
};

const AdminHomeView = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);
  const [dashboardError, setDashboardError] = useState("");
  const [hoveredGraphPoint, setHoveredGraphPoint] = useState(null);

  const loadDashboard = async () => {
    setIsLoadingDashboard(true);
    setDashboardError("");
    try {
      const response = await adminDashboardApi.getDashboard();
      setDashboardData(response?.data?.data || null);
    } catch (err) {
      setDashboardError(getApiErrorMessage(err, "Unable to load admin dashboard."));
      setDashboardData(null);
    } finally {
      setIsLoadingDashboard(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const productSummary = dashboardData?.productSummary || {};
  const orderSummary = dashboardData?.orderSummary || {};
  const revenueSummary = dashboardData?.revenueSummary || {};
  const recentOrders = useMemo(
    () => (Array.isArray(dashboardData?.recentOrders) ? dashboardData.recentOrders : []),
    [dashboardData?.recentOrders],
  );

  const financeMetrics = useMemo(
    () => ({
      totalRevenue: Number(revenueSummary?.totalRevenue || 0),
      paidRevenue: Number(revenueSummary?.paidRevenue || 0),
      paidOrders: Number(orderSummary?.paidOrders || 0),
      pendingPayments: Number(orderSummary?.pendingPayments || 0),
      averageOrderValue: Number(revenueSummary?.averageOrderValue || 0),
      fulfillmentRate: Number(revenueSummary?.fulfillmentRatePercentage || 0),
    }),
    [orderSummary?.paidOrders, orderSummary?.pendingPayments, revenueSummary?.averageOrderValue, revenueSummary?.fulfillmentRatePercentage, revenueSummary?.paidRevenue, revenueSummary?.totalRevenue],
  );

  const paymentMix = useMemo(() => {
    const total = Number(orderSummary?.totalOrders || 0) || 1;
    const paid = Math.round((Number(orderSummary?.paidOrders || 0) / total) * 100);
    const pending = Math.round((Number(orderSummary?.pendingPayments || 0) / total) * 100);
    const failed = Math.max(0, 100 - paid - pending);
    return { paid, pending, failed };
  }, [orderSummary?.paidOrders, orderSummary?.pendingPayments, orderSummary?.totalOrders]);

  const darkSeriesPoints = useMemo(
    () => mapTrendToPoints(dashboardData?.orderTrend),
    [dashboardData?.orderTrend],
  );
  const greenSeriesPoints = useMemo(
    () => mapTrendToPoints(dashboardData?.revenueTrend),
    [dashboardData?.revenueTrend],
  );

  return (
    <AdminConsoleLayout
      activeNav="dashboard"
      title="Dashboard"
      subtitle="Orders, products, payments and invoices in one modern admin panel."
      topActions={
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={loadDashboard}
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
        {dashboardError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{dashboardError}</div>
        ) : null}

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-[#e2e6ee] bg-white p-3 sm:p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-[#64748b]">Ecommerce Revenue</p>
            <p className="mt-2 text-2xl font-semibold text-[#0f172a]">{formatMoney(financeMetrics.totalRevenue)}</p>
            <p className="mt-1 text-xs text-[#16a34a]">{formatMoney(financeMetrics.paidRevenue)} paid</p>
          </div>
          <div className="rounded-2xl border border-[#e2e6ee] bg-white p-3 sm:p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-[#64748b]">Paid Orders</p>
            <p className="mt-2 text-2xl font-semibold text-[#0f172a]">{financeMetrics.paidOrders}</p>
            <p className="mt-1 text-xs text-[#64748b]">Pending payments: {financeMetrics.pendingPayments}</p>
          </div>
          <div className="rounded-2xl border border-[#e2e6ee] bg-white p-3 sm:p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-[#64748b]">Average Order Value</p>
            <p className="mt-2 text-2xl font-semibold text-[#0f172a]">
              {formatMoney(financeMetrics.averageOrderValue)}
            </p>
            <p className="mt-1 text-xs text-[#64748b]">Based on current dashboard summary</p>
          </div>
          <div className="rounded-2xl border border-[#e2e6ee] bg-white p-3 sm:p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-[#64748b]">Fulfillment Rate</p>
            <p className="mt-2 text-2xl font-semibold text-[#0f172a]">{financeMetrics.fulfillmentRate.toFixed(1)}%</p>
            <p className="mt-1 text-xs text-[#64748b]">Delivered vs all orders</p>
          </div>
        </section>

        <section className="grid gap-3 xl:grid-cols-[2fr_1fr]">
          <article className="rounded-2xl border border-[#e2e6ee] bg-white p-3 sm:p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-[#111827]">Products Overview</h2>
              {isLoadingDashboard ? <span className="text-xs text-[#94a3b8]">Updating...</span> : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <AdminStatCard label="Total Products" value={Number(productSummary?.totalProducts || 0)} tone="slate" />
              <AdminStatCard label="Active" value={Number(productSummary?.activeProducts || 0)} tone="blue" />
              <AdminStatCard label="Inactive" value={Number(productSummary?.inactiveProducts || 0)} tone="slate" />
              <AdminStatCard label="Low Stock" value={Number(productSummary?.lowStockProducts || 0)} tone="amber" />
              <AdminStatCard label="Out Of Stock" value={Number(productSummary?.outOfStockProducts || 0)} tone="rose" />
            </div>
            <div className="mt-5 overflow-hidden rounded-xl border border-[#eef1f5] bg-[#f8fafc] p-3">
              <div className="relative">
                {hoveredGraphPoint ? (
                  <div className="pointer-events-none absolute right-2 top-2 z-10 rounded-md border border-[#d8dde6] bg-white px-2 py-1 text-[11px] text-[#334155] shadow">
                    <p className="font-semibold">{hoveredGraphPoint.series}</p>
                    <p>
                      {hoveredGraphPoint.day}:{" "}
                      {hoveredGraphPoint.series === "Revenue Trend"
                        ? formatMoney(hoveredGraphPoint.value)
                        : hoveredGraphPoint.value.toFixed(0)}
                    </p>
                  </div>
                ) : null}
                <svg
                  viewBox="0 0 760 180"
                  className="h-[180px] w-full"
                  onMouseLeave={() => setHoveredGraphPoint(null)}
                >
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
                  <path d={toSmoothAreaPath(darkSeriesPoints)} fill="url(#lineA)" />
                  <path d={toSmoothAreaPath(greenSeriesPoints)} fill="url(#lineB)" />
                  <path d={toSmoothLinePath(darkSeriesPoints)} fill="none" stroke="#0f172a" strokeWidth="2.8" />
                  <path d={toSmoothLinePath(greenSeriesPoints)} fill="none" stroke="#22c55e" strokeWidth="2.8" />
                  {darkSeriesPoints.map((point, index) => (
                    <circle
                      key={`dark-${index}`}
                      cx={point.x}
                      cy={point.y}
                      r="4"
                      fill="#0f172a"
                      className="cursor-pointer"
                      onMouseEnter={() =>
                        setHoveredGraphPoint({
                          series: "Orders Trend",
                          day: point.day,
                          value: point.value,
                        })
                      }
                    />
                  ))}
                  {greenSeriesPoints.map((point, index) => (
                    <circle
                      key={`green-${index}`}
                      cx={point.x}
                      cy={point.y}
                      r="4"
                      fill="#22c55e"
                      className="cursor-pointer"
                      onMouseEnter={() =>
                        setHoveredGraphPoint({
                          series: "Revenue Trend",
                          day: point.day,
                          value: point.value,
                        })
                      }
                    />
                  ))}
                </svg>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-[#e2e6ee] bg-white p-3 sm:p-4">
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

        <section className="rounded-2xl border border-[#e2e6ee] bg-white p-3 sm:p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-[#111827]">Recent Orders</h2>
            <button
              type="button"
              onClick={() => navigate("/admin/orders")}
              className="h-8 rounded-lg border border-[#d8dde6] px-3 text-xs font-semibold text-[#475569]"
            >
              View All
            </button>
          </div>
          {isLoadingDashboard ? (
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
      </div>
    </AdminConsoleLayout>
  );
};

export default AdminHomeView;

