import ENDPOINTS from "../config/endpoints";
import apiClient from "./apiClient";

const homeSliderApi = {
  getActiveSliders: (params) => apiClient.get(ENDPOINTS.HOME_SLIDERS.ACTIVE, { params }),
  getAdminSliders: (params) => apiClient.get(ENDPOINTS.HOME_SLIDERS.ADMIN_ROOT, { params }),
  createSlider: (data) => apiClient.post(ENDPOINTS.HOME_SLIDERS.ADMIN_ROOT, data),
  updateSlider: (homeSliderId, data) => apiClient.put(`${ENDPOINTS.HOME_SLIDERS.ADMIN_ROOT}/${homeSliderId}`, data),
  activateSlider: (homeSliderId) => apiClient.patch(`${ENDPOINTS.HOME_SLIDERS.ADMIN_ROOT}/${homeSliderId}/activate`),
  deactivateSlider: (homeSliderId) => apiClient.patch(`${ENDPOINTS.HOME_SLIDERS.ADMIN_ROOT}/${homeSliderId}/deactivate`),
};

export default homeSliderApi;
