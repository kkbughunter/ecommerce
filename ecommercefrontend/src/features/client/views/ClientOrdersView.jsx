import { useEffect, useMemo, useState } from "react";
import orderApi from "../../../core/api/orderApi";
import paymentApi from "../../../core/api/paymentApi";
import getApiErrorMessage from "../../../core/utils/apiError";
import AppFooter from "../../../layouts/AppFooter";
import ClientTopNav from "../components/ClientTopNav";

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

const ClientOrdersView = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [tracking, setTracking] = useState([]);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [error, setError] = useState("");

  const selectedOrderSummary = useMemo(
    () => orders.find((order) => order.orderId === selectedOrderId) || null,
    [orders, selectedOrderId],
  );

  const loadOrders = async () => {
    setIsLoadingList(true);
    setError("");
    try {
      const response = await orderApi.getMyOrders();
      const list = Array.isArray(response?.data?.data) ? response.data.data : [];
      setOrders(list);
      if (list.length && !selectedOrderId) {
        setSelectedOrderId(list[0].orderId);
      }
      if (!list.length) {
        setSelectedOrderId(null);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to load your orders."));
    } finally {
      setIsLoadingList(false);
    }
  };

  const loadOrderDetails = async (orderId) => {
    if (!orderId) {
      setSelectedOrder(null);
      setTracking([]);
      setPaymentDetails(null);
      return;
    }
    setIsLoadingDetails(true);
    setError("");
    try {
      const [detailResponse, trackingResponse, paymentResponse] = await Promise.all([
        orderApi.getOrderDetails(orderId),
        orderApi.getOrderTracking(orderId),
        paymentApi.getOrderPaymentDetails(orderId),
      ]);
      setSelectedOrder(detailResponse?.data?.data || null);
      setTracking(Array.isArray(trackingResponse?.data?.data) ? trackingResponse.data.data : []);
      setPaymentDetails(paymentResponse?.data?.data || null);
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to load order details."));
    } finally {
      setIsLoadingDetails(false);
    }
  };

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadOrderDetails(selectedOrderId);
  }, [selectedOrderId]);

  return (
    <main className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_20%_0%,#eef2ff_0%,#f8fafc_45%,#f6f8fc_100%)] text-[#0f172a]">
      <ClientTopNav title="My Orders" />

      <section className="w-full flex-1 px-2 py-6 md:px-3">
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        <div className="grid gap-4 lg:grid-cols-[1.1fr_1.9fr]">
          <article className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Order List</h2>
              <button
                type="button"
                onClick={loadOrders}
                className="h-8 rounded-md border border-slate-300 px-3 text-xs font-semibold text-slate-700"
              >
                Refresh
              </button>
            </div>
            {isLoadingList ? (
              <p className="text-sm text-slate-500">Loading orders...</p>
            ) : orders.length ? (
              <div className="space-y-2">
                {orders.map((order) => (
                  <button
                    key={order.orderId}
                    type="button"
                    onClick={() => setSelectedOrderId(order.orderId)}
                    className={`w-full rounded-xl border p-3 text-left ${
                      order.orderId === selectedOrderId
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <p className="text-sm font-semibold text-slate-900">{order.orderNumber}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatDateTime(order.createdDt)}</p>
                    <p className="mt-1 text-xs text-slate-700">
                      {order.status} | {order.paymentStatus}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {formatMoney(order.totalAmount, order.currency)}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No orders yet.</p>
            )}
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-4">
            {!selectedOrderId ? (
              <p className="text-sm text-slate-500">Select an order to view details.</p>
            ) : isLoadingDetails ? (
              <p className="text-sm text-slate-500">Loading order details...</p>
            ) : (
              <div className="space-y-5">
                <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-base font-semibold text-slate-900">
                    {selectedOrder?.orderNumber || selectedOrderSummary?.orderNumber}
                  </h3>
                  <p className="mt-1 text-sm text-slate-700">
                    Customer: <span className="font-semibold">{formatCustomerName(selectedOrder)}</span>
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    Email: <span className="font-semibold">{selectedOrder?.userEmail || "-"}</span>
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    Phone: <span className="font-semibold">{selectedOrder?.contactPhone || "-"}</span>
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    Status: <span className="font-semibold">{selectedOrder?.status || selectedOrderSummary?.status}</span>
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    Payment:{" "}
                    <span className="font-semibold">
                      {selectedOrder?.paymentStatus || selectedOrderSummary?.paymentStatus}
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    Total:{" "}
                    <span className="font-semibold">
                      {formatMoney(selectedOrder?.totalAmount || selectedOrderSummary?.totalAmount, selectedOrder?.currency || "INR")}
                    </span>
                  </p>
                </section>

                <section className="grid gap-3 md:grid-cols-2">
                  <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Shipping Address</h4>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {selectedOrder?.shippingAddress?.fullName || "-"}
                    </p>
                    <p className="text-xs text-slate-600">
                      Phone: {selectedOrder?.shippingAddress?.phoneNumber || selectedOrder?.contactPhone || "-"}
                    </p>
                    <p className="mt-1 text-xs text-slate-600">{formatAddressLine(selectedOrder?.shippingAddress)}</p>
                  </article>

                  <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Billing Address</h4>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {selectedOrder?.billingAddress?.fullName || "-"}
                    </p>
                    <p className="text-xs text-slate-600">
                      Phone: {selectedOrder?.billingAddress?.phoneNumber || selectedOrder?.contactPhone || "-"}
                    </p>
                    <p className="mt-1 text-xs text-slate-600">{formatAddressLine(selectedOrder?.billingAddress)}</p>
                  </article>
                </section>

                <section>
                  <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-700">Items</h4>
                  <div className="space-y-2">
                    {(selectedOrder?.items || []).map((item) => (
                      <div key={item.orderItemId} className="rounded-lg border border-slate-200 p-3">
                        <p className="truncate text-sm font-semibold text-slate-900" title={item.productName}>
                          {item.productName}
                        </p>
                        <p className="text-xs text-slate-600">
                          Qty {item.quantity} | {formatMoney(item.unitPrice, selectedOrder?.currency || "INR")}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-700">Tracking</h4>
                  <div className="space-y-2">
                    {tracking.map((event) => (
                      <div key={event.trackingEventId} className="rounded-lg border border-slate-200 p-3">
                        <p className="text-sm font-semibold text-slate-900">{event.status}</p>
                        <p className="text-xs text-slate-600">{event.note || "-"}</p>
                        <p className="text-xs text-slate-500">{formatDateTime(event.eventTime)}</p>
                      </div>
                    ))}
                    {!tracking.length && <p className="text-sm text-slate-500">No tracking events yet.</p>}
                  </div>
                </section>

                <section>
                  <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-700">Payment Attempts</h4>
                  <div className="space-y-2">
                    {(paymentDetails?.attempts || []).map((attempt) => (
                      <div key={attempt.paymentTransactionId} className="rounded-lg border border-slate-200 p-3">
                        <p className="text-sm font-semibold text-slate-900">
                          Attempt #{attempt.attemptNumber} | {formatPaymentAttemptStatus(attempt.status)}
                        </p>
                        <p className="text-xs text-slate-600">
                          {formatMoney(attempt.amount, attempt.currency)} | {attempt.gateway}
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
      </section>
      <AppFooter />
    </main>
  );
};

export default ClientOrdersView;

