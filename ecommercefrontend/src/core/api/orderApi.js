import ENDPOINTS from "../config/endpoints";
import apiClient from "./apiClient";

const orderApi = {
  getMyOrders: () => apiClient.get(ENDPOINTS.ORDERS.ROOT),
  getOrderDetails: (orderId) => apiClient.get(`${ENDPOINTS.ORDERS.DETAILS}/${orderId}`),
  getOrderTracking: (orderId) => apiClient.get(`${ENDPOINTS.ORDERS.TRACKING}/${orderId}/tracking`),
  getAdminOrders: ({ page = 0, size = 20 } = {}) =>
    apiClient.get(ENDPOINTS.ORDERS.ADMIN_LIST, {
      params: { page, size },
    }),
  updateAdminOrderStatus: (orderId, data) =>
    apiClient.patch(`${ENDPOINTS.ORDERS.ADMIN_UPDATE_STATUS}/${orderId}/status`, data),
};

export default orderApi;
