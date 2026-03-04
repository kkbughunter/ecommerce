import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import orderApi from "../../../core/api/orderApi";
import paymentApi from "../../../core/api/paymentApi";
import { clearAuthSession } from "../../../core/auth/session";
import getApiErrorMessage from "../../../core/utils/apiError";
import FullLayout from "../../../layouts/FullLayout";

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
      setOrdersPage({
        content: Array.isArray(payload.content) ? payload.content : [],
        page: Number(payload.page || 0),
        size: Number(payload.size || 20),
        totalElements: Number(payload.totalElements || 0),
        totalPages: Number(payload.totalPages || 0),
        first: Boolean(payload.first),
        last: Boolean(payload.last),
      });
      const firstOrderId = payload?.content?.[0]?.orderId || null;
      if (!selectedOrderId && firstOrderId) {
        setSelectedOrderId(firstOrderId);
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
      setSuccess("Order status updated successfully.");
      await Promise.all([loadAdminOrders(ordersPage.page, ordersPage.size), loadOrderDetails(selectedOrderId)]);
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to update order status."));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = () => {
    clearAuthSession();
    navigate("/login", { replace: true });
  };

  return (
    <FullLayout
      title="Order Management"
      subtitle="Review customer orders and update order or payment status."
      onLogout={handleLogout}
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => navigate("/admin")}
          className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700"
        >
          Back To Products
        </button>
        <button
          type="button"
          onClick={() => loadAdminOrders(ordersPage.page, ordersPage.size)}
          className="h-9 rounded-lg border border-violet-300 bg-violet-50 px-3 text-xs font-semibold text-violet-700"
        >
          Refresh Orders
        </button>
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      {success && <p className="mb-3 text-sm text-emerald-600">{success}</p>}

      <div className="grid gap-4 lg:grid-cols-[1.1fr_1.9fr]">
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">All Orders</h2>
            <p className="text-xs text-slate-500">Total: {ordersPage.totalElements}</p>
          </div>
          {isLoadingOrders ? (
            <p className="text-sm text-slate-500">Loading orders...</p>
          ) : (
            <div className="space-y-2">
              {(ordersPage.content || []).map((order) => (
                <button
                  key={order.orderId}
                  type="button"
                  onClick={() => setSelectedOrderId(order.orderId)}
                  className={`w-full rounded-lg border p-3 text-left ${
                    order.orderId === selectedOrderId ? "border-violet-500 bg-violet-50" : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-900">{order.orderNumber}</p>
                  <p className="text-xs text-slate-600">{formatDateTime(order.createdDt)}</p>
                  <p className="text-xs text-slate-700">
                    {order.status} • {order.paymentStatus}
                  </p>
                  <p className="text-sm font-semibold text-slate-900">{formatMoney(order.totalAmount, order.currency)}</p>
                </button>
              ))}
              {!ordersPage.content?.length && <p className="text-sm text-slate-500">No orders found.</p>}
            </div>
          )}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              disabled={ordersPage.first}
              onClick={() => loadAdminOrders(Math.max(ordersPage.page - 1, 0), ordersPage.size)}
              className="h-8 rounded-md border border-slate-300 px-2 text-xs font-semibold text-slate-700 disabled:opacity-50"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={ordersPage.last}
              onClick={() => loadAdminOrders(ordersPage.page + 1, ordersPage.size)}
              className="h-8 rounded-md border border-slate-300 px-2 text-xs font-semibold text-slate-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4">
          {!selectedOrderId ? (
            <p className="text-sm text-slate-500">Select an order to manage.</p>
          ) : isLoadingDetails ? (
            <p className="text-sm text-slate-500">Loading order details...</p>
          ) : (
            <div className="space-y-4">
              <section className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <h3 className="text-base font-semibold text-slate-900">
                  {selectedOrder?.orderNumber || selectedOrderSummary?.orderNumber}
                </h3>
                <p className="text-xs text-slate-600">Customer: {selectedOrder?.userEmail || "-"}</p>
                <p className="text-xs text-slate-600">
                  Total: {formatMoney(selectedOrder?.totalAmount || selectedOrderSummary?.totalAmount, selectedOrder?.currency || "INR")}
                </p>
              </section>

              <section className="grid gap-3 md:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-xs font-semibold text-slate-700">Order Status</span>
                  <select
                    value={form.status}
                    onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
                    className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                  >
                    {ORDER_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-semibold text-slate-700">Payment Status</span>
                  <select
                    value={form.paymentStatus}
                    onChange={(event) => setForm((prev) => ({ ...prev, paymentStatus: event.target.value }))}
                    className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
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
                  <span className="text-xs font-semibold text-slate-700">Location</span>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
                    className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                    placeholder="Eg: Chennai Hub"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-semibold text-slate-700">Note</span>
                  <input
                    type="text"
                    value={form.note}
                    onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
                    className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                    placeholder="Status update note"
                  />
                </label>
              </section>

              <button
                type="button"
                onClick={updateStatus}
                disabled={isUpdating}
                className="h-10 rounded-lg bg-violet-600 px-4 text-sm font-semibold text-white disabled:opacity-50"
              >
                {isUpdating ? "Updating..." : "Update Order"}
              </button>

              <section>
                <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-700">Order Items</h4>
                <div className="space-y-2">
                  {(selectedOrder?.items || []).map((item) => (
                    <div key={item.orderItemId} className="rounded-lg border border-slate-200 p-3">
                      <p className="truncate text-sm font-semibold text-slate-900" title={item.productName}>
                        {item.productName}
                      </p>
                      <p className="text-xs text-slate-600">
                        Qty {item.quantity} • {formatMoney(item.unitPrice, selectedOrder?.currency || "INR")}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-700">Payment Attempts</h4>
                <div className="space-y-2">
                  {(paymentDetails?.attempts || []).map((attempt) => (
                    <div key={attempt.paymentTransactionId} className="rounded-lg border border-slate-200 p-3">
                      <p className="text-sm font-semibold text-slate-900">
                        Attempt #{attempt.attemptNumber} • {formatPaymentAttemptStatus(attempt.status)}
                      </p>
                      <p className="text-xs text-slate-600">
                        {formatMoney(attempt.amount, attempt.currency)} • {attempt.gateway}
                      </p>
                      <p className="text-xs text-slate-500">{formatDateTime(attempt.createdDt)}</p>
                    </div>
                  ))}
                  {!paymentDetails?.attempts?.length && (
                    <p className="text-sm text-slate-500">No payment attempts available.</p>
                  )}
                </div>
              </section>
            </div>
          )}
        </article>
      </div>
    </FullLayout>
  );
};

export default AdminOrdersView;
