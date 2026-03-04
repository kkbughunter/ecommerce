const ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    VERIFY_OTP: "/auth/verify-otp",
    RESEND_OTP: "/auth/resend-otp",
  },
  CATEGORIES: {
    LIST: "/categories",
  },
  PRODUCTS: {
    ACTIVE_LIST: "/products/active",
    ACTIVE_CATEGORIES_WITH_PRODUCTS: "/categories/active/products",
    ADMIN_LIST: "/products",
    CREATE: "/products",
    ADMIN_CATEGORIES_WITH_PRODUCTS: "/admin/categories/products",
  },
};

export default ENDPOINTS;
