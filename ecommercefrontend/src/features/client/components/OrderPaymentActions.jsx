import { useState } from "react";
import paymentApi from "../../../core/api/paymentApi";
import { completePayment } from "../../../core/utils/paymentCheckout";
import getApiErrorMessage from "../../../core/utils/apiError";
import usePaymentGateways from "../hooks/usePaymentGateways";
import PaymentGatewaySelector from "./PaymentGatewaySelector";

export default function OrderPaymentActions({ order, onUpdated }) {
  const options = usePaymentGateways();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const canPay = !["PAID", "REFUNDED"].includes(order.paymentStatus)
    && !["CANCELLED", "RETURNED"].includes(order.status);
  const checkStatus = async () => {
    const response = await paymentApi.getOrderPaymentDetails(order.orderId);
    const details = response?.data?.data;
    if (details?.paymentStatus === "PAID") return true;
    for (const attempt of details?.attempts || []) {
      if (attempt.status === "REFUNDED") continue;
      const request = {
        orderId: order.orderId, gatewayOrderId: attempt.razorpayOrderId,
      };
      const result = attempt.gateway === "CASHFREE"
        ? await paymentApi.verifyCashfreePayment(request) : await paymentApi.checkRazorpayPayment(request);
      if (result?.data?.data?.paid || ["SUCCESS", "PAID", "CAPTURED"].includes(result?.data?.data?.status)) return true;
    }
    return false;
  };
  const run = async (pay) => {
    setBusy(true); setMessage("");
    try {
      if (await checkStatus()) setMessage("Payment confirmed.");
      else if (pay) {
        const response = await paymentApi.createPayment(options.selectedGateway, order.orderId);
        await completePayment(order, response?.data?.data);
        setMessage("Payment completed successfully.");
      } else setMessage("Payment has not been confirmed yet. If you were charged, please wait before retrying.");
    } catch (err) { setMessage(getApiErrorMessage(err, "Unable to complete payment.")); }
    finally {
      try { await onUpdated(); }
      catch (err) { setMessage(getApiErrorMessage(err, "Unable to refresh your order. Please reload.")); }
      setBusy(false);
    }
  };
  return <div className="mt-4">
    <p className="text-sm font-semibold">Payment status: {order.paymentStatus}</p>
    {canPay && <>
      <PaymentGatewaySelector {...options} disabled={busy} />
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy || !options.selectedGateway} onClick={() => run(true)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Please wait..." : "Pay now"}</button>
        <button type="button" disabled={busy} onClick={() => run(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm disabled:opacity-50">Check payment status</button>
      </div>
    </>}
    {message && <p role="status" className="mt-3 text-sm text-slate-700">{message}</p>}
  </div>;
}
