import ENDPOINTS from "../config/endpoints";
import apiClient from "./apiClient";

const authApi = {
  login: (data) => apiClient.post(ENDPOINTS.AUTH.LOGIN, data),
};

export default authApi;
