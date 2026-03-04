import ENDPOINTS from "../config/endpoints";
import apiClient from "./apiClient";

const customerApi = {
  getCustomers: () => apiClient.get(ENDPOINTS.CUSTOMERS.LIST),
  getCustomerById: (customerId) => apiClient.get(`${ENDPOINTS.CUSTOMERS.DETAILS}/${customerId}`),
  activateCustomer: (customerId) => apiClient.patch(`${ENDPOINTS.CUSTOMERS.ACTIVATE}/${customerId}/activate`),
  deactivateCustomer: (customerId) => apiClient.patch(`${ENDPOINTS.CUSTOMERS.DEACTIVATE}/${customerId}/deactivate`),
  getMyProfile: () => apiClient.get(ENDPOINTS.CUSTOMERS.ME),
  updateMyProfile: (data) => apiClient.put(ENDPOINTS.CUSTOMERS.ME, data),
};

export default customerApi;
