import ENDPOINTS from "../config/endpoints";
import apiClient from "./apiClient";

const paymentApi = {
  verifyRazorpayPayment: (data) => apiClient.post(ENDPOINTS.PAYMENTS.VERIFY_RAZORPAY, data),
  markRazorpayPaymentFailed: (data) => apiClient.post(ENDPOINTS.PAYMENTS.MARK_RAZORPAY_FAILED, data),
};

export default paymentApi;
