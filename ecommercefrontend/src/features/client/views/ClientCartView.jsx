import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ENV from "../../../core/config/env";
import AppFooter from "../../../layouts/AppFooter";
import ClientTopNav from "../components/ClientTopNav";
import useCart from "../hooks/useCart";

const formatMoney = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const ClientCartView = () => {
  const navigate = useNavigate();
  const apiBase = ENV.API_BASE_URL?.replace(/\/+$/, "") || "";
  const {
    cart,
    isLoadingCart,
    isMutatingCart,
    error,
    success,
    itemErrors,
    updateQuantity,
    removeFromCart,
    clearCart,
    checkout,
  } = useCart();
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [localQuantities, setLocalQuantities] = useState({});
  const showAddressSetupError = (error || "")
    .toLowerCase()
    .includes("please set default shipping and billing addresses in your profile");
  const isInsufficientStockError = (error || "")
    .toLowerCase()
    .includes("insufficient stock for product");
  const showGlobalError = !!error && !showAddressSetupError && !isInsufficientStockError;

  useEffect(() => {
    const ids = (cart?.items || []).map((item) => item.productId).filter(Boolean);
    setSelectedProductIds(ids);
    const quantities = {};
    (cart?.items || []).forEach((item) => {
      quantities[item.productId] = item.quantity;
    });
    setLocalQuantities(quantities);
  }, [cart?.items]);

  const allProductIds = useMemo(
    () => (cart?.items || []).map((item) => item.productId).filter(Boolean),
    [cart?.items],
  );
  const isAllSelected = allProductIds.length > 0 && selectedProductIds.length === allProductIds.length;

  return (
    <main className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_20%_0%,#eef2ff_0%,#f8fafc_45%,#f6f8fc_100%)] text-[#0f172a]">
      <ClientTopNav title="Your Cart" cartCount={cart?.totalItems || 0} />

      <section className="w-full flex-1 px-2 py-6 md:px-3">
        {showAddressSetupError ? (
          <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-4">
            <p className="text-base font-semibold text-amber-800">
              Please set default shipping and billing addresses in your profile before placing an order.
            </p>
            <p className="mt-1 text-sm text-amber-700">
              Update your address details in My Account, then return to checkout.
            </p>
            <button
              type="button"
              onClick={() => navigate("/client/account")}
              className="mt-3 h-10 rounded-lg bg-amber-600 px-4 text-sm font-semibold text-white hover:bg-amber-700"
            >
              Go To My Account
            </button>
          </div>
        ) : null}
        {showGlobalError && <p className="mb-3 text-sm text-red-600">{error}</p>}
        {success && <p className="mb-3 text-sm text-emerald-600">{success}</p>}
        {isLoadingCart ? (
          <p className="text-sm text-slate-500">Loading cart...</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <article className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-slate-900">Cart Items</h2>
                {!!allProductIds.length && (
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedProductIds((prev) => (prev.length === allProductIds.length ? [] : allProductIds))
                    }
                    className="h-8 rounded-md border border-slate-300 px-2 text-xs font-semibold text-slate-700"
                  >
                    {isAllSelected ? "Unselect All" : "Select All"}
                  </button>
                )}
              </div>
              {cart?.items?.length ? (
                <div className="space-y-3">
                  {cart.items.map((item) => (
                    <div
                      key={item.productId}
                      className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 ${
                        itemErrors?.[item.productId]
                          ? "border-rose-300 bg-rose-50"
                          : "border-slate-200 bg-slate-50"
                      }`}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedProductIds.includes(item.productId)}
                          onChange={(event) =>
                            setSelectedProductIds((prev) =>
                              event.target.checked
                                ? Array.from(new Set([...prev, item.productId]))
                                : prev.filter((id) => id !== item.productId),
                            )
                          }
                          className="h-4 w-4"
                        />
                        {item?.mainImageUploadId ? (
                          <img
                            src={`${apiBase}/products/${item.productId}/images/${item.mainImageUploadId}/file`}
                            alt={item.productName || "Product"}
                            className="h-16 w-16 rounded-lg border border-slate-200 object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-slate-300 text-[10px] text-slate-400">
                            N/A
                          </div>
                        )}
                        <div>
                          <p className="max-w-[180px] truncate font-medium text-slate-900 sm:max-w-[320px]" title={item.productName}>
                            {item.productName}
                          </p>
                          <p className="text-xs text-slate-500">Unit: {formatMoney(item.unitPrice)}</p>
                          <p className={`text-xs ${itemErrors?.[item.productId] ? "text-rose-700" : "text-slate-500"}`}>
                            Stock now: {item.availableStock} {item.available ? "" : "(currently out of stock)"}
                          </p>
                          {itemErrors?.[item.productId] ? (
                            <p className="text-xs font-semibold text-rose-700">{itemErrors[item.productId]}</p>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                          disabled={isMutatingCart}
                          className="h-8 w-8 rounded-md border border-slate-300 text-sm"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={localQuantities[item.productId] ?? item.quantity}
                          onChange={(e) => {
                            const val = e.target.value;
                            setLocalQuantities((prev) => ({ ...prev, [item.productId]: val }));
                          }}
                          onBlur={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            updateQuantity(item.productId, Math.max(1, val));
                          }}
                          disabled={isMutatingCart}
                          className="h-8 w-20 rounded-md border border-slate-300 text-center text-sm font-semibold"
                        />
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          disabled={isMutatingCart || Number(item.quantity || 0) >= Number(item.availableStock || 0)}
                          className="h-8 w-8 rounded-md border border-slate-300 text-sm"
                          title={
                            Number(item.quantity || 0) >= Number(item.availableStock || 0)
                              ? "Stock limit reached"
                              : "Increase quantity"
                          }
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.productId)}
                          disabled={isMutatingCart}
                          className="h-8 rounded-md border border-rose-300 px-2 text-xs font-semibold text-rose-700"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">Your cart is empty.</p>
              )}
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Summary</h2>
              <div className="space-y-2 text-sm text-slate-700">
                <p>Items: {cart?.totalItems || 0}</p>
                <p>Subtotal: {formatMoney(cart?.subtotalAmount)}</p>
                <p>Shipping: {formatMoney(cart?.shippingFee)}</p>
                <p>Tax: {formatMoney(cart?.taxAmount)}</p>
                <p className="border-t border-slate-200 pt-2 text-base font-semibold text-slate-900">
                  Total: {formatMoney(cart?.totalAmount)}
                </p>
              </div>
              <div className="mt-4 grid gap-2">
                <button
                  type="button"
                  onClick={() => checkout(selectedProductIds)}
                  disabled={isMutatingCart || !selectedProductIds.length}
                  className="h-10 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Checkout Selected ({selectedProductIds.length})
                </button>
                <button
                  type="button"
                  onClick={clearCart}
                  disabled={isMutatingCart || !cart?.items?.length}
                  className="h-10 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 disabled:opacity-50"
                >
                  Clear Cart
                </button>
              </div>
            </article>
          </div>
        )}
      </section>
      <AppFooter />
    </main>
  );
};

export default ClientCartView;
