import ENDPOINTS from "../../config/endPoints";
import apiService from "./apiService";

const coreApi = {
  auth: {
    login: (data) => apiService.post(ENDPOINTS.AUTH.LOGIN, data),
    refreshToken: (data) => apiService.post(ENDPOINTS.AUTH.REFRESH_TOKEN, data),
    logout: (data) => apiService.post(ENDPOINTS.AUTH.LOGOUT, data),
  },
  products: {
    getActiveProducts: (params) => apiService.get(ENDPOINTS.PRODUCTS.ACTIVE_LIST, { params }),
  },
  cart: {
    getCart: () => apiService.get(ENDPOINTS.CART.DETAILS),
    addCartItem: (data) => apiService.post(ENDPOINTS.CART.ADD_ITEM, data),
    updateCartItem: (productId, data) => apiService.patch(ENDPOINTS.CART.UPDATE_ITEM(productId), data),
    removeCartItem: (productId) => apiService.delete(ENDPOINTS.CART.REMOVE_ITEM(productId)),
    clearCart: () => apiService.delete(ENDPOINTS.CART.CLEAR),
    checkout: () => apiService.post(ENDPOINTS.CART.CHECKOUT),
  },
  customer: {
    getMe: () => apiService.get(ENDPOINTS.CUSTOMER.ME),
    updateMe: (data) => apiService.put(ENDPOINTS.CUSTOMER.ME, data),
  },
  payment: {
    createRazorpayOrder: (data) => apiService.post(ENDPOINTS.PAYMENT.CREATE_RAZORPAY_ORDER, data),
    verifyRazorpayPayment: (data) => apiService.post(ENDPOINTS.PAYMENT.VERIFY_RAZORPAY_PAYMENT, data),
    markRazorpayFailure: (data) => apiService.post(ENDPOINTS.PAYMENT.MARK_RAZORPAY_FAILURE, data),
    getOrderPaymentDetails: (orderId) => apiService.get(ENDPOINTS.PAYMENT.ORDER_PAYMENT_DETAILS(orderId)),
  },
};

export default coreApi;
