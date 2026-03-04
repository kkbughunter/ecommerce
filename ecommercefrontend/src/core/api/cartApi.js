import ENDPOINTS from "../config/endpoints";
import apiClient from "./apiClient";

const cartApi = {
  getMyCart: () => apiClient.get(ENDPOINTS.CART.ROOT),
  addItem: (data) => apiClient.post(ENDPOINTS.CART.ITEMS, data),
  updateItemQuantity: (productId, data) =>
    apiClient.patch(`${ENDPOINTS.CART.ITEMS}/${productId}`, data),
  removeItem: (productId) => apiClient.delete(`${ENDPOINTS.CART.ITEMS}/${productId}`),
  clearCart: () => apiClient.delete(ENDPOINTS.CART.ROOT),
  checkout: (data) => apiClient.post(ENDPOINTS.CART.CHECKOUT, data),
};

export default cartApi;
