const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REFRESH_TOKEN: '/auth/refresh-token',
    LOGOUT: '/auth/logout',
  },
  PRODUCTS: {
    ACTIVE_LIST: '/products/active',
  },
  CART: {
    DETAILS: '/cart',
    ADD_ITEM: '/cart/items',
    UPDATE_ITEM: (productId) => `/cart/items/${productId}`,
    REMOVE_ITEM: (productId) => `/cart/items/${productId}`,
    CLEAR: '/cart',
    CHECKOUT: '/cart/checkout',
  },
  CUSTOMER: {
    ME: '/customers/me',
  },
  PAYMENT: {
    CREATE_RAZORPAY_ORDER: '/payments/razorpay/order',
    VERIFY_RAZORPAY_PAYMENT: '/payments/razorpay/verify',
    MARK_RAZORPAY_FAILURE: '/payments/razorpay/failure',
    ORDER_PAYMENT_DETAILS: (orderId) => `/payments/orders/${orderId}`,
  },
};

export default ENDPOINTS;
