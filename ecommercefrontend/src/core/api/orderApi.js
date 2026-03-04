import ENDPOINTS from "../config/endpoints";
import apiClient from "./apiClient";

const orderApi = {
  getMyOrders: () => apiClient.get(ENDPOINTS.ORDERS.ROOT),
  getOrderDetails: (orderId) => apiClient.get(`${ENDPOINTS.ORDERS.DETAILS}/${orderId}`),
  getOrderTracking: (orderId) => apiClient.get(`${ENDPOINTS.ORDERS.TRACKING}/${orderId}/tracking`),
  getAdminOrders: async ({ page = 0, size = 20 } = {}) => {
    try {
      return await apiClient.get(ENDPOINTS.ORDERS.ADMIN_LIST, {
        params: { page, size },
      });
    } catch (err) {
      if (err?.response?.status !== 404) {
        throw err;
      }
      return apiClient.get("/orders/admin", {
        params: { page, size },
      });
    }
  },
  updateAdminOrderStatus: async (orderId, data) => {
    try {
      return await apiClient.patch(`${ENDPOINTS.ORDERS.ADMIN_UPDATE_STATUS}/${orderId}/status`, data);
    } catch (err) {
      if (err?.response?.status !== 404) {
        throw err;
      }
      return apiClient.patch(`/orders/admin/${orderId}/status`, data);
    }
  },
};

export default orderApi;
