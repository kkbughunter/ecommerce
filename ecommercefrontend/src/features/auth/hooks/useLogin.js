import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import authApi from "../../../core/api/authApi";
import { getHomePathByRole, isAuthenticated, setAuthSession } from "../../../core/auth/session";
import getApiErrorMessage from "../../../core/utils/apiError";

const initialForm = {
  email: "",
  password: "",
};

const useLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialForm);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthenticated()) {
      navigate(getHomePathByRole(), { replace: true });
    }
  }, [navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (error) {
      setError("");
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await authApi.login(formData);
      const loginData = response?.data?.data || {};
      setAuthSession(loginData);

      setFormData(initialForm);
      navigate(getHomePathByRole(), { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, "Login failed. Please try again."));
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
