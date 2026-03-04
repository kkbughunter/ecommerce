import ENDPOINTS from "../config/endpoints";
import apiClient from "./apiClient";

const categoryApi = {
  getAllCategories: () => apiClient.get(ENDPOINTS.CATEGORIES.LIST),
  createCategory: (data) => apiClient.post(ENDPOINTS.CATEGORIES.CREATE, data),
};

export default categoryApi;
