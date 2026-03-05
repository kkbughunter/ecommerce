import ENDPOINTS from "../config/endpoints";
import apiClient from "./apiClient";

const mainBannerApi = {
  getActiveMainBanner: () => apiClient.get(ENDPOINTS.MAIN_BANNERS.ACTIVE),
  getActiveMainBanners: () => apiClient.get(ENDPOINTS.MAIN_BANNERS.ACTIVE_LIST),
  getAdminMainBanners: () => apiClient.get(ENDPOINTS.MAIN_BANNERS.ADMIN_ROOT),
  createMainBanner: (data) => apiClient.post(ENDPOINTS.MAIN_BANNERS.ADMIN_ROOT, data),
  updateMainBanner: (mainBannerId, data) =>
    apiClient.put(`${ENDPOINTS.MAIN_BANNERS.ADMIN_ROOT}/${mainBannerId}`, data),
  activateMainBanner: (mainBannerId) =>
    apiClient.patch(`${ENDPOINTS.MAIN_BANNERS.ADMIN_ROOT}/${mainBannerId}/activate`),
  deactivateMainBanner: (mainBannerId) =>
    apiClient.patch(`${ENDPOINTS.MAIN_BANNERS.ADMIN_ROOT}/${mainBannerId}/deactivate`),
};

export default mainBannerApi;
