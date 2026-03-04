const ENV = {
  API_BASE_URL: String(import.meta.env.VITE_BASE_URL || "").trim(),
};

export default ENV;
