import axios from "axios";
import { getAccessToken } from "../utils/authSession";

const apiService = axios.create({
  baseURL: String(import.meta.env.VITE_BASE_URL || "").trim(),
});

apiService.interceptors.request.use((config) => {
  const accessToken = getAccessToken();

  if (accessToken) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

export default apiService;
