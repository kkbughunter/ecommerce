import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import orderApi from "../../../core/api/orderApi";
import paymentApi from "../../../core/api/paymentApi";
import getApiErrorMessage from "../../../core/utils/apiError";
import AdminConsoleLayout from "../components/AdminConsoleLayout";

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
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [error, setError] = useState("");

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return ordersPage.content || [];
    }
    return (ordersPage.content || []).filter((item) =>
      String(item?.orderNumber || "").toLowerCase().includes(query),
    );
  }, [ordersPage.content, search]);

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
      if (!selectedOrderId && content.length) {
        setSelectedOrderId(content[0].orderId);
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

  return (
    <AdminConsoleLayout
      activeNav="payments"
      title="Payments"
      subtitle="Monitor payment attempts and Razorpay transaction timelines."
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search order number..."
      topActions={
        <div className="flex gap-2">
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
        <div className="grid gap-4 xl:grid-cols-[1fr_2fr]">
          <article className="rounded-2xl border border-[#e2e6ee] bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#111827]">Orders</h2>
              <p className="text-xs text-[#94a3b8]">{ordersPage.totalElements} total</p>
            </div>
            {isLoadingOrders ? (
              <p className="text-sm text-[#64748b]">Loading...</p>
            ) : filteredOrders.length ? (
              <div className="space-y-2">
                {filteredOrders.map((order) => (
                  <button
                    key={order.orderId}
                    type="button"
                    onClick={() => setSelectedOrderId(order.orderId)}
                    className={`w-full rounded-xl border p-3 text-left ${
                      selectedOrderId === order.orderId
                        ? "border-[#111827] bg-[#f8fafc]"
                        : "border-[#e5e7eb] bg-[#fbfcfd]"
                    }`}
                  >
                    <p className="text-sm font-semibold text-[#111827]">{order.orderNumber}</p>
                    <p className="text-xs text-[#64748b]">{formatDateTime(order.createdDt)}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getOrderStatusBadgeClass(order.status)}`}>
                        {order.status}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getPaymentStatusBadgeClass(order.paymentStatus)}`}>
                        {order.paymentStatus}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#64748b]">No orders found.</p>
            )}
          </article>

          <article className="rounded-2xl border border-[#e2e6ee] bg-white p-4">
            {!selectedOrderId ? (
              <p className="text-sm text-[#64748b]">Select an order to inspect payment details.</p>
            ) : isLoadingDetails ? (
              <p className="text-sm text-[#64748b]">Loading payment details...</p>
            ) : (
              <div className="space-y-4">
                <section className="grid gap-3 md:grid-cols-4">
                  <div className="rounded-xl border border-[#e8ecf2] bg-[#f8fafc] p-3">
                    <p className="text-xs uppercase tracking-[0.08em] text-[#64748b]">Order</p>
                    <p className="mt-1 text-sm font-semibold text-[#111827]">{selectedOrder?.orderNumber || "-"}</p>
                  </div>
                  <div className="rounded-xl border border-[#e8ecf2] bg-[#f8fafc] p-3">
                    <p className="text-xs uppercase tracking-[0.08em] text-[#64748b]">Payment Status</p>
                    <p className="mt-1">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getPaymentStatusBadgeClass(selectedOrder?.paymentStatus)}`}>
                        {selectedOrder?.paymentStatus || "-"}
                      </span>
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#e8ecf2] bg-[#f8fafc] p-3">
                    <p className="text-xs uppercase tracking-[0.08em] text-[#64748b]">Attempts</p>
                    <p className="mt-1 text-sm font-semibold text-[#111827]">
                      {(paymentDetails?.attempts || []).length}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#e8ecf2] bg-[#f8fafc] p-3">
                    <p className="text-xs uppercase tracking-[0.08em] text-[#64748b]">Latest Attempt</p>
                    <p className="mt-1">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getPaymentStatusBadgeClass(latestAttempt ? normalizeAttemptStatus(latestAttempt.status) : "-")}`}>
                        {latestAttempt ? normalizeAttemptStatus(latestAttempt.status) : "-"}
                      </span>
                    </p>
                  </div>
                </section>

                <section className="rounded-xl border border-[#edf0f3] bg-white p-3">
                  <p className="text-sm font-semibold text-[#111827]">Amount Summary</p>
                  <p className="mt-1 text-xs text-[#64748b]">
                    <span className="font-semibold text-emerald-700">
                      Total: {formatMoney(selectedOrder?.totalAmount, selectedOrder?.currency || "INR")}
                    </span>{" "}
                    | Subtotal: {formatMoney(selectedOrder?.subtotalAmount, selectedOrder?.currency || "INR")}
                  </p>
                </section>

                <section>
                  <h4 className="mb-2 text-sm font-semibold uppercase tracking-[0.08em] text-[#64748b]">
                    Payment Attempts Timeline
                  </h4>
                  {(paymentDetails?.attempts || []).length ? (
                    <div className="space-y-3">
                      {(paymentDetails?.attempts || []).map((attempt) => (
                        <article key={attempt.paymentTransactionId} className="rounded-xl border border-[#edf0f3] bg-[#fbfcfd] p-3">
                          <p className="text-sm font-semibold text-[#111827]">
                            Attempt #{attempt.attemptNumber} |{" "}
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getPaymentStatusBadgeClass(normalizeAttemptStatus(attempt.status))}`}>
                              {normalizeAttemptStatus(attempt.status)}
                            </span>
                          </p>
                          <p className="mt-1 text-xs text-[#64748b]">
                            <span className="font-semibold text-emerald-700">
                              Amount: {formatMoney(attempt.amount, attempt.currency)}
                            </span>{" "}
                            | Gateway: {attempt.gateway} | Method:{" "}
                            {attempt.method || "N/A"}
                          </p>
                          <p className="text-xs text-[#64748b]">Created: {formatDateTime(attempt.createdDt)}</p>
                          {attempt?.events?.length ? (
                            <div className="mt-2 space-y-1 rounded-lg border border-[#eef1f5] bg-white p-2">
                              {attempt.events.map((event) => (
                                <p
                                  key={event.paymentStatusTrackingId}
                                  className="text-[11px] text-[#475569]"
                                >
                                  {formatDateTime(event.eventTime)} | {event.eventType} |{" "}
                                  {event.previousStatus || "-"} to {event.newStatus || "-"}
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
          </article>
        </div>
      </div>
    </AdminConsoleLayout>
  );
};

export default AdminPaymentsView;
