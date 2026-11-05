import { useEffect, useMemo, useState } from "react";
import orderApi from "../../../core/api/orderApi";
import { Link } from "react-router-dom";
import ProductImage from "../components/ProductImage";
import StoreIcon from "../components/StoreIcon";
import productApi from "../../../core/api/productApi";
import getApiErrorMessage from "../../../core/utils/apiError";
import StoreFooter from "../components/StoreFooter";
import ClientTopNav from "../components/ClientTopNav";

const FLOW_STEPS = [
  {
    key: "CONFIRMED",
    label: "Order Confirming",
    statuses: ["PLACED", "CONFIRMED"],
  },
  {
    key: "PAYMENT",
    label: "Payment Pending",
    statuses: ["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY"],
  },
  { key: "PACKED", label: "Processing", statuses: ["PACKED"] },
  {
    key: "SHIPPED",
    label: "Shipping",
    statuses: ["SHIPPED", "OUT_FOR_DELIVERY"],
  },
  { key: "DELIVERED", label: "Delivered", statuses: ["DELIVERED"] },
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

const formatDate = (value) => {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
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

const getProductStatusClass = (orderStatus) => {
  if (orderStatus === "DELIVERED") {
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  }
  if (orderStatus === "CANCELLED" || orderStatus === "RETURNED") {
    return "bg-rose-100 text-rose-700 border-rose-200";
  }
  return "bg-amber-100 text-amber-700 border-amber-200";
};

const isStepReached = (orderStatus, step) => {
  const normalized = String(orderStatus || "").toUpperCase();
  if (normalized === "CANCELLED") {
    return false;
  }
  if (step.key === "PAYMENT") {
    return normalized !== "FAILED";
  }
  return (
    step.statuses.includes(normalized) ||
    (["OUT_FOR_DELIVERY", "DELIVERED", "RETURNED"].includes(normalized) &&
      step.key !== "CONFIRMED")
  );
};

const calculateItemTax = (item, order) => {
  const subtotal = Number(order?.subtotalAmount || 0);
  const taxTotal = Number(order?.taxAmount || 0);
  const lineTotal = Number(item?.lineTotal || 0);
  if (subtotal <= 0 || taxTotal <= 0 || lineTotal <= 0) {
    return 0;
  }
  return (lineTotal / subtotal) * taxTotal;
};

const ClientOrdersView = () => {
  const [productImages, setProductImages] = useState({});
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [tracking, setTracking] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [error, setError] = useState("");

  const selectedOrderSummary = useMemo(
    () => orders.find((order) => order.orderId === selectedOrderId) || null,
    [orders, selectedOrderId],
  );

  const orderStatus =
    selectedOrder?.status || selectedOrderSummary?.status || "";

  const loadOrders = async () => {
    setIsLoadingList(true);
    setError("");
    try {
      const response = await orderApi.getMyOrders();
      const list = Array.isArray(response?.data?.data)
        ? response.data.data
        : [];
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
      return;
    }
    setIsLoadingDetails(true);
    setError("");
    try {
      const [detailResponse, trackingResponse] = await Promise.all([
        orderApi.getOrderDetails(orderId),
        orderApi.getOrderTracking(orderId),
      ]);
      setSelectedOrder(detailResponse?.data?.data || null);
      setTracking(
        Array.isArray(trackingResponse?.data?.data)
          ? trackingResponse.data.data
          : [],
      );
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

  useEffect(() => {
    let active = true;
    const ids = [
      ...new Set(
        (selectedOrder?.items || [])
          .map((item) => item.productId)
          .filter(Boolean),
      ),
    ];
    Promise.allSettled(
      ids.map(async (id) => {
        const response = await productApi.getProductDetails(id);
        const data = response?.data?.data;
        const ready = data?.images?.find(
          (image) => image.processingStatus === "READY",
        );
        return [
          id,
          data?.mediumImageUrl ||
            data?.thumbnailUrl ||
            ready?.mediumUrl ||
            ready?.thumbnailUrl ||
            ready?.largeUrl,
        ];
      }),
    ).then((results) => {
      if (active)
        setProductImages(
          Object.fromEntries(
            results
              .filter((result) => result.status === "fulfilled")
              .map((result) => result.value),
          ),
        );
    });
    return () => {
      active = false;
    };
  }, [selectedOrder]);

  return (
    <main className="storefront flex min-h-screen flex-col">
      <ClientTopNav title="My Orders" />

      <section
        id="main-content"
        tabIndex="-1"
        className="store-container store-page-content"
      >
        <div className="store-page-heading">
          <p className="store-eyebrow">YOUR VILLPO</p>
          <h1>Your orders. All in one place.</h1>
          <p>Track your components, from checkout to your workbench.</p>
        </div>
        {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}

        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <article className="rounded-2xl border border-[#e2e8f0] bg-white p-3 sm:p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-[#111827]">
                Order History
              </h2>
              <button
                type="button"
                onClick={loadOrders}
                className="h-8 rounded-md border border-[#d5dde7] px-3 text-xs font-semibold text-[#334155]"
              >
                Refresh
              </button>
            </div>
            {isLoadingList ? (
              <p className="text-sm text-slate-500">Loading orders...</p>
            ) : orders.length ? (
              <div className="max-h-[460px] space-y-2 overflow-auto pr-1">
                {orders.map((order) => (
                  <button
                    key={order.orderId}
                    type="button"
                    onClick={() => setSelectedOrderId(order.orderId)}
                    className={`w-full rounded-xl border p-3 text-left ${
                      order.orderId === selectedOrderId
                        ? "border-blue-300 bg-blue-50"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      {order.orderNumber}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDateTime(order.createdDt)}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {formatMoney(order.totalAmount, order.currency)}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="store-empty">
                <StoreIcon name="box" />
                <h3>Your first build awaits</h3>
                <p>Your orders will appear here.</p>
                <Link to="/client#products" className="store-button">
                  Shop components
                </Link>
              </div>
            )}
          </article>

          <article className="rounded-2xl border border-[#e2e8f0] bg-white p-3 sm:p-4">
            {!selectedOrderId ? (
              <div className="store-empty">
                <StoreIcon name="box" />
                <h3>Every part of your order</h3>
                <p>
                  Select an order to view your components, payment and delivery
                  progress.
                </p>
              </div>
            ) : isLoadingDetails ? (
              <p className="text-sm text-slate-500">Loading order details...</p>
            ) : (
              <div className="space-y-4">
                <section className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold text-[#111827] sm:text-2xl">
                      {selectedOrder?.orderNumber ||
                        selectedOrderSummary?.orderNumber}
                    </h3>
                    <p className="text-xs text-[#64748b]">
                      Order History / Order Details /{" "}
                      {selectedOrder?.orderNumber} -{" "}
                      {formatDate(selectedOrder?.createdDt)}
                    </p>
                  </div>
                </section>

                <section className="grid gap-4 xl:grid-cols-[2fr_1fr]">
                  <article className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3">
                    <h4 className="text-sm font-semibold text-[#111827]">
                      Progress
                    </h4>
                    <p className="mb-2 text-xs text-[#64748b]">
                      Current order status
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                      {FLOW_STEPS.map((step) => {
                        const reached = isStepReached(orderStatus, step);
                        return (
                          <div
                            key={step.key}
                            className={`rounded-lg border p-2 ${
                              reached
                                ? "border-blue-300 bg-blue-50"
                                : "border-slate-200 bg-white"
                            }`}
                          >
                            <p className="text-xs font-semibold text-[#1f2937]">
                              {step.label}
                            </p>
                            <div
                              className={`mt-2 h-[3px] rounded-full ${reached ? "bg-blue-500" : "bg-slate-200"}`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </article>

                  <article className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-[#111827]">
                        Payment
                      </h4>
                    </div>
                    <p className="mb-2 text-xs text-[#64748b]">
                      Final payment amount
                    </p>
                    <div className="space-y-1 text-sm text-[#334155]">
                      <p className="flex items-center justify-between">
                        <span>Subtotal</span>
                        <span>
                          {formatMoney(
                            selectedOrder?.subtotalAmount,
                            selectedOrder?.currency || "INR",
                          )}
                        </span>
                      </p>
                      <p className="flex items-center justify-between">
                        <span>Discount</span>
                        <span>
                          -
                          {formatMoney(
                            selectedOrder?.discountAmount,
                            selectedOrder?.currency || "INR",
                          )}
                        </span>
                      </p>
                      <p className="flex items-center justify-between">
                        <span>Shipping Cost</span>
                        <span>
                          {formatMoney(
                            selectedOrder?.shippingFee,
                            selectedOrder?.currency || "INR",
                          )}
                        </span>
                      </p>
                      <p className="flex items-center justify-between">
                        <span>Tax (GST)</span>
                        <span>
                          {formatMoney(
                            selectedOrder?.taxAmount,
                            selectedOrder?.currency || "INR",
                          )}
                        </span>
                      </p>
                      <p className="mt-2 flex items-center justify-between border-t border-[#dbe2ea] pt-2 font-semibold text-[#111827]">
                        <span>Total</span>
                        <span>
                          {formatMoney(
                            selectedOrder?.totalAmount,
                            selectedOrder?.currency || "INR",
                          )}
                        </span>
                      </p>
                    </div>
                  </article>
                </section>

                <section className="grid gap-4 xl:grid-cols-[2fr_1fr]">
                  <article className="rounded-xl border border-[#e2e8f0] bg-white p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-[#111827]">
                        Product
                      </h4>
                    </div>
                    <p className="mb-2 text-xs text-[#64748b]">Your shipment</p>
                    <div className="store-order-products">
                      {(selectedOrder?.items || []).map((item) => (
                        <div
                          className="store-order-product"
                          key={item.orderItemId}
                        >
                          <Link
                            to={`/products/${item.productId}`}
                            className="store-cart-picture"
                            aria-label={`View ${item.productName}`}
                          >
                            <ProductImage
                              src={productImages[item.productId]}
                              alt={item.productName}
                            />
                          </Link>
                          <div>
                            <Link to={`/products/${item.productId}`}>
                              <h5>{item.productName}</h5>
                            </Link>
                            <p>
                              Qty {item.quantity} ·{" "}
                              {formatMoney(
                                item.unitPrice,
                                selectedOrder?.currency || "INR",
                              )}{" "}
                              each
                            </p>
                            <p>
                              Tax:{" "}
                              {formatMoney(
                                calculateItemTax(item, selectedOrder),
                                selectedOrder?.currency || "INR",
                              )}
                            </p>
                            <span
                              className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[10px] ${getProductStatusClass(orderStatus)}`}
                            >
                              {orderStatus?.replaceAll("_", " ") ||
                                "Processing"}
                            </span>
                          </div>
                          <strong>
                            {formatMoney(
                              item.lineTotal,
                              selectedOrder?.currency || "INR",
                            )}
                          </strong>
                        </div>
                      ))}
                    </div>
                  </article>

                  <article className="space-y-3">
                    <section className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3">
                      <h4 className="text-sm font-semibold text-[#111827]">
                        Customer
                      </h4>
                      <p className="mt-1 text-xs text-[#64748b]">
                        Information detail
                      </p>
                      <div className="mt-2 space-y-2 text-xs text-[#334155]">
                        <div>
                          <p className="font-semibold text-[#1f2937]">
                            General Information
                          </p>
                          <p>Name: {formatCustomerName(selectedOrder)}</p>
                          <p>Email: {selectedOrder?.userEmail || "-"}</p>
                          <p>Phone: {selectedOrder?.contactPhone || "-"}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-[#1f2937]">
                            Shipping Address
                          </p>
                          <p>
                            {formatAddressLine(selectedOrder?.shippingAddress)}
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold text-[#1f2937]">
                            Billing Address
                          </p>
                          <p>
                            {formatAddressLine(selectedOrder?.billingAddress)}
                          </p>
                        </div>
                      </div>
                    </section>
                  </article>
                </section>

                <section className="rounded-xl border border-[#e2e8f0] bg-white p-3">
                  <h4 className="text-sm font-semibold text-[#111827]">
                    Timeline
                  </h4>
                  <p className="mb-2 text-xs text-[#64748b]">
                    Track shipment progress
                  </p>
                  <div className="overflow-x-auto rounded-lg border border-[#e7edf4]">
                    <table className="min-w-full border-collapse">
                      <thead>
                        <tr className="border-b border-[#e7edf4] bg-[#f8fafc] text-left text-xs uppercase tracking-[0.06em] text-[#64748b]">
                          <th className="px-3 py-2">Status</th>
                          <th className="px-3 py-2">Note</th>
                          <th className="px-3 py-2">Location</th>
                          <th className="px-3 py-2">Event Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tracking.length ? (
                          tracking.map((event) => (
                            <tr
                              key={event.trackingEventId}
                              className="border-b border-[#eef2f7] text-sm text-[#334155]"
                            >
                              <td className="px-3 py-2 font-medium text-[#111827]">
                                {event.status || "-"}
                              </td>
                              <td className="px-3 py-2">{event.note || "-"}</td>
                              <td className="px-3 py-2">
                                {event.location || "-"}
                              </td>
                              <td className="px-3 py-2">
                                {formatDateTime(event.eventTime)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={4}
                              className="px-3 py-4 text-center text-sm text-[#64748b]"
                            >
                              No timeline events yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            )}
          </article>
        </div>
      </section>
      <StoreFooter />
    </main>
  );
};

export default ClientOrdersView;
