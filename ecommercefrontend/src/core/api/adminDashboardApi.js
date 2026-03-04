import ENDPOINTS from "../config/endpoints";
import apiClient from "./apiClient";

const adminDashboardApi = {
  getDashboard: () => apiClient.get(ENDPOINTS.ADMIN_DASHBOARD.ROOT),
};

export default adminDashboardApi;
