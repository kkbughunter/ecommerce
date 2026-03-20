import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import orderApi from "../../../core/api/orderApi";
import paymentApi from "../../../core/api/paymentApi";
import getApiErrorMessage from "../../../core/utils/apiError";
import AdminConsoleLayout from "../components/AdminConsoleLayout";
import AdminRightPanel from "../components/AdminRightPanel";

const PAYMENT_STATUSES = ["ALL", "PENDING", "PAID", "FAILED", "REFUNDED"];
const ORDER_STATUSES = [
  "ALL",
  "PLACED",
  "CONFIRMED",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "RETURN_REQUESTED",
  "RETURNED",
];

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
    hour: "2-digit",
    minute: "2-digit",
  });
};

const normalizeAttemptStatus = (status) => {
  if (!status) {
    return "-";
  }
  if (status === "SUCCESS") {
    return "PAID";
  }
  return status;
};

const TopBarIcon = ({ path }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
    <path d={path} />
  </svg>
);

const getOrderStatusBadgeClass = (status) => {
  switch (status) {
    case "DELIVERED":
      return "bg-emerald-100 text-emerald-700";
    case "CANCELLED":
    case "RETURNED":
      return "bg-rose-100 text-rose-700";
    case "SHIPPED":
    case "OUT_FOR_DELIVERY":
      return "bg-sky-100 text-sky-700";
    case "PACKED":
    case "CONFIRMED":
      return "bg-indigo-100 text-indigo-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

const getPaymentStatusBadgeClass = (status) => {
  switch (status) {
    case "PAID":
    case "SUCCESS":
      return "bg-emerald-100 text-emerald-700";
    case "FAILED":
      return "bg-rose-100 text-rose-700";
    case "REFUNDED":
      return "bg-violet-100 text-violet-700";
    default:
      return "bg-amber-100 text-amber-700";
  }
};

const AdminPaymentsView = () => {
  const navigate = useNavigate();
  const [ordersPage, setOrdersPage] = useState({
    content: [],
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0,
    first: true,
    last: true,
  });
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    paymentStatus: "ALL",
    orderStatus: "ALL",
  });
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [error, setError] = useState("");

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (ordersPage.content || []).filter((item) => {
      const paymentStatusPass =
        filters.paymentStatus === "ALL" || item?.paymentStatus === filters.paymentStatus;
      const orderStatusPass = filters.orderStatus === "ALL" || item?.status === filters.orderStatus;
      const text = [item?.orderNumber, item?.customerFirstName, item?.customerLastName, item?.orderId]
        .map((value) => String(value || "").toLowerCase())
        .join(" ");
      const searchPass = !query || text.includes(query);
      return paymentStatusPass && orderStatusPass && searchPass;
    });
  }, [filters.orderStatus, filters.paymentStatus, ordersPage.content, search]);

  const latestAttempt = useMemo(() => {
    const attempts = paymentDetails?.attempts || [];
    return attempts[0] || null;
  }, [paymentDetails?.attempts]);

  const loadAdminOrders = async (page = ordersPage.page, size = ordersPage.size) => {
    setIsLoadingOrders(true);
    setError("");
    try {
      const response = await orderApi.getAdminOrders({ page, size });
      const payload = response?.data?.data || {};
      const content = Array.isArray(payload.content) ? payload.content : [];
      setOrdersPage({
        content,
        page: Number(payload.page || 0),
        size: Number(payload.size || 20),
        totalElements: Number(payload.totalElements || 0),
        totalPages: Number(payload.totalPages || 0),
        first: Boolean(payload.first),
        last: Boolean(payload.last),
      });
      if (selectedOrderId && !content.some((item) => item.orderId === selectedOrderId)) {
        setSelectedOrderId(null);
        setSelectedOrder(null);
        setPaymentDetails(null);
        setIsDrawerOpen(false);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to load orders for payments."));
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const loadPaymentDetails = async (orderId) => {
    if (!orderId) {
      setSelectedOrder(null);
      setPaymentDetails(null);
      return;
    }
    setIsLoadingDetails(true);
    setError("");
    try {
      const [orderResponse, paymentResponse] = await Promise.all([
        orderApi.getOrderDetails(orderId),
        paymentApi.getOrderPaymentDetails(orderId),
      ]);
      setSelectedOrder(orderResponse?.data?.data || null);
      setPaymentDetails(paymentResponse?.data?.data || null);
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to load payment details."));
    } finally {
      setIsLoadingDetails(false);
    }
  };

  useEffect(() => {
    loadAdminOrders(0, 20);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadPaymentDetails(selectedOrderId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOrderId]);

  const openDetails = (orderId) => {
    setSelectedOrderId(orderId);
    setIsDrawerOpen(true);
  };

  return (
    <AdminConsoleLayout
      activeNav="payments"
      title="Payments"
      subtitle="Filter payment records in a table and inspect each order payment timeline from the right panel."
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search order number or customer..."
      topActions={
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate("/admin/orders")}
            title="Go To Orders"
            aria-label="Go To Orders"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#d8dde6] bg-white text-[#334155]"
          >
            <TopBarIcon path="M4 4h16v3H4V4zm0 5h16v11H4V9zm3 3v2h10v-2H7z" />
          </button>
          <button
            type="button"
            onClick={() => loadAdminOrders(ordersPage.page, ordersPage.size)}
            title="Refresh"
            aria-label="Refresh"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#d8dde6] bg-white text-[#334155]"
          >
            <TopBarIcon path="M17.65 6.35A7.95 7.95 0 0 0 12 4V1L7 6l5 5V7a5 5 0 1 1-4.9 6h-2.02A7 7 0 1 0 17.65 6.35z" />
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <section className="rounded-2xl border border-[#e2e6ee] bg-white p-3">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filters.paymentStatus}
              onChange={(event) => setFilters((prev) => ({ ...prev, paymentStatus: event.target.value }))}
              className="h-9 w-full rounded-lg border border-[#d8dde6] bg-white px-3 text-xs font-semibold text-[#334155] sm:w-auto"
            >
              {PAYMENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status === "ALL" ? "All Payment Statuses" : status}
                </option>
              ))}
            </select>
            <select
              value={filters.orderStatus}
              onChange={(event) => setFilters((prev) => ({ ...prev, orderStatus: event.target.value }))}
              className="h-9 w-full rounded-lg border border-[#d8dde6] bg-white px-3 text-xs font-semibold text-[#334155] sm:w-auto"
            >
              {ORDER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status === "ALL" ? "All Order Statuses" : status}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setFilters({ paymentStatus: "ALL", orderStatus: "ALL" })}
              className="h-9 rounded-lg border border-[#d8dde6] bg-[#f8fafc] px-3 text-xs font-semibold text-[#334155]"
            >
              Clear Filters
            </button>
          </div>
        </section>

        <article className="rounded-2xl border border-[#e2e6ee] bg-white">
          <div className="flex items-center justify-between border-b border-[#edf0f3] px-4 py-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-[#475569]">Payment Records</h2>
            <p className="text-xs text-[#94a3b8]">
              Showing {filteredOrders.length} of {ordersPage.totalElements}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b border-[#edf0f3] text-left text-xs uppercase tracking-[0.08em] text-[#94a3b8]">
                  <th className="px-4 py-2">Order ID</th>
                  <th className="px-4 py-2">Customer</th>
                  <th className="px-4 py-2">Total</th>
                  <th className="px-4 py-2">Order Status</th>
                  <th className="px-4 py-2">Payment Status</th>
                  <th className="px-4 py-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingOrders ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-[#64748b]">
                      Loading payment records...
                    </td>
                  </tr>
                ) : filteredOrders.length ? (
                  filteredOrders.map((order) => (
                    <tr
                      key={order.orderId}
                      onClick={() => openDetails(order.orderId)}
                      className="cursor-pointer border-b border-[#f1f5f9] text-sm text-[#334155] hover:bg-[#f8fafc]"
                    >
                      <td className="px-4 py-3 font-semibold text-[#111827]">{order.orderNumber}</td>
                      <td className="px-4 py-3">
                        {[order?.customerFirstName, order?.customerLastName].filter(Boolean).join(" ") || "-"}
                      </td>
                      <td className="px-4 py-3">{formatMoney(order.totalAmount, order.currency)}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getOrderStatusBadgeClass(order.status)}`}>
                          {order.status || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getPaymentStatusBadgeClass(order.paymentStatus)}`}>
                          {order.paymentStatus || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3">{formatDateTime(order.createdDt)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-[#64748b]">
                      No payment records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[#edf0f3] px-4 py-3">
            <button
              type="button"
              disabled={ordersPage.first}
              onClick={() => loadAdminOrders(Math.max(ordersPage.page - 1, 0), ordersPage.size)}
              className="h-8 rounded-lg border border-[#d8dde6] px-2 text-xs font-semibold text-[#334155] disabled:opacity-50"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={ordersPage.last}
              onClick={() => loadAdminOrders(ordersPage.page + 1, ordersPage.size)}
              className="h-8 rounded-lg border border-[#d8dde6] px-2 text-xs font-semibold text-[#334155] disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </article>
      </div>

      <AdminRightPanel
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={selectedOrder?.orderNumber || "Payment Details"}
        subtitle="Full timeline of payment attempts and events"
      >
        {!selectedOrderId ? (
          <p className="text-sm text-[#64748b]">Select a payment row from the table.</p>
        ) : isLoadingDetails ? (
          <p className="text-sm text-[#64748b]">Loading payment details...</p>
        ) : (
          <div className="space-y-4">
            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <article className="rounded-xl border border-[#e8ecf2] bg-[#f8fafc] p-3">
                <p className="text-xs uppercase tracking-[0.08em] text-[#64748b]">Order Amount</p>
                <p className="mt-1 text-base font-semibold text-emerald-700">
                  {formatMoney(selectedOrder?.totalAmount, selectedOrder?.currency || "INR")}
                </p>
              </article>
              <article className="rounded-xl border border-[#e8ecf2] bg-[#f8fafc] p-3">
                <p className="text-xs uppercase tracking-[0.08em] text-[#64748b]">Current Payment Status</p>
                <p className="mt-1">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getPaymentStatusBadgeClass(selectedOrder?.paymentStatus)}`}>
                    {selectedOrder?.paymentStatus || "-"}
                  </span>
                </p>
              </article>
              <article className="rounded-xl border border-[#e8ecf2] bg-[#f8fafc] p-3">
                <p className="text-xs uppercase tracking-[0.08em] text-[#64748b]">Attempts</p>
                <p className="mt-1 text-base font-semibold text-[#111827]">{(paymentDetails?.attempts || []).length}</p>
              </article>
              <article className="rounded-xl border border-[#e8ecf2] bg-[#f8fafc] p-3">
                <p className="text-xs uppercase tracking-[0.08em] text-[#64748b]">Latest Attempt</p>
                <p className="mt-1">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getPaymentStatusBadgeClass(normalizeAttemptStatus(latestAttempt?.status))}`}>
                    {normalizeAttemptStatus(latestAttempt?.status)}
                  </span>
                </p>
              </article>
            </section>

            <section>
              <h4 className="mb-2 text-sm font-semibold uppercase tracking-[0.08em] text-[#64748b]">
                Attempts Timeline
              </h4>
              {(paymentDetails?.attempts || []).length ? (
                <div className="space-y-3">
                  {(paymentDetails?.attempts || []).map((attempt) => (
                    <article
                      key={attempt.paymentTransactionId}
                      className="rounded-xl border border-[#edf0f3] bg-[#fbfcfd] p-3"
                    >
                      <p className="text-sm font-semibold text-[#111827]">
                        Attempt #{attempt.attemptNumber} |{" "}
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getPaymentStatusBadgeClass(normalizeAttemptStatus(attempt.status))}`}>
                          {normalizeAttemptStatus(attempt.status)}
                        </span>
                      </p>
                      <p className="mt-1 text-xs text-[#64748b]">
                        Amount: {formatMoney(attempt.amount, attempt.currency)} | Gateway: {attempt.gateway}
                      </p>
                      <p className="text-xs text-[#64748b]">Created: {formatDateTime(attempt.createdDt)}</p>
                      {attempt?.events?.length ? (
                        <div className="mt-2 space-y-1 rounded-lg border border-[#eef1f5] bg-white p-2">
                          {attempt.events.map((event) => (
                            <p key={event.paymentStatusTrackingId} className="text-[11px] text-[#475569]">
                              {formatDateTime(event.eventTime)} | {event.eventType} | {event.previousStatus || "-"} to{" "}
                              {event.newStatus || "-"}
                            </p>
                          ))}
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#64748b]">No payment attempts found for this order.</p>
              )}
            </section>
          </div>
        )}
      </AdminRightPanel>
    </AdminConsoleLayout>
  );
};

export default AdminPaymentsView;
