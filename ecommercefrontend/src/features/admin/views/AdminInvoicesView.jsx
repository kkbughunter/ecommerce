import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  });
};

const formatAttemptStatus = (status) => {
  if (!status) {
    return "-";
  }
  if (status === "SUCCESS") {
    return "PAID";
  }
  return status;
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

const buildInvoiceNumber = (orderId) => `INV-${String(orderId || 0).padStart(8, "0")}`;

const AdminInvoicesView = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [ordersPage, setOrdersPage] = useState({
    content: [],
    page: 0,
    size: 30,
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

  const latestAttempt = useMemo(() => (paymentDetails?.attempts || [])[0] || null, [paymentDetails?.attempts]);

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
        size: Number(payload.size || 30),
        totalElements: Number(payload.totalElements || 0),
        totalPages: Number(payload.totalPages || 0),
        first: Boolean(payload.first),
        last: Boolean(payload.last),
      });

      const queryOrderId = Number(searchParams.get("orderId"));
      if (queryOrderId && content.some((item) => item.orderId === queryOrderId)) {
        setSelectedOrderId(queryOrderId);
        return;
      }
      if (!selectedOrderId && content.length) {
        setSelectedOrderId(content[0].orderId);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to load invoices."));
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const loadInvoiceData = async (orderId) => {
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
      setError(getApiErrorMessage(err, "Unable to load invoice details."));
    } finally {
      setIsLoadingDetails(false);
    }
  };

  useEffect(() => {
    loadAdminOrders(0, 30);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadInvoiceData(selectedOrderId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOrderId]);

  return (
    <AdminConsoleLayout
      activeNav="invoices"
      title="Invoices"
      subtitle="Generate and review itemized invoice views for customer orders."
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search invoice by order number..."
      topActions={
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => navigate("/admin/orders")}
            className="h-10 rounded-xl border border-[#d8dde6] bg-white px-3 text-xs font-semibold text-[#334155]"
          >
            Back To Orders
          </button>
          <button
            type="button"
            onClick={() => loadAdminOrders(ordersPage.page, ordersPage.size)}
            className="h-10 rounded-xl border border-[#d8dde6] bg-white px-3 text-xs font-semibold text-[#334155]"
          >
            Refresh
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="grid gap-4 xl:grid-cols-[1fr_2fr]">
          <article className="rounded-2xl border border-[#e2e6ee] bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#111827]">Invoice List</h2>
              <p className="text-xs text-[#94a3b8]">{ordersPage.totalElements} orders</p>
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
                    <p className="text-sm font-semibold text-[#111827]">{buildInvoiceNumber(order.orderId)}</p>
                    <p className="text-xs text-[#64748b]">{order.orderNumber}</p>
                    <p className="text-xs text-[#475569]">{formatDateTime(order.createdDt)}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getPaymentStatusBadgeClass(order.paymentStatus)}`}>
                        {order.paymentStatus}
                      </span>
                      <span className="text-xs font-semibold text-emerald-700">
                        {formatMoney(order.totalAmount, order.currency)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#64748b]">No invoices found.</p>
            )}
          </article>

          <article className="rounded-2xl border border-[#e2e6ee] bg-white p-4">
            {!selectedOrderId ? (
              <p className="text-sm text-[#64748b]">Select an invoice to view details.</p>
            ) : isLoadingDetails ? (
              <p className="text-sm text-[#64748b]">Loading invoice details...</p>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-semibold text-[#111827]">Invoice {buildInvoiceNumber(selectedOrderId)}</h3>
                    <p className="text-xs text-[#64748b]">Order {selectedOrder?.orderNumber || "-"}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="h-9 rounded-lg border border-[#d8dde6] bg-white px-3 text-xs font-semibold text-[#334155]"
                  >
                    Print Invoice
                  </button>
                </div>

                <section className="rounded-xl border border-[#edf0f3] bg-[#fbfcfd] p-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.08em] text-[#94a3b8]">From</p>
                      <p className="text-sm font-semibold text-[#111827]">Villpo Store</p>
                      <p className="text-xs text-[#64748b]">support@villpo.store</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.08em] text-[#94a3b8]">Bill To</p>
                      <p className="text-sm font-semibold text-[#111827]">{selectedOrder?.userEmail || "-"}</p>
                      <p className="text-xs text-[#64748b]">Phone: {selectedOrder?.contactPhone || "-"}</p>
                    </div>
                  </div>
                </section>

                <section className="overflow-x-auto rounded-xl border border-[#edf0f3]">
                  <table className="min-w-full border-collapse bg-white">
                    <thead>
                      <tr className="border-b border-[#edf0f3] text-left text-xs uppercase tracking-[0.08em] text-[#94a3b8]">
                        <th className="px-3 py-2">Item</th>
                        <th className="px-3 py-2">Qty</th>
                        <th className="px-3 py-2">Unit Price</th>
                        <th className="px-3 py-2">Line Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedOrder?.items || []).map((item) => (
                        <tr key={item.orderItemId} className="border-b border-[#f1f5f9] text-sm text-[#334155]">
                          <td className="px-3 py-2">{item.productName}</td>
                          <td className="px-3 py-2">{item.quantity}</td>
                          <td className="px-3 py-2">{formatMoney(item.unitPrice, selectedOrder?.currency || "INR")}</td>
                          <td className="px-3 py-2">{formatMoney(item.lineTotal, selectedOrder?.currency || "INR")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>

                <section className="grid gap-3 md:grid-cols-[1.4fr_1fr]">
                  <div className="rounded-xl border border-[#edf0f3] bg-[#fbfcfd] p-3">
                    <p className="text-xs uppercase tracking-[0.08em] text-[#94a3b8]">Payment Snapshot</p>
                    <p className="mt-1 text-sm text-[#334155]">
                      Status:{" "}
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getPaymentStatusBadgeClass(selectedOrder?.paymentStatus)}`}>
                        {selectedOrder?.paymentStatus || "-"}
                      </span>{" "}
                      | Latest Attempt:{" "}
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getPaymentStatusBadgeClass(latestAttempt ? formatAttemptStatus(latestAttempt.status) : "-")}`}>
                        {latestAttempt ? formatAttemptStatus(latestAttempt.status) : "-"}
                      </span>
                    </p>
                    <p className="text-sm text-[#334155]">
                      Gateway: {latestAttempt?.gateway || "RAZORPAY"} | Payment Id:{" "}
                      {latestAttempt?.razorpayPaymentId || "N/A"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#edf0f3] bg-white p-3 text-sm text-[#334155]">
                    <p>Subtotal: {formatMoney(selectedOrder?.subtotalAmount, selectedOrder?.currency || "INR")}</p>
                    <p>Shipping: {formatMoney(selectedOrder?.shippingFee, selectedOrder?.currency || "INR")}</p>
                    <p>Tax: {formatMoney(selectedOrder?.taxAmount, selectedOrder?.currency || "INR")}</p>
                    <p>Discount: {formatMoney(selectedOrder?.discountAmount, selectedOrder?.currency || "INR")}</p>
                    <p className="mt-2 border-t border-[#edf0f3] pt-2 text-base font-semibold text-emerald-700">
                      Total: {formatMoney(selectedOrder?.totalAmount, selectedOrder?.currency || "INR")}
                    </p>
                  </div>
                </section>
              </div>
            )}
          </article>
        </div>
      </div>
    </AdminConsoleLayout>
  );
};

export default AdminInvoicesView;
