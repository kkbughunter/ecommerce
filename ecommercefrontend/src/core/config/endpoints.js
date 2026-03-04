const ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    VERIFY_OTP: "/auth/verify-otp",
    RESEND_OTP: "/auth/resend-otp",
  },
  CATEGORIES: {
    LIST: "/categories",
    CREATE: "/categories",
  },
  PRODUCTS: {
    ACTIVE_LIST: "/products/active",
    ACTIVE_CATEGORIES_WITH_PRODUCTS: "/categories/active/products",
    ADMIN_LIST: "/products",
    CREATE: "/products",
    UPDATE: "/products",
    DETAILS: "/products",
    IMAGES: "/products",
    ADMIN_CATEGORIES_WITH_PRODUCTS: "/admin/categories/products",
  },
  ORDERS: {
    ROOT: "/orders",
    DETAILS: "/orders",
    TRACKING: "/orders",
    ADMIN_LIST: "/admin/orders",
    ADMIN_UPDATE_STATUS: "/admin/orders",
  },
  ADMIN_DASHBOARD: {
    ROOT: "/admin/dashboard",
  },
  CART: {
    ROOT: "/cart",
    ITEMS: "/cart/items",
    CHECKOUT: "/cart/checkout",
  },
  PAYMENTS: {
    CREATE_RAZORPAY_ORDER: "/payments/razorpay/order",
    VERIFY_RAZORPAY: "/payments/razorpay/verify",
    MARK_RAZORPAY_FAILED: "/payments/razorpay/failure",
    ORDER_DETAILS: "/payments/orders",
  },
  CUSTOMERS: {
    LIST: "/customers",
    DETAILS: "/customers",
    ACTIVATE: "/customers",
    DEACTIVATE: "/customers",
    ME: "/customers/me",
  },
};

export default ENDPOINTS;
