import ENDPOINTS from "../config/endpoints";
import apiClient from "./apiClient";

const paymentApi = {
  getAvailableGateways: () => apiClient.get("/payments/gateways"),
  getGatewaySettings: () => apiClient.get("/admin/payment-gateways"),
  updateGateway: (gateway, enabled) => apiClient.put(`/admin/payment-gateways/${gateway}`, { enabled }),
  createPayment: (gateway, orderId) => apiClient.post(`/payments/${gateway.toLowerCase()}/order`, { orderId }),
  verifyCashfreePayment: (data) => apiClient.post("/payments/cashfree/verify", data),
  checkRazorpayPayment: (data) => apiClient.post("/payments/razorpay/status", data),
  verifyRazorpayPayment: (data) => apiClient.post(ENDPOINTS.PAYMENTS.VERIFY_RAZORPAY, data),
  markRazorpayPaymentFailed: (data) => apiClient.post(ENDPOINTS.PAYMENTS.MARK_RAZORPAY_FAILED, data),
  getOrderPaymentDetails: (orderId) => apiClient.get(`${ENDPOINTS.PAYMENTS.ORDER_DETAILS}/${orderId}`),
};

export default paymentApi;
