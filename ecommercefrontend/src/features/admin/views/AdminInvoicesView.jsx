import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import orderApi from "../../../core/api/orderApi";
import paymentApi from "../../../core/api/paymentApi";
import getApiErrorMessage from "../../../core/utils/apiError";
import AdminConsoleLayout from "../components/AdminConsoleLayout";
import AdminRightPanel from "../components/AdminRightPanel";

const PAYMENT_STATUSES = ["ALL", "PENDING", "PAID", "FAILED", "REFUNDED"];
const DATE_RANGE_OPTIONS = [
  { value: "ALL", label: "All Time" },
  { value: "7", label: "Last 7 Days" },
  { value: "14", label: "Last 14 Days" },
  { value: "30", label: "Last 30 Days" },
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
  const [filters, setFilters] = useState({
    paymentStatus: "ALL",
    dateRange: "ALL",
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
      const datePass = isWithinDays(item?.createdDt, filters.dateRange);
      const text = [
        item?.orderNumber,
        buildInvoiceNumber(item?.orderId),
        item?.customerFirstName,
        item?.customerLastName,
      ]
        .map((value) => String(value || "").toLowerCase())
        .join(" ");
      const searchPass = !query || text.includes(query);
      return paymentStatusPass && datePass && searchPass;
    });
  }, [filters.dateRange, filters.paymentStatus, ordersPage.content, search]);

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
        setIsDrawerOpen(true);
      }

      if (selectedOrderId && !content.some((item) => item.orderId === selectedOrderId)) {
        setSelectedOrderId(null);
        setSelectedOrder(null);
        setPaymentDetails(null);
        setIsDrawerOpen(false);
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

  const openInvoice = (orderId) => {
    setSelectedOrderId(orderId);
    setIsDrawerOpen(true);
  };

  return (
    <AdminConsoleLayout
      activeNav="invoices"
      title="Invoices"
      subtitle="Invoice listing in table format with quick filters and right-side invoice viewer."
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search invoice/order/customer..."
      topActions={
        <div className="flex flex-wrap justify-end gap-2">
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
              value={filters.dateRange}
              onChange={(event) => setFilters((prev) => ({ ...prev, dateRange: event.target.value }))}
              className="h-9 w-full rounded-lg border border-[#d8dde6] bg-white px-3 text-xs font-semibold text-[#334155] sm:w-auto"
            >
              {DATE_RANGE_OPTIONS.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setFilters({ paymentStatus: "ALL", dateRange: "ALL" })}
              className="h-9 rounded-lg border border-[#d8dde6] bg-[#f8fafc] px-3 text-xs font-semibold text-[#334155]"
            >
              Clear Filters
            </button>
          </div>
        </section>

        <article className="rounded-2xl border border-[#e2e6ee] bg-white">
          <div className="flex items-center justify-between border-b border-[#edf0f3] px-4 py-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-[#475569]">Invoice Table</h2>
            <p className="text-xs text-[#94a3b8]">
              Showing {filteredOrders.length} of {ordersPage.totalElements}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b border-[#edf0f3] text-left text-xs uppercase tracking-[0.08em] text-[#94a3b8]">
                  <th className="px-4 py-2">Invoice #</th>
                  <th className="px-4 py-2">Order</th>
                  <th className="px-4 py-2">Customer</th>
                  <th className="px-4 py-2">Order Date</th>
                  <th className="px-4 py-2">Amount</th>
                  <th className="px-4 py-2">Payment</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingOrders ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-[#64748b]">
                      Loading invoices...
                    </td>
                  </tr>
                ) : filteredOrders.length ? (
                  filteredOrders.map((order) => (
                    <tr
                      key={order.orderId}
                      onClick={() => openInvoice(order.orderId)}
                      className="cursor-pointer border-b border-[#f1f5f9] text-sm text-[#334155] hover:bg-[#f8fafc]"
                    >
                      <td className="px-4 py-3 font-semibold text-[#111827]">{buildInvoiceNumber(order.orderId)}</td>
                      <td className="px-4 py-3">{order.orderNumber}</td>
                      <td className="px-4 py-3">
                        {[order?.customerFirstName, order?.customerLastName].filter(Boolean).join(" ") || "-"}
                      </td>
                      <td className="px-4 py-3">{formatDateTime(order.createdDt)}</td>
                      <td className="px-4 py-3">{formatMoney(order.totalAmount, order.currency)}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getPaymentStatusBadgeClass(order.paymentStatus)}`}>
                          {order.paymentStatus || "-"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-[#64748b]">
                      No invoices found.
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
        title={selectedOrderId ? `Invoice ${buildInvoiceNumber(selectedOrderId)}` : "Invoice Details"}
        subtitle={selectedOrder?.orderNumber ? `Order ${selectedOrder.orderNumber}` : "Itemized invoice details"}
      >
        {!selectedOrderId ? (
          <p className="text-sm text-[#64748b]">Select an invoice row to view details.</p>
        ) : isLoadingDetails ? (
          <p className="text-sm text-[#64748b]">Loading invoice details...</p>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-[0.08em] text-[#94a3b8]">Billing Summary</p>
                <p className="text-sm font-semibold text-[#111827]">{selectedOrder?.userEmail || "-"}</p>
                <p className="text-xs text-[#64748b]">Phone: {selectedOrder?.contactPhone || "-"}</p>
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="h-9 rounded-lg border border-[#d8dde6] bg-white px-3 text-xs font-semibold text-[#334155]"
              >
                Print
              </button>
            </div>

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

            <section className="rounded-xl border border-[#edf0f3] bg-[#fbfcfd] p-3 text-sm text-[#334155]">
              <p>
                Payment Status:{" "}
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getPaymentStatusBadgeClass(selectedOrder?.paymentStatus)}`}>
                  {selectedOrder?.paymentStatus || "-"}
                </span>
              </p>
              <p className="mt-1">
                Latest Attempt:{" "}
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getPaymentStatusBadgeClass(latestAttempt ? formatAttemptStatus(latestAttempt.status) : "-")}`}>
                  {latestAttempt ? formatAttemptStatus(latestAttempt.status) : "-"}
                </span>
              </p>
              <p className="mt-2">Subtotal: {formatMoney(selectedOrder?.subtotalAmount, selectedOrder?.currency || "INR")}</p>
              <p>Shipping: {formatMoney(selectedOrder?.shippingFee, selectedOrder?.currency || "INR")}</p>
              <p>Tax: {formatMoney(selectedOrder?.taxAmount, selectedOrder?.currency || "INR")}</p>
              <p>Discount: {formatMoney(selectedOrder?.discountAmount, selectedOrder?.currency || "INR")}</p>
              <p className="mt-2 border-t border-[#edf0f3] pt-2 text-base font-semibold text-emerald-700">
                Total: {formatMoney(selectedOrder?.totalAmount, selectedOrder?.currency || "INR")}
              </p>
            </section>
          </div>
        )}
      </AdminRightPanel>
    </AdminConsoleLayout>
  );
};

export default AdminInvoicesView;
