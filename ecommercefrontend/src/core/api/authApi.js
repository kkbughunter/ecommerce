import ENDPOINTS from "../config/endpoints";
import apiClient from "./apiClient";

const authApi = {
  googleConfig: () => apiClient.post("/auth/google/config", {}, { withCredentials: true }),
  googleLogin: (credential) => apiClient.post("/auth/google/login", { credential }, { withCredentials: true }),
  login: (data) => apiClient.post(ENDPOINTS.AUTH.LOGIN, data),
  register: (data) => apiClient.post(ENDPOINTS.AUTH.REGISTER, data),
  verifyOtp: (data) => apiClient.post(ENDPOINTS.AUTH.VERIFY_OTP, data),
  resendOtp: (data) => apiClient.post(ENDPOINTS.AUTH.RESEND_OTP, data),
};

export default authApi;
