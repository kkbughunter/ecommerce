import ENDPOINTS from "../config/endpoints";
import apiClient from "./apiClient";
import singleImageRequest from "./singleImageRequest";

const categoryApi = {
  getAllCategories: () => apiClient.get(ENDPOINTS.CATEGORIES.LIST),
  createCategory: (data, file) => apiClient.post(ENDPOINTS.CATEGORIES.CREATE, singleImageRequest(data, file)),
  updateCategory: (id, data, file) => apiClient.put(`${ENDPOINTS.CATEGORIES.LIST}/${id}`, singleImageRequest(data, file)),
  deleteCategory: (id) => apiClient.delete(`${ENDPOINTS.CATEGORIES.LIST}/${id}`),
};

export default categoryApi;
