import ENDPOINTS from "../config/endpoints";
import apiClient from "./apiClient";

const productApi = {
  getActiveProducts: (params) =>
    apiClient.get(ENDPOINTS.PRODUCTS.ACTIVE_LIST, { params }),
  getActiveCategoriesWithProducts: (params) =>
    apiClient.get(ENDPOINTS.PRODUCTS.ACTIVE_CATEGORIES_WITH_PRODUCTS, { params }),
  getAdminProducts: (params) =>
    apiClient.get(ENDPOINTS.PRODUCTS.ADMIN_LIST, { params }),
  getAdminCategoriesWithProducts: (params) =>
    apiClient.get(ENDPOINTS.PRODUCTS.ADMIN_CATEGORIES_WITH_PRODUCTS, { params }),
  createProduct: (data) =>
    apiClient.post(ENDPOINTS.PRODUCTS.CREATE, data),
};

export default productApi;
