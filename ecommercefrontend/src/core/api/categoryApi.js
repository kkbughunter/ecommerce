import ENDPOINTS from "../config/endpoints";
import apiClient from "./apiClient";

const categoryApi = {
  getAllCategories: () => apiClient.get(ENDPOINTS.CATEGORIES.LIST),
};

export default categoryApi;
