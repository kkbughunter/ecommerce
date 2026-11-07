import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import StoreFooter from "../components/StoreFooter";
import ClientTopNav from "../components/ClientTopNav";
import useCart from "../hooks/useCart";
import usePaymentGateways from "../hooks/usePaymentGateways";
import PaymentGatewaySelector from "../components/PaymentGatewaySelector";
import ProductImage from "../components/ProductImage";
import StoreIcon from "../components/StoreIcon";

const formatMoney = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const ClientCartView = () => {
  const paymentOptions = usePaymentGateways();
  const navigate = useNavigate();
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
  const [excludedProductIds, setExcludedProductIds] = useState([]);
  const [localQuantities, setLocalQuantities] = useState({});
  const showAddressSetupError = (error || "")
    .toLowerCase()
    .includes(
      "please set default shipping and billing addresses in your profile",
    );
  const isInsufficientStockError = (error || "")
    .toLowerCase()
    .includes("insufficient stock for product");
  const showGlobalError =
    !!error && !showAddressSetupError && !isInsufficientStockError;

  const allProductIds = useMemo(
    () => (cart?.items || []).map((item) => item.productId).filter(Boolean),
    [cart?.items],
  );
  const selectedProductIds = allProductIds.filter(
    (id) => !excludedProductIds.includes(id),
  );
  const isAllSelected =
    allProductIds.length > 0 &&
    selectedProductIds.length === allProductIds.length;

  const changeQuantity = async (productId, quantity) => {
    await updateQuantity(productId, quantity);
    setLocalQuantities((previous) => {
      const next = { ...previous };
      delete next[productId];
      return next;
    });
  };

  return (
    <main className="storefront flex min-h-screen flex-col">
      <ClientTopNav title="Your Cart" cartCount={cart?.totalItems || 0} />

      <section
        id="main-content"
        tabIndex="-1"
        className="store-container store-page-content"
      >
        <div className="store-page-heading">
          <p className="store-eyebrow">YOUR VILLPO</p>
          <h1>Your project, in the bag.</h1>
          <p>Review your components and get ready for your next build.</p>
        </div>
        {showAddressSetupError ? (
          <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-4">
            <p className="text-base font-semibold text-amber-800">
              Please set default shipping and billing addresses in your profile
              before placing an order.
            </p>
            <p className="mt-1 text-sm text-amber-700">
              Update your address details in My Account, then return to
              checkout.
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
        {showGlobalError && (
          <p className="mb-3 text-sm text-red-600">{error}</p>
        )}
        {success && <p className="mb-3 text-sm text-emerald-600">{success}</p>}
        {isLoadingCart ? (
          <p className="text-sm text-slate-500">Loading cart...</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <article className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-slate-900">
                  Cart Items
                </h2>
                {!!allProductIds.length && (
                  <button
                    type="button"
                    onClick={() =>
                      setExcludedProductIds(isAllSelected ? allProductIds : [])
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
                      className={`store-cart-item ${
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
                            setExcludedProductIds((prev) =>
                              event.target.checked
                                ? prev.filter((id) => id !== item.productId)
                                : Array.from(
                                    new Set([...prev, item.productId]),
                                  ),
                            )
                          }
                          aria-label={`Select ${item.productName}`}
                          className="h-4 w-4 shrink-0 accent-emerald-700"
                        />
                        <Link
                          to={`/products/${item.productId}`}
                          className="store-cart-picture"
                          aria-label={`View ${item.productName}`}
                        >
                          <ProductImage
                            src={item.mediumImageUrl || item.thumbnailUrl}
                            alt={item.productName}
                          />
                        </Link>
                        <div>
                          <Link
                            to={`/products/${item.productId}`}
                            className="store-cart-name"
                            title={item.productName}
                          >
                            {item.productName}
                          </Link>
                          <p className="text-xs text-slate-500">
                            Unit: {formatMoney(item.unitPrice)}
                          </p>
                          <p
                            className={`text-xs ${itemErrors?.[item.productId] ? "text-rose-700" : "text-slate-500"}`}
                          >
                            Stock now: {item.availableStock}{" "}
                            {item.available ? "" : "(currently out of stock)"}
                          </p>
                          {itemErrors?.[item.productId] ? (
                            <p className="text-xs font-semibold text-rose-700">
                              {itemErrors[item.productId]}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
                        <button
                          type="button"
                          onClick={() =>
                            changeQuantity(
                              item.productId,
                              Math.max(1, item.quantity - 1),
                            )
                          }
                          disabled={isMutatingCart || item.quantity <= 1}
                          aria-label={`Decrease quantity of ${item.productName}`}
                          className="h-10 w-10 rounded-md border border-slate-300 text-sm"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          aria-label={`Quantity of ${item.productName}`}
                          min="1"
                          value={
                            localQuantities[item.productId] ?? item.quantity
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            setLocalQuantities((prev) => ({
                              ...prev,
                              [item.productId]: val,
                            }));
                          }}
                          onBlur={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            changeQuantity(item.productId, Math.max(1, val));
                          }}
                          disabled={isMutatingCart}
                          className="h-8 w-20 rounded-md border border-slate-300 text-center text-sm font-semibold"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            changeQuantity(item.productId, item.quantity + 1)
                          }
                          disabled={
                            isMutatingCart ||
                            Number(item.quantity || 0) >=
                              Number(item.availableStock || 0)
                          }
                          aria-label={`Increase quantity of ${item.productName}`}
                          className="h-10 w-10 rounded-md border border-slate-300 text-sm"
                          title={
                            Number(item.quantity || 0) >=
                            Number(item.availableStock || 0)
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
                <div className="store-empty">
                  <StoreIcon name="cart" />
                  <h3>Your next project starts here</h3>
                  <p>Add the components you need and we will keep them here.</p>
                  <Link to="/client#products" className="store-button">
                    Explore components <StoreIcon name="arrow" />
                  </Link>
                </div>
              )}
            </article>

            <article className="store-order-summary rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">
                Your cart summary
              </h2>
              <div className="space-y-2 text-sm text-slate-700">
                <p className="store-summary-row">
                  <span>Items</span>
                  <span>{cart?.totalItems || 0}</span>
                </p>
                <p className="store-summary-row">
                  <span>Subtotal</span>
                  <span>{formatMoney(cart?.subtotalAmount)}</span>
                </p>
                <p className="store-summary-row">
                  <span>Shipping</span>
                  <span>{formatMoney(cart?.shippingFee)}</span>
                </p>
                <p className="store-summary-row">
                  <span>Tax</span>
                  <span>{formatMoney(cart?.taxAmount)}</span>
                </p>
                <p className="store-summary-row border-t border-slate-200 pt-2 text-base font-semibold text-slate-900">
                  <span>Cart total</span>
                  <span>{formatMoney(cart?.totalAmount)}</span>
                </p>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Summary shows the full cart. The final amount for selected items
                is confirmed at checkout.
              </p>
              <PaymentGatewaySelector {...paymentOptions} disabled={isMutatingCart} />
              <div className="mt-4 grid gap-2">
                <button
                  type="button"
                  onClick={() => checkout(selectedProductIds, paymentOptions.selectedGateway)}
                  disabled={isMutatingCart || !selectedProductIds.length || !paymentOptions.selectedGateway}
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
      <StoreFooter />
    </main>
  );
};

export default ClientCartView;
