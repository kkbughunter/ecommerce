import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import orderApi from "../../../core/api/orderApi";
import paymentApi from "../../../core/api/paymentApi";
import getApiErrorMessage from "../../../core/utils/apiError";
import AdminConsoleLayout from "../components/AdminConsoleLayout";

const ORDER_STATUSES = [
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

const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED", "REFUNDED"];

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
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    status: "PLACED",
    paymentStatus: "PENDING",
    location: "",
    note: "",
  });

  const filteredOrders = useMemo(() => {
    const query = orderSearch.trim().toLowerCase();
    if (!query) {
      return ordersPage.content || [];
    }
    return (ordersPage.content || []).filter((item) =>
      String(item?.orderNumber || "").toLowerCase().includes(query),
    );
  }, [ordersPage.content, orderSearch]);

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

      if (!selectedOrderId && content.length) {
        setSelectedOrderId(content[0].orderId);
      } else if (selectedOrderId && !content.some((item) => item.orderId === selectedOrderId)) {
        setSelectedOrderId(content[0]?.orderId || null);
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

  const pageStats = useMemo(() => {
    const list = ordersPage.content || [];
    return {
      total: list.length,
      paid: list.filter((item) => item?.paymentStatus === "PAID").length,
      pending: list.filter((item) => item?.paymentStatus === "PENDING").length,
      failed: list.filter((item) => item?.paymentStatus === "FAILED").length,
    };
  }, [ordersPage.content]);

  return (
    <AdminConsoleLayout
      activeNav="orders"
      title="Orders"
      subtitle="Review order items, update order progress, and maintain payment status."
      searchValue={orderSearch}
      onSearchChange={setOrderSearch}
      searchPlaceholder="Search by order number..."
      topActions={
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => navigate("/admin/invoices")}
            className="h-10 rounded-xl border border-[#d8dde6] bg-white px-3 text-xs font-semibold text-[#334155]"
          >
            Open Invoices
          </button>
          <button
            type="button"
            onClick={() => loadAdminOrders(ordersPage.page, ordersPage.size)}
            className="h-10 rounded-xl border border-[#d8dde6] bg-white px-3 text-xs font-semibold text-[#334155]"
          >
            Refresh Orders
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <section className="grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-[#e2e6ee] bg-white p-3">
            <p className="text-xs uppercase tracking-[0.08em] text-[#64748b]">This Page Orders</p>
            <p className="mt-1 text-xl font-semibold text-[#111827]">{pageStats.total}</p>
          </div>
          <div className="rounded-2xl border border-[#e2e6ee] bg-white p-3">
            <p className="text-xs uppercase tracking-[0.08em] text-[#64748b]">Paid</p>
            <p className="mt-1 text-xl font-semibold text-[#111827]">{pageStats.paid}</p>
          </div>
          <div className="rounded-2xl border border-[#e2e6ee] bg-white p-3">
            <p className="text-xs uppercase tracking-[0.08em] text-[#64748b]">Pending</p>
            <p className="mt-1 text-xl font-semibold text-[#111827]">{pageStats.pending}</p>
          </div>
          <div className="rounded-2xl border border-[#e2e6ee] bg-white p-3">
            <p className="text-xs uppercase tracking-[0.08em] text-[#64748b]">Failed</p>
            <p className="mt-1 text-xl font-semibold text-[#111827]">{pageStats.failed}</p>
          </div>
        </section>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {success ? <p className="text-sm text-emerald-600">{success}</p> : null}

        <div className="grid gap-4 xl:grid-cols-[1.05fr_1.95fr]">
          <article className="rounded-2xl border border-[#e2e6ee] bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#111827]">Order Queue</h2>
              <p className="text-xs text-[#94a3b8]">Total: {ordersPage.totalElements}</p>
            </div>
            {isLoadingOrders ? (
              <p className="text-sm text-[#64748b]">Loading orders...</p>
            ) : filteredOrders.length ? (
              <div className="space-y-2">
                {filteredOrders.map((order) => (
                  <button
                    key={order.orderId}
                    type="button"
                    onClick={() => setSelectedOrderId(order.orderId)}
                    className={`w-full rounded-xl border p-3 text-left ${
                      order.orderId === selectedOrderId
                        ? "border-[#111827] bg-[#f8fafc]"
                        : "border-[#e5e7eb] bg-[#fbfcfd]"
                    }`}
                  >
                    <p className="text-sm font-semibold text-[#111827]">{order.orderNumber}</p>
                    <p className="mt-1 text-xs text-[#64748b]">{formatDateTime(order.createdDt)}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getOrderStatusBadgeClass(order.status)}`}>
                        {order.status}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getPaymentStatusBadgeClass(order.paymentStatus)}`}>
                        {order.paymentStatus}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-emerald-700">
                      {formatMoney(order.totalAmount, order.currency)}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#64748b]">No matching orders found.</p>
            )}
            <div className="mt-4 flex gap-2">
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

          <article className="rounded-2xl border border-[#e2e6ee] bg-white p-4">
            {!selectedOrderId ? (
              <p className="text-sm text-[#64748b]">Select an order to manage.</p>
            ) : isLoadingDetails ? (
              <p className="text-sm text-[#64748b]">Loading order details...</p>
            ) : (
              <div className="space-y-4">
                <section className="rounded-xl border border-[#e8ecf2] bg-[#f8fafc] p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-base font-semibold text-[#111827]">
                        {selectedOrder?.orderNumber || selectedOrderSummary?.orderNumber}
                      </h3>
                      <p className="text-xs text-[#64748b]">
                        Customer: {selectedOrder?.userEmail || "-"} | Phone: {selectedOrder?.contactPhone || "-"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(`/admin/invoices?orderId=${selectedOrderId}`)}
                      className="h-8 rounded-lg border border-[#d8dde6] bg-white px-3 text-xs font-semibold text-[#334155]"
                    >
                      Open Invoice
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className={`rounded-full px-2 py-0.5 font-semibold ${getOrderStatusBadgeClass(selectedOrder?.status)}`}>
                      {selectedOrder?.status || "-"}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 font-semibold ${getPaymentStatusBadgeClass(selectedOrder?.paymentStatus)}`}>
                      {selectedOrder?.paymentStatus || "-"}
                    </span>
                    <span className="font-semibold text-emerald-700">
                      {formatMoney(
                        selectedOrder?.totalAmount || selectedOrderSummary?.totalAmount,
                        selectedOrder?.currency || "INR",
                      )}
                    </span>
                  </div>
                </section>

                <section className="grid gap-3 md:grid-cols-2">
                  <label className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-[0.06em] text-[#64748b]">
                      Order Status
                    </span>
                    <select
                      value={form.status}
                      onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
                      className="h-10 w-full rounded-lg border border-[#d8dde6] bg-white px-3 text-sm"
                    >
                      {ORDER_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-[0.06em] text-[#64748b]">
                      Payment Status
                    </span>
                    <select
                      value={form.paymentStatus}
                      onChange={(event) => setForm((prev) => ({ ...prev, paymentStatus: event.target.value }))}
                      className="h-10 w-full rounded-lg border border-[#d8dde6] bg-white px-3 text-sm"
                    >
                      {PAYMENT_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>
                </section>

                <section className="grid gap-3 md:grid-cols-2">
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
                </section>

                <button
                  type="button"
                  onClick={updateStatus}
                  disabled={isUpdating}
                  className="h-10 rounded-lg bg-[#111827] px-4 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {isUpdating ? "Updating..." : "Update Order"}
                </button>

                <section>
                  <h4 className="mb-2 text-sm font-semibold uppercase tracking-[0.08em] text-[#64748b]">Order Items</h4>
                  {(selectedOrder?.items || []).length ? (
                    <div className="overflow-x-auto rounded-xl border border-[#edf0f3]">
                      <table className="min-w-full border-collapse bg-white">
                        <thead>
                          <tr className="border-b border-[#edf0f3] text-left text-xs uppercase tracking-[0.08em] text-[#94a3b8]">
                            <th className="py-2 px-3">Item</th>
                            <th className="py-2 px-3">Qty</th>
                            <th className="py-2 px-3">Unit Price</th>
                            <th className="py-2 px-3">Line Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(selectedOrder?.items || []).map((item) => (
                            <tr key={item.orderItemId} className="border-b border-[#f1f5f9] text-sm text-[#334155]">
                              <td className="px-3 py-2">{item.productName}</td>
                              <td className="px-3 py-2">{item.quantity}</td>
                              <td className="px-3 py-2">
                                {formatMoney(item.unitPrice, selectedOrder?.currency || "INR")}
                              </td>
                              <td className="px-3 py-2">
                                {formatMoney(item.lineTotal, selectedOrder?.currency || "INR")}
                              </td>
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
                  <h4 className="mb-2 text-sm font-semibold uppercase tracking-[0.08em] text-[#64748b]">
                    Payment Attempts
                  </h4>
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
                          <p className="text-xs text-[#64748b]">
                            {formatMoney(attempt.amount, attempt.currency)} | Gateway: {attempt.gateway}
                          </p>
                          <p className="text-xs text-[#64748b]">Created: {formatDateTime(attempt.createdDt)}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[#64748b]">No payment attempts available.</p>
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

export default AdminOrdersView;
