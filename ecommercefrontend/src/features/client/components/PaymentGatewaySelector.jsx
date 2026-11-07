export default function PaymentGatewaySelector({ gateways, selectedGateway, setSelectedGateway, loading, error, disabled = false }) {
  return <fieldset disabled={disabled || loading} className="my-4 space-y-2">
    <legend className="text-sm font-semibold text-slate-900">Choose payment gateway</legend>
    {loading ? <p className="text-sm text-slate-500">Loading payment options...</p>
      : error ? <p role="alert" className="text-sm text-red-600">{error}</p>
      : !gateways.length ? <p className="text-sm text-amber-700">Online payments are currently unavailable. Please try again later.</p>
      : gateways.map((gateway) => <label key={gateway} className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm">
        <input type="radio" name="payment-gateway" value={gateway} checked={selectedGateway === gateway} onChange={() => setSelectedGateway(gateway)} />
        {gateway === "CASHFREE" ? "Cashfree" : "Razorpay"}
      </label>)}
  </fieldset>;
}
