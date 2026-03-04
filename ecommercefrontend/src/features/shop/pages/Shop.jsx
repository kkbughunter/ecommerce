import useShopFlow from '../hooks/useShopFlow';

const formatCurrency = (amount, currency = 'INR') => {
  const numericAmount = Number(amount || 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(numericAmount);
};

const Field = ({
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
}) => (
  <label className="space-y-1">
    <span className="text-xs font-semibold uppercase tracking-[0.08em] text-violet-700">
      {label}
    </span>
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="h-10 w-full rounded-lg border border-violet-100 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
    />
  </label>
);

const AddressSection = ({
  title,
  data,
  onFieldChange,
}) => (
  <div className="space-y-3 rounded-xl border border-violet-100 bg-violet-50/40 p-3">
    <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
    <div className="grid gap-3 md:grid-cols-2">
      <Field
        label="Full Name"
        value={data.fullName}
        onChange={(value) => onFieldChange('fullName', value)}
      />
      <Field
        label="Phone Number"
        value={data.phoneNumber}
        onChange={(value) => onFieldChange('phoneNumber', value)}
      />
      <Field
        label="Line 1"
        value={data.line1}
        onChange={(value) => onFieldChange('line1', value)}
      />
      <Field
        label="Line 2"
        value={data.line2}
        onChange={(value) => onFieldChange('line2', value)}
      />
      <Field
        label="Landmark"
        value={data.landmark}
        onChange={(value) => onFieldChange('landmark', value)}
      />
      <Field
        label="City"
        value={data.city}
        onChange={(value) => onFieldChange('city', value)}
      />
      <Field
        label="District"
        value={data.district}
        onChange={(value) => onFieldChange('district', value)}
      />
      <Field
        label="State"
        value={data.state}
        onChange={(value) => onFieldChange('state', value)}
      />
      <Field
        label="Country"
        value={data.country}
        onChange={(value) => onFieldChange('country', value)}
      />
      <Field
        label="Postal Code"
        value={data.postalCode}
        onChange={(value) => onFieldChange('postalCode', value)}
      />
    </div>
  </div>
);

const SummaryRow = ({
  label,
  value,
  isTotal = false,
}) => (
  <div className={`flex items-center justify-between ${isTotal ? 'text-base font-semibold text-slate-900' : 'text-sm text-slate-600'}`}>
    <span>{label}</span>
    <span>{value}</span>
  </div>
);

const Shop = () => {
  const {
    products,
    cart,
    customerProfile,
    profileForm,
    latestOrder,
    paymentDetails,
    isBootstrapping,
    isProductsLoading,
    isCartLoading,
    isProfileLoading,
    isProfileSaving,
    isCheckoutInProgress,
    activeProductId,
    activeCartProductId,
    isPaymentDetailsLoading,
    errorMessage,
    successMessage,
    fetchProducts,
    addToCart,
    updateCartQuantity,
    removeCartItem,
    clearCart,
    handleProfileFieldChange,
    handleAddressFieldChange,
    copyBillingToShipping,
    saveProfile,
    checkoutAndPay,
    refreshPaymentDetails,
    logout,
  } = useShopFlow();

  if (isBootstrapping) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_10%_10%,#ede9fe_0%,#e2e8f0_45%,#f8fafc_100%)] p-4">
        <div className="rounded-2xl border border-violet-100 bg-white px-8 py-6 text-sm font-medium text-slate-600 shadow-lg">
          Loading storefront...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_15%_15%,#ede9fe_0%,#e2e8f0_45%,#f8fafc_100%)] p-4 md:p-6">
      <section className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-2xl border border-violet-100 bg-white/90 p-5 shadow-lg backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-700">
                Logged In Experience
              </p>
              <h1 className="text-2xl font-serif text-slate-900 md:text-3xl">
                Shop, Checkout, and Pay
              </h1>
              <p className="text-sm text-slate-600">
                Complete backend flow from cart checkout to Razorpay verification.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={fetchProducts}
                className="h-10 rounded-lg border border-violet-200 px-4 text-sm font-semibold text-violet-700 transition hover:bg-violet-50"
              >
                Refresh Products
              </button>
              <button
                type="button"
                onClick={logout}
                className="h-10 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {errorMessage && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <section className="space-y-4 rounded-2xl border border-violet-100 bg-white p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Active Products</h2>
              {isProductsLoading && <span className="text-xs text-slate-500">Refreshing...</span>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {products.map((product) => {
                const isAdding = activeProductId === product.productId;
                const outOfStock = (product.stockQuantity || 0) < 1;

                return (
                  <article
                    key={product.productId}
                    className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="space-y-1">
                      <h3 className="text-base font-semibold text-slate-900">{product.name}</h3>
                      <p className="text-sm text-slate-600">
                        {product.description || 'No description available.'}
                      </p>
                    </div>

                    <div className="space-y-1 text-sm text-slate-600">
                      <p>{formatCurrency(product.price, 'INR')}</p>
                      <p>Stock: {product.stockQuantity}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => addToCart(product.productId)}
                      disabled={isAdding || outOfStock}
                      className="h-10 w-full rounded-lg bg-gradient-to-r from-violet-500 to-blue-600 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isAdding ? 'Adding...' : outOfStock ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                  </article>
                );
              })}
            </div>

            {!products.length && !isProductsLoading && (
              <p className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                No active products found.
              </p>
            )}
          </section>

          <aside className="space-y-6">
            <section className="space-y-4 rounded-2xl border border-violet-100 bg-white p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Profile Setup</h2>
                  <p className="text-xs text-slate-500">
                    Required before cart checkout.
                  </p>
                </div>
                {customerProfile?.customerId && (
                  <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                    Customer #{customerProfile.customerId}
                  </span>
                )}
              </div>

              {isProfileLoading ? (
                <p className="text-sm text-slate-500">Loading profile...</p>
              ) : (
                <div className="space-y-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field
                      label="First Name"
                      value={profileForm.firstName}
                      onChange={(value) => handleProfileFieldChange('firstName', value)}
                    />
                    <Field
                      label="Last Name"
                      value={profileForm.lastName}
                      onChange={(value) => handleProfileFieldChange('lastName', value)}
                    />
                    <Field
                      label="Gender"
                      value={profileForm.gender}
                      onChange={(value) => handleProfileFieldChange('gender', value)}
                    />
                    <Field
                      label="Date of Birth"
                      type="date"
                      value={profileForm.dateOfBirth || ''}
                      onChange={(value) => handleProfileFieldChange('dateOfBirth', value)}
                    />
                  </div>

                  <AddressSection
                    title="Billing Address"
                    data={profileForm.billingAddress}
                    onFieldChange={(field, value) => handleAddressFieldChange('billingAddress', field, value)}
                  />

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={copyBillingToShipping}
                      className="h-9 rounded-lg border border-violet-200 px-3 text-xs font-semibold text-violet-700 transition hover:bg-violet-50"
                    >
                      Copy Billing To Shipping
                    </button>
                  </div>

                  <AddressSection
                    title="Shipping Address"
                    data={profileForm.shippingAddress}
                    onFieldChange={(field, value) => handleAddressFieldChange('shippingAddress', field, value)}
                  />

                  <button
                    type="button"
                    onClick={saveProfile}
                    disabled={isProfileSaving}
                    className="h-10 w-full rounded-lg bg-gradient-to-r from-violet-500 to-blue-600 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isProfileSaving ? 'Saving Profile...' : 'Save Profile'}
                  </button>
                </div>
              )}
            </section>

            <section className="space-y-4 rounded-2xl border border-violet-100 bg-white p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Cart</h2>
                {!!cart?.items?.length && (
                  <button
                    type="button"
                    onClick={clearCart}
                    className="text-xs font-semibold text-rose-600 transition hover:text-rose-700"
                  >
                    Clear Cart
                  </button>
                )}
              </div>

              {isCartLoading ? (
                <p className="text-sm text-slate-500">Loading cart...</p>
              ) : cart?.items?.length ? (
                <div className="space-y-3">
                  {cart.items.map((item) => {
                    const isMutatingItem = activeCartProductId === item.productId;
                    return (
                      <article
                        key={item.productId}
                        className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="text-sm font-semibold text-slate-900">{item.productName}</h3>
                            <p className="text-xs text-slate-600">
                              {formatCurrency(item.unitPrice, cart.currency)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeCartItem(item.productId)}
                            disabled={isMutatingItem}
                            className="text-xs font-semibold text-rose-600 transition hover:text-rose-700 disabled:opacity-60"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="inline-flex items-center rounded-lg border border-violet-200 bg-white">
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
                              disabled={isMutatingItem || item.quantity <= 1}
                              className="h-8 w-8 text-violet-700 disabled:opacity-50"
                            >
                              -
                            </button>
                            <span className="w-8 text-center text-sm font-medium text-slate-800">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                              disabled={isMutatingItem || item.quantity >= (item.availableStock || 0)}
                              className="h-8 w-8 text-violet-700 disabled:opacity-50"
                            >
                              +
                            </button>
                          </div>

                          <p className="text-sm font-semibold text-slate-900">
                            {formatCurrency(item.lineTotal, cart.currency)}
                          </p>
                        </div>
                      </article>
                    );
                  })}

                  <div className="space-y-2 rounded-xl border border-violet-100 bg-violet-50/40 p-3">
                    <SummaryRow
                      label="Subtotal"
                      value={formatCurrency(cart.subtotalAmount, cart.currency)}
                    />
                    <SummaryRow
                      label="Tax"
                      value={formatCurrency(cart.taxAmount, cart.currency)}
                    />
                    <SummaryRow
                      label="Shipping"
                      value={formatCurrency(cart.shippingFee, cart.currency)}
                    />
                    <SummaryRow
                      label="Total"
                      value={formatCurrency(cart.totalAmount, cart.currency)}
                      isTotal
                    />
                  </div>

                  <button
                    type="button"
                    onClick={checkoutAndPay}
                    disabled={isCheckoutInProgress}
                    className="h-11 w-full rounded-lg bg-gradient-to-r from-violet-500 to-blue-600 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isCheckoutInProgress ? 'Processing Checkout...' : 'Checkout & Pay'}
                  </button>
                </div>
              ) : (
                <p className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                  Your cart is empty.
                </p>
              )}
            </section>

            <section className="space-y-4 rounded-2xl border border-violet-100 bg-white p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Order Payment Status</h2>
                {latestOrder?.orderId && (
                  <button
                    type="button"
                    onClick={() => refreshPaymentDetails(latestOrder.orderId)}
                    disabled={isPaymentDetailsLoading}
                    className="text-xs font-semibold text-violet-700 transition hover:text-violet-800 disabled:opacity-60"
                  >
                    {isPaymentDetailsLoading ? 'Refreshing...' : 'Refresh'}
                  </button>
                )}
              </div>

              {latestOrder ? (
                <div className="space-y-2 rounded-xl border border-violet-100 bg-violet-50/40 p-3 text-sm text-slate-700">
                  <p>
                    <span className="font-semibold">Order:</span> {latestOrder.orderNumber}
                  </p>
                  <p>
                    <span className="font-semibold">Order Status:</span> {latestOrder.status}
                  </p>
                  <p>
                    <span className="font-semibold">Payment Status:</span> {latestOrder.paymentStatus}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-slate-500">No checkout created yet in this session.</p>
              )}

              {paymentDetails?.attempts?.length ? (
                <div className="space-y-3">
                  {paymentDetails.attempts.map((attempt) => (
                    <article
                      key={attempt.paymentTransactionId}
                      className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-900">
                          Attempt #{attempt.attemptNumber}
                        </p>
                        <p className="rounded-full bg-violet-100 px-2 py-1 text-xs font-semibold text-violet-700">
                          {attempt.status}
                        </p>
                      </div>
                      <p className="text-xs text-slate-600">
                        Razorpay Order ID: {attempt.razorpayOrderId}
                      </p>
                      {attempt.razorpayPaymentId && (
                        <p className="text-xs text-slate-600">
                          Razorpay Payment ID: {attempt.razorpayPaymentId}
                        </p>
                      )}
                      {!!attempt.events?.length && (
                        <div className="space-y-1 rounded-lg border border-violet-100 bg-white p-2">
                          {attempt.events.map((event) => (
                            <p
                              key={event.paymentStatusTrackingId}
                              className="text-xs text-slate-600"
                            >
                              {event.newStatus} ({event.eventSource}) - {event.note}
                            </p>
                          ))}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  Payment attempts will appear here after checkout.
                </p>
              )}
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
};

export default Shop;
