const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_ROLES_KEY = 'userRoles';

const parseStoredRoles = (value) => {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);

export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);

export const getUserRoles = () => {
  const rawRoles = localStorage.getItem(USER_ROLES_KEY);
  return parseStoredRoles(rawRoles);
};

export const isAuthenticated = () => Boolean(getAccessToken());

export const clearAuthSession = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_ROLES_KEY);
};

export const setAuthSession = (authData) => {
  if (!authData?.accessToken) {
    return;
  }

  localStorage.setItem(ACCESS_TOKEN_KEY, authData.accessToken);

  if (authData.refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, authData.refreshToken);
  }

  if (Array.isArray(authData.roles)) {
    localStorage.setItem(USER_ROLES_KEY, JSON.stringify(authData.roles));
  }
};
