import { useState } from "react";
import auth from "../../../shared/services/coreApi";

const initialForm = {
  email: "",
  password: "",
};

const useLogin = () => {
  const [formData, setFormData] = useState(initialForm);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (error) setError("");
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await auth.login(formData);
      const loginData = response?.data?.data;

      if (loginData.accessToken) {
        localStorage.setItem("accessToken", loginData.accessToken);
      }

      if (loginData.refreshToken) {
        localStorage.setItem("refreshToken", loginData.refreshToken);
      }

      setFormData(initialForm);
    } catch (err) {
      setError(
        err?.response?.data?.message || "Login failed. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return {
    formData,
    isLoading,
    error,
    handleChange,
    handleSubmit,
  };
};

export default useLogin;
