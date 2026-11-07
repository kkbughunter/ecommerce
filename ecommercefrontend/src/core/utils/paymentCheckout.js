import paymentApi from "../api/paymentApi";

const scripts = new Map();
const loadSdk = (name, url) => {
  if (window[name]) return Promise.resolve();
  if (scripts.has(name)) return scripts.get(name);
  const promise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const timer = setTimeout(() => fail(), 20000);
    const fail = () => {
      clearTimeout(timer);
      script.remove();
      scripts.delete(name);
      reject(new Error(`Unable to load ${name} checkout. Please try again.`));
    };
    script.src = url;
    script.async = true;
    script.onload = () => {
      clearTimeout(timer);
      if (window[name]) resolve();
      else fail();
    };
    script.onerror = fail;
    document.body.appendChild(script);
  });
  scripts.set(name, promise);
  return promise;
};

export const completePayment = async (order, payment) => {
  if (["SUCCESS", "PAID", "CAPTURED"].includes(payment?.status)) return;
  if (payment?.gateway === "CASHFREE") {
    await loadSdk("Cashfree", "https://sdk.cashfree.com/js/v3/cashfree.js");
    await window.Cashfree({ mode: payment.mode }).checkout({
      paymentSessionId: payment.paymentSessionId,
      redirectTarget: "_modal",
    });
    const response = await paymentApi.verifyCashfreePayment({ orderId: order.orderId, gatewayOrderId: payment.gatewayOrderId });
    if (!response?.data?.data?.paid) {
      throw new Error("Payment has not been confirmed. Check its status in My Orders before retrying.");
    }
    return;
  }
  if (!payment?.razorpayOrderId || !payment?.razorpayKeyId) throw new Error("Payment session is unavailable.");
  await loadSdk("Razorpay", "https://checkout.razorpay.com/v1/checkout.js");
  const result = await new Promise((resolve) => {
    const checkout = new window.Razorpay({
      key: payment.razorpayKeyId,
      amount: payment.amountInSubunits,
      currency: payment.currency,
      name: "AstraVal",
      description: `Payment for ${order.orderNumber}`,
      order_id: payment.razorpayOrderId,
      handler: (payload) => resolve({ payload }),
      modal: { ondismiss: () => resolve({ cancelled: true }) },
      theme: { color: "#2563eb" },
    });
    // Razorpay handles failures within the same session; wait for success or dismissal.
    checkout.open();
  });
  if (result.cancelled) throw new Error("Payment window closed. Check your payment status in My Orders.");
  await paymentApi.verifyRazorpayPayment({
    orderId: order.orderId,
    razorpayOrderId: result.payload.razorpay_order_id,
    razorpayPaymentId: result.payload.razorpay_payment_id,
    razorpaySignature: result.payload.razorpay_signature,
  });
};
