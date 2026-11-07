const rawBaseUrl = String(import.meta.env.VITE_BASE_URL || "").trim().replace(/\/+$/, "");
const API_BASE_URL = rawBaseUrl === "" || rawBaseUrl === "/" ? "/api" : rawBaseUrl;

const ENV = {
  API_BASE_URL,
};

export default ENV;
