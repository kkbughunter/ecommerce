import ENDPOINTS from "../config/endpoints";
import apiClient from "./apiClient";

const authApi = {
  login: (data) => apiClient.post(ENDPOINTS.AUTH.LOGIN, data),
  register: (data) => apiClient.post(ENDPOINTS.AUTH.REGISTER, data),
  verifyOtp: (data) => apiClient.post(ENDPOINTS.AUTH.VERIFY_OTP, data),
  resendOtp: (data) => apiClient.post(ENDPOINTS.AUTH.RESEND_OTP, data),
};

export default authApi;
