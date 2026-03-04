const getApiErrorMessage = (
  error,
  fallbackMessage = "Something went wrong. Please try again.",
) => {
  return error?.response?.data?.message || error?.message || fallbackMessage;
};

export default getApiErrorMessage;
