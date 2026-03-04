import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import authApi from "../../../core/api/authApi";
import { getHomePathByRole, isAuthenticated, setAuthSession } from "../../../core/auth/session";
import getApiErrorMessage from "../../../core/utils/apiError";

const initialLoginForm = {
  email: "",
  password: "",
};

const initialRegisterForm = {
  email: "",
  password: "",
  firstName: "",
  lastName: "",
};

const initialVerifyForm = {
  email: "",
  otp: "",
};

const useLogin = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [loginForm, setLoginForm] = useState(initialLoginForm);
  const [registerForm, setRegisterForm] = useState(initialRegisterForm);
  const [verifyForm, setVerifyForm] = useState(initialVerifyForm);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (isAuthenticated()) {
      navigate(getHomePathByRole(), { replace: true });
    }
  }, [navigate]);

  const switchMode = (nextMode) => {
    if (nextMode === "verify" && !verifyForm.email) {
      setMode("login");
      setError("");
      setSuccess("");
      return;
    }

    setMode(nextMode);
    setError("");
    setSuccess("");
  };

  const handleLoginChange = (event) => {
    const { name, value } = event.target;
    if (error || success) {
      setError("");
      setSuccess("");
    }
    setLoginForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegisterChange = (event) => {
    const { name, value } = event.target;
    if (error || success) {
      setError("");
      setSuccess("");
    }
    setRegisterForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleVerifyChange = (event) => {
    const { name, value } = event.target;
    if (error || success) {
      setError("");
      setSuccess("");
    }
    setVerifyForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const response = await authApi.login(loginForm);
      const loginData = response?.data?.data || {};
      setAuthSession(loginData);

      setLoginForm(initialLoginForm);
      navigate(getHomePathByRole(), { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, "Login failed. Please try again."));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const payload = {
        email: registerForm.email,
        password: registerForm.password,
        firstName: registerForm.firstName,
        lastName: registerForm.lastName || "",
      };
      const response = await authApi.register(payload);
      const registerData = response?.data?.data || {};

      setRegisterForm(initialRegisterForm);
      setVerifyForm({
        email: registerData.email || payload.email,
        otp: "",
      });
      setSuccess(`Registered successfully. OTP sent to ${registerData.email || payload.email}.`);
      setMode("verify");
    } catch (err) {
      setError(getApiErrorMessage(err, "Registration failed. Please try again."));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const payload = {
        email: verifyForm.email,
        otp: verifyForm.otp,
      };
      await authApi.verifyOtp(payload);

      setVerifyForm(initialVerifyForm);
      setSuccess("Account verified successfully. Please sign in.");
      setMode("login");
      setLoginForm((prev) => ({ ...prev, email: payload.email }));
    } catch (err) {
      setError(getApiErrorMessage(err, "OTP verification failed."));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const email = verifyForm.email?.trim();
      if (!email) {
        throw new Error("Email is required to resend OTP.");
      }

      const response = await authApi.resendOtp({ email });
      const resendData = response?.data?.data || {};
      setVerifyForm((prev) => ({
        ...prev,
        email: resendData.email || email,
      }));
      setSuccess(`OTP resent successfully to ${resendData.email || email}.`);
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to resend OTP."));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    mode,
    loginForm,
    registerForm,
    verifyForm,
    isLoading,
    error,
    success,
    switchMode,
    handleLoginChange,
    handleRegisterChange,
    handleVerifyChange,
    handleLoginSubmit,
    handleRegisterSubmit,
    handleVerifySubmit,
    handleResendOtp,
  };
};

export default useLogin;
