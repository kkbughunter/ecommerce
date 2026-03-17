import apiClient from '../../core/api/apiClient';
import cartApi from '../../core/api/cartApi';
import customerApi from '../../core/api/customerApi';
import paymentApi from '../../core/api/paymentApi';
import productApi from '../../core/api/productApi';
import ENDPOINTS from '../../core/config/endpoints';

const coreApi = {
  products: {
    getActiveProducts: (params) => productApi.getActiveProducts(params),
  },
  cart: {
    getCart: () => cartApi.getMyCart(),
    addCartItem: (data) => cartApi.addItem(data),
    updateCartItem: (productId, data) => cartApi.updateItemQuantity(productId, data),
    removeCartItem: (productId) => cartApi.removeItem(productId),
    clearCart: () => cartApi.clearCart(),
    checkout: () => cartApi.checkout(),
  },
  customer: {
    getMe: () => customerApi.getMyProfile(),
    updateMe: (data) => customerApi.updateMyProfile(data),
  },
  payment: {
    createRazorpayOrder: (data) => apiClient.post(ENDPOINTS.PAYMENTS.CREATE_RAZORPAY_ORDER, data),
    verifyRazorpayPayment: (data) => paymentApi.verifyRazorpayPayment(data),
    markRazorpayFailure: (data) => paymentApi.markRazorpayPaymentFailed(data),
    getOrderPaymentDetails: (orderId) => paymentApi.getOrderPaymentDetails(orderId),
  },
  auth: {
    logout: (data) => apiClient.post('/auth/logout', data),
  },
};

export default coreApi;
