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
  updateProduct: (productId, data) =>
    apiClient.put(`${ENDPOINTS.PRODUCTS.UPDATE}/${productId}`, data),
  getProductDetails: (productId) =>
    apiClient.get(`${ENDPOINTS.PRODUCTS.DETAILS}/${productId}/details`),
  getActiveProductsByCategory: (categoryId, params) =>
    apiClient.get(`${ENDPOINTS.PRODUCTS.DETAILS}/category/${categoryId}/active`, { params }),
  uploadProductImages: (productId, files) => {
    const formData = new FormData();
    Array.from(files || []).forEach((file) => formData.append("files", file));
    return apiClient.post(`${ENDPOINTS.PRODUCTS.IMAGES}/${productId}/images`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};

export default productApi;
