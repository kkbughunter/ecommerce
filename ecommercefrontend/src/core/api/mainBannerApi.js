import ENDPOINTS from "../config/endpoints";
import apiClient from "./apiClient";
import singleImageRequest from "./singleImageRequest";

const mainBannerApi = {
  getActiveMainBanner: () => apiClient.get(ENDPOINTS.MAIN_BANNERS.ACTIVE),
  getActiveMainBanners: () => apiClient.get(ENDPOINTS.MAIN_BANNERS.ACTIVE_LIST),
  getAdminMainBanners: () => apiClient.get(ENDPOINTS.MAIN_BANNERS.ADMIN_ROOT),
  createMainBanner: (data, file) => apiClient.post(ENDPOINTS.MAIN_BANNERS.ADMIN_ROOT, singleImageRequest(data, file)),
  updateMainBanner: (mainBannerId, data, file) =>
    apiClient.put(`${ENDPOINTS.MAIN_BANNERS.ADMIN_ROOT}/${mainBannerId}`, singleImageRequest(data, file)),
  activateMainBanner: (mainBannerId) =>
    apiClient.patch(`${ENDPOINTS.MAIN_BANNERS.ADMIN_ROOT}/${mainBannerId}/activate`),
  deactivateMainBanner: (mainBannerId) =>
    apiClient.patch(`${ENDPOINTS.MAIN_BANNERS.ADMIN_ROOT}/${mainBannerId}/deactivate`),
  deleteMainBanner: (id) => apiClient.delete(`${ENDPOINTS.MAIN_BANNERS.ADMIN_ROOT}/${id}`),
};

export default mainBannerApi;
