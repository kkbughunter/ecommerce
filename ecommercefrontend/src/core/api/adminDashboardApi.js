import ENDPOINTS from "../config/endpoints";
import apiClient from "./apiClient";

const adminDashboardApi = {
  getDashboard: () => apiClient.get(ENDPOINTS.ADMIN_DASHBOARD.ROOT),
  getReports: (params) => apiClient.get(ENDPOINTS.ADMIN_REPORTS.ROOT, { params }),
};

export default adminDashboardApi;
