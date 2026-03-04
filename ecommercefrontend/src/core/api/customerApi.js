import ENDPOINTS from "../config/endpoints";
import apiClient from "./apiClient";

const customerApi = {
  getMyProfile: () => apiClient.get(ENDPOINTS.CUSTOMERS.ME),
  updateMyProfile: (data) => apiClient.put(ENDPOINTS.CUSTOMERS.ME, data),
};

export default customerApi;
