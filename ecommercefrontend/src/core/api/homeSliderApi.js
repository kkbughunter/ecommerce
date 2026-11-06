import ENDPOINTS from "../config/endpoints";
import apiClient from "./apiClient";
import singleImageRequest from "./singleImageRequest";

const homeSliderApi = {
  getActiveSliders: (params) => apiClient.get(ENDPOINTS.HOME_SLIDERS.ACTIVE, { params }),
  getAdminSliders: (params) => apiClient.get(ENDPOINTS.HOME_SLIDERS.ADMIN_ROOT, { params }),
  createSlider: (data, file) => apiClient.post(ENDPOINTS.HOME_SLIDERS.ADMIN_ROOT, singleImageRequest(data, file)),
  updateSlider: (homeSliderId, data, file) => apiClient.put(`${ENDPOINTS.HOME_SLIDERS.ADMIN_ROOT}/${homeSliderId}`, singleImageRequest(data, file)),
  activateSlider: (homeSliderId) => apiClient.patch(`${ENDPOINTS.HOME_SLIDERS.ADMIN_ROOT}/${homeSliderId}/activate`),
  deactivateSlider: (homeSliderId) => apiClient.patch(`${ENDPOINTS.HOME_SLIDERS.ADMIN_ROOT}/${homeSliderId}/deactivate`),
  deleteSlider: (id) => apiClient.delete(`${ENDPOINTS.HOME_SLIDERS.ADMIN_ROOT}/${id}`),
};

export default homeSliderApi;
