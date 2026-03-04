import AUTH from "../../config/endPoints";
import apiService from "./apiService";

const auth = {
  login: (data) => apiService.post(AUTH.LOGIN, data),
};
export default auth;
