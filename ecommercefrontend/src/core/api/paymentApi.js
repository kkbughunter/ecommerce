import ENDPOINTS from "../config/endpoints";
import apiClient from "./apiClient";

const paymentApi = {
  verifyRazorpayPayment: (data) => apiClient.post(ENDPOINTS.PAYMENTS.VERIFY_RAZORPAY, data),
  markRazorpayPaymentFailed: (data) => apiClient.post(ENDPOINTS.PAYMENTS.MARK_RAZORPAY_FAILED, data),
  getOrderPaymentDetails: (orderId) => apiClient.get(`${ENDPOINTS.PAYMENTS.ORDER_DETAILS}/${orderId}`),
};

export default paymentApi;
