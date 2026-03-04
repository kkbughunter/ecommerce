import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import coreApi from '../../../shared/services/coreApi';
import getApiErrorMessage from '../../../shared/utils/apiError';
import { isAuthenticated, setAuthSession } from '../../../shared/utils/authSession';

const initialForm = {
  email: "",
  password: "",
};

const useLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialForm);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/shop', { replace: true });
    }
  }, [navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (error) setError('');
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await coreApi.auth.login(formData);
      const loginData = response?.data?.data || {};

      if (!loginData.accessToken) {
        throw new Error('Access token missing in login response');
      }

      setAuthSession(loginData);

      setFormData(initialForm);
      navigate('/shop', { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Login failed. Please try again.'));
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
