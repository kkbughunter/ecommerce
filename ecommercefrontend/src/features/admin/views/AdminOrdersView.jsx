import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import orderApi from "../../../core/api/orderApi";
import paymentApi from "../../../core/api/paymentApi";
import getApiErrorMessage from "../../../core/utils/apiError";
import AdminConsoleLayout from "../components/AdminConsoleLayout";
import AdminRightPanel from "../components/AdminRightPanel";

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

const PAYMENT_STATUSES = ["ALL", "PENDING", "PAID", "FAILED", "REFUNDED"];
const DATE_RANGE_OPTIONS = [
  { value: "ALL", label: "All Time" },
  { value: "7", label: "Last 7 Days" },
  { value: "14", label: "Last 14 Days" },
  { value: "30", label: "Last 30 Days" },
];

const TopBarIcon = ({ path }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
    <path d={path} />
  </svg>
);

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

const formatCustomerName = (order) => {
  const name = [order?.customerFirstName, order?.customerLastName]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(" ");
  return name || "-";
};

const formatAddressLine = (address) => {
  if (!address) {
    return "-";
  }
  const parts = [
    address?.line1,
    address?.line2,
    address?.landmark,
    address?.city,
    address?.district,
    address?.state,
    address?.country,
    address?.postalCode,
  ]
    .map((part) => String(part || "").trim())
    .filter(Boolean);
  return parts.length ? parts.join(", ") : "-";
};

const formatPaymentAttemptStatus = (status) => {
  if (!status) {
    return "-";
  }
  if (status === "SUCCESS") {
    return "PAID";
  }
  return status;
};

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

const isWithinDays = (value, dayRange) => {
  if (dayRange === "ALL") {
    return true;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }
  const days = Number(dayRange);
  if (!Number.isFinite(days) || days <= 0) {
    return true;
  }
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - days);
  return parsed >= cutoff;
};

const AdminOrdersView = () => {
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
  const [orderSearch, setOrderSearch] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filters, setFilters] = useState({
    orderStatus: "ALL",
    paymentStatus: "ALL",
    dateRange: "ALL",
  });
  const [form, setForm] = useState({
    status: "PLACED",
    paymentStatus: "PENDING",
    location: "",
    note: "",
  });

  const filteredOrders = useMemo(() => {
    const query = orderSearch.trim().toLowerCase();
    return (ordersPage.content || []).filter((item) => {
      const orderStatusPass = filters.orderStatus === "ALL" || item?.status === filters.orderStatus;
      const paymentStatusPass = filters.paymentStatus === "ALL" || item?.paymentStatus === filters.paymentStatus;
      const datePass = isWithinDays(item?.createdDt, filters.dateRange);
      const text = [
        item?.orderNumber,
        item?.customerFirstName,
        item?.customerLastName,
        item?.customerEmail,
        item?.orderId,
      ]
        .map((value) => String(value || "").toLowerCase())
        .join(" ");
      const searchPass = !query || text.includes(query);
      return orderStatusPass && paymentStatusPass && datePass && searchPass;
    });
  }, [filters.dateRange, filters.orderStatus, filters.paymentStatus, orderSearch, ordersPage.content]);

  const selectedOrderSummary = useMemo(
    () => (ordersPage.content || []).find((order) => order.orderId === selectedOrderId) || null,
    [ordersPage.content, selectedOrderId],
  );

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
      setError(getApiErrorMessage(err, "Unable to load admin orders."));
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const loadOrderDetails = async (orderId) => {
    if (!orderId) {
      setSelectedOrder(null);
      setPaymentDetails(null);
      return;
    }
    setIsLoadingDetails(true);
    setError("");
    try {
      const [detailResponse, paymentResponse] = await Promise.all([
        orderApi.getOrderDetails(orderId),
        paymentApi.getOrderPaymentDetails(orderId),
      ]);
      const orderData = detailResponse?.data?.data || null;
      setSelectedOrder(orderData);
      setPaymentDetails(paymentResponse?.data?.data || null);
      setForm((prev) => ({
        ...prev,
        status: orderData?.status || "PLACED",
        paymentStatus: orderData?.paymentStatus || "PENDING",
      }));
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to load order details."));
    } finally {
      setIsLoadingDetails(false);
    }
  };

  useEffect(() => {
    loadAdminOrders(0, 20);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadOrderDetails(selectedOrderId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOrderId]);

  const openOrderDetails = (orderId) => {
    setSelectedOrderId(orderId);
    setIsDrawerOpen(true);
  };

  const updateStatus = async () => {
    if (!selectedOrderId) {
      return;
    }
    setIsUpdating(true);
    setError("");
    setSuccess("");
    try {
      await orderApi.updateAdminOrderStatus(selectedOrderId, {
        status: form.status,
        paymentStatus: form.paymentStatus || null,
        location: form.location?.trim() || null,
        note: form.note?.trim() || null,
      });
      setSuccess("Order status and payment status updated successfully.");
      await Promise.all([loadAdminOrders(ordersPage.page, ordersPage.size), loadOrderDetails(selectedOrderId)]);
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to update order status."));
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <AdminConsoleLayout
      activeNav="orders"
      title="Orders"
      subtitle="Table-first order operations with quick filters and right-side detail panel."
      searchValue={orderSearch}
      onSearchChange={setOrderSearch}
      searchPlaceholder="Search order id, customer, email..."
      topActions={
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => navigate("/admin/invoices")}
            title="Open Invoices"
            aria-label="Open Invoices"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#d8dde6] bg-white text-[#334155]"
          >
            <TopBarIcon path="M6 2h12v20l-3-2-3 2-3-2-3 2V2zm2 4v2h8V6H8zm0 4v2h8v-2H8z" />
          </button>
          <button
            type="button"
            onClick={() => loadAdminOrders(ordersPage.page, ordersPage.size)}
            title="Refresh Orders"
            aria-label="Refresh Orders"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#d8dde6] bg-white text-[#334155]"
          >
            <TopBarIcon path="M17.65 6.35A7.95 7.95 0 0 0 12 4V1L7 6l5 5V7a5 5 0 1 1-4.9 6h-2.02A7 7 0 1 0 17.65 6.35z" />
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {success ? <p className="text-sm text-emerald-600">{success}</p> : null}

        <section className="rounded-2xl border border-[#e2e6ee] bg-white p-3">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filters.orderStatus}
              onChange={(event) => setFilters((prev) => ({ ...prev, orderStatus: event.target.value }))}
              className="h-9 rounded-lg border border-[#d8dde6] bg-white px-3 text-xs font-semibold text-[#334155]"
            >
              {ORDER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status === "ALL" ? "All Order Statuses" : status}
                </option>
              ))}
            </select>
            <select
              value={filters.paymentStatus}
              onChange={(event) => setFilters((prev) => ({ ...prev, paymentStatus: event.target.value }))}
              className="h-9 rounded-lg border border-[#d8dde6] bg-white px-3 text-xs font-semibold text-[#334155]"
            >
              {PAYMENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status === "ALL" ? "All Payment Statuses" : status}
                </option>
              ))}
            </select>
            <select
              value={filters.dateRange}
              onChange={(event) => setFilters((prev) => ({ ...prev, dateRange: event.target.value }))}
              className="h-9 rounded-lg border border-[#d8dde6] bg-white px-3 text-xs font-semibold text-[#334155]"
            >
              {DATE_RANGE_OPTIONS.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setFilters({ orderStatus: "ALL", paymentStatus: "ALL", dateRange: "ALL" })}
              className="h-9 rounded-lg border border-[#d8dde6] bg-[#f8fafc] px-3 text-xs font-semibold text-[#334155]"
            >
              Clear Filters
            </button>
          </div>
        </section>

        <article className="rounded-2xl border border-[#e2e6ee] bg-white">
          <div className="flex items-center justify-between border-b border-[#edf0f3] px-4 py-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-[#475569]">Orders Table</h2>
            <p className="text-xs text-[#94a3b8]">
              Showing {filteredOrders.length} of {ordersPage.totalElements}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b border-[#edf0f3] text-left text-xs uppercase tracking-[0.08em] text-[#94a3b8]">
                  <th className="px-4 py-2">Order ID</th>
                  <th className="px-4 py-2">Total</th>
                  <th className="px-4 py-2">Order Status</th>
                  <th className="px-4 py-2">Payment</th>
                  <th className="px-4 py-2">Customer</th>
                  <th className="px-4 py-2">Order Date</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingOrders ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-[#64748b]">
                      Loading orders...
                    </td>
                  </tr>
                ) : filteredOrders.length ? (
                  filteredOrders.map((order) => (
                    <tr
                      key={order.orderId}
                      onClick={() => openOrderDetails(order.orderId)}
                      className="cursor-pointer border-b border-[#f1f5f9] text-sm text-[#334155] hover:bg-[#f8fafc]"
                    >
                      <td className="px-4 py-3 font-semibold text-[#111827]">{order.orderNumber}</td>
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
                      <td className="px-4 py-3">{formatCustomerName(order)}</td>
                      <td className="px-4 py-3">{formatDateTime(order.createdDt)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-[#64748b]">
                      No matching orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-[#edf0f3] px-4 py-3">
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
        title={selectedOrder?.orderNumber || selectedOrderSummary?.orderNumber || "Order Details"}
        subtitle="Order, customer, shipping and payment snapshot"
      >
        {!selectedOrderId ? (
          <p className="text-sm text-[#64748b]">Select an order from the table to view details.</p>
        ) : isLoadingDetails ? (
          <p className="text-sm text-[#64748b]">Loading order details...</p>
        ) : (
          <div className="space-y-4">
            <section className="rounded-xl border border-[#e8ecf2] bg-[#f8fafc] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-[#334155]">
                  Customer: <span className="font-semibold">{formatCustomerName(selectedOrder)}</span>
                </p>
                <button
                  type="button"
                  onClick={() => navigate(`/admin/invoices?orderId=${selectedOrderId}`)}
                  className="h-8 rounded-lg border border-[#d8dde6] bg-white px-3 text-xs font-semibold text-[#334155]"
                >
                  Open Invoice
                </button>
              </div>
              <p className="mt-1 text-xs text-[#64748b]">
                Email: {selectedOrder?.userEmail || "-"} | Phone: {selectedOrder?.contactPhone || "-"}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getOrderStatusBadgeClass(selectedOrder?.status)}`}>
                  {selectedOrder?.status || "-"}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getPaymentStatusBadgeClass(selectedOrder?.paymentStatus)}`}>
                  {selectedOrder?.paymentStatus || "-"}
                </span>
                <span className="text-sm font-semibold text-emerald-700">
                  {formatMoney(selectedOrder?.totalAmount || selectedOrderSummary?.totalAmount, selectedOrder?.currency)}
                </span>
              </div>
            </section>

            <section className="grid gap-3">
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.06em] text-[#64748b]">Order Status</span>
                <select
                  value={form.status}
                  onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
                  className="h-10 w-full rounded-lg border border-[#d8dde6] bg-white px-3 text-sm"
                >
                  {ORDER_STATUSES.filter((status) => status !== "ALL").map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.06em] text-[#64748b]">Payment Status</span>
                <select
                  value={form.paymentStatus}
                  onChange={(event) => setForm((prev) => ({ ...prev, paymentStatus: event.target.value }))}
                  className="h-10 w-full rounded-lg border border-[#d8dde6] bg-white px-3 text-sm"
                >
                  {PAYMENT_STATUSES.filter((status) => status !== "ALL").map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.06em] text-[#64748b]">Location</span>
                <input
                  type="text"
                  value={form.location}
                  onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
                  className="h-10 w-full rounded-lg border border-[#d8dde6] bg-white px-3 text-sm"
                  placeholder="Eg: Chennai Hub"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.06em] text-[#64748b]">Note</span>
                <input
                  type="text"
                  value={form.note}
                  onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
                  className="h-10 w-full rounded-lg border border-[#d8dde6] bg-white px-3 text-sm"
                  placeholder="Status update note"
                />
              </label>
              <button
                type="button"
                onClick={updateStatus}
                disabled={isUpdating}
                className="h-10 rounded-lg bg-[#111827] px-4 text-sm font-semibold text-white disabled:opacity-50"
              >
                {isUpdating ? "Updating..." : "Update Order"}
              </button>
            </section>

            <section className="rounded-xl border border-[#edf0f3] bg-[#fbfcfd] p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">Shipping Address</p>
              <p className="mt-1 text-xs text-[#334155]">{formatAddressLine(selectedOrder?.shippingAddress)}</p>
            </section>

            <section className="rounded-xl border border-[#edf0f3] bg-[#fbfcfd] p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">Billing Address</p>
              <p className="mt-1 text-xs text-[#334155]">{formatAddressLine(selectedOrder?.billingAddress)}</p>
            </section>

            <section>
              <h4 className="mb-2 text-sm font-semibold uppercase tracking-[0.08em] text-[#64748b]">Order Items</h4>
              {(selectedOrder?.items || []).length ? (
                <div className="overflow-x-auto rounded-xl border border-[#edf0f3]">
                  <table className="min-w-full border-collapse bg-white">
                    <thead>
                      <tr className="border-b border-[#edf0f3] text-left text-xs uppercase tracking-[0.08em] text-[#94a3b8]">
                        <th className="py-2 px-3">Item</th>
                        <th className="py-2 px-3">Qty</th>
                        <th className="py-2 px-3">Line Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedOrder?.items || []).map((item) => (
                        <tr key={item.orderItemId} className="border-b border-[#f1f5f9] text-sm text-[#334155]">
                          <td className="px-3 py-2">{item.productName}</td>
                          <td className="px-3 py-2">{item.quantity}</td>
                          <td className="px-3 py-2">{formatMoney(item.lineTotal, selectedOrder?.currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-[#64748b]">No order items found.</p>
              )}
            </section>

            <section>
              <h4 className="mb-2 text-sm font-semibold uppercase tracking-[0.08em] text-[#64748b]">Payment Attempts</h4>
              {(paymentDetails?.attempts || []).length ? (
                <div className="space-y-2">
                  {(paymentDetails?.attempts || []).map((attempt) => (
                    <div key={attempt.paymentTransactionId} className="rounded-xl border border-[#edf0f3] bg-[#fbfcfd] p-3">
                      <p className="text-sm font-semibold text-[#111827]">
                        Attempt #{attempt.attemptNumber} |{" "}
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getPaymentStatusBadgeClass(formatPaymentAttemptStatus(attempt.status))}`}>
                          {formatPaymentAttemptStatus(attempt.status)}
                        </span>
                      </p>
                      <p className="mt-1 text-xs text-[#64748b]">
                        {formatMoney(attempt.amount, attempt.currency)} | {formatDateTime(attempt.createdDt)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#64748b]">No payment attempts available.</p>
              )}
            </section>
          </div>
        )}
      </AdminRightPanel>
    </AdminConsoleLayout>
  );
};

export default AdminOrdersView;
