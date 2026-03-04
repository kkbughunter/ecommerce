import axios from "axios";
import ENV from "../config/env";
import { getAccessToken } from "../auth/session";

const apiClient = axios.create({
  baseURL: ENV.API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const accessToken = getAccessToken();

  if (accessToken) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

export default apiClient;
