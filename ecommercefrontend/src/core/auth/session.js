import { isJwtExpired, parseJwtPayload } from "./jwt";

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const AUTH_META_KEY = "authMeta";

const normalizeRoles = (roles) => {
  if (!Array.isArray(roles)) {
    return [];
  }

  return roles
    .map((role) => (typeof role === "string" ? role.trim().toUpperCase() : ""))
    .filter(Boolean);
};

const parseJsonSafely = (value, fallbackValue) => {
  if (!value) {
    return fallbackValue;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallbackValue;
  }
};

export const clearAuthSession = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(AUTH_META_KEY);
};

export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);

export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);

export const getUserRoles = () => {
  const accessToken = getAccessToken();
  const payload = parseJwtPayload(accessToken);
  return normalizeRoles(payload?.roles);
};

export const getAuthMeta = () => {
  const parsed = parseJsonSafely(localStorage.getItem(AUTH_META_KEY), {});
  const meta = parsed && typeof parsed === "object" ? parsed : {};
  return {
    ...meta,
    roles: getUserRoles(),
  };
};

export const getPrimaryRole = () => {
  const roles = getUserRoles();
  if (roles.includes("ADMIN")) {
    return "ADMIN";
  }
  if (roles.includes("SUPER_ADMIN")) {
    return "SUPER_ADMIN";
  }
  if (roles.includes("USER")) {
    return "USER";
  }
  return null;
};

export const getHomePathByRole = () => {
  const role = getPrimaryRole();
  if (role === "ADMIN") {
    return "/admin";
  }
  if (role === "SUPER_ADMIN") {
    return "/admin/categories";
  }
  if (role === "USER") {
    return "/client";
  }
  return "/login";
};

export const isAuthenticated = () => {
  const accessToken = getAccessToken();
  if (!accessToken || isJwtExpired(accessToken)) {
    clearAuthSession();
    return false;
  }
  return true;
};

export const hasAnyRole = (allowedRoles) => {
  if (!Array.isArray(allowedRoles) || !allowedRoles.length) {
    return true;
  }

  const currentRoles = getUserRoles();
  return allowedRoles.some((role) =>
    currentRoles.includes(String(role).toUpperCase()),
  );
};

export const setAuthSession = (authData) => {
  const accessToken = authData?.accessToken;
  if (!accessToken) {
    throw new Error("Access token is missing in login response");
  }

  const payload = parseJwtPayload(accessToken);
  if (!payload || payload.type !== "access") {
    throw new Error("Invalid access token payload");
  }

  if (isJwtExpired(accessToken)) {
    throw new Error("Access token is expired");
  }

  const tokenRoles = normalizeRoles(payload?.roles);
  const roles = tokenRoles;

  if (!roles.length) {
    throw new Error("Role not found in login response");
  }

  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);

  if (authData?.refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, authData.refreshToken);
  }

  localStorage.setItem(
    AUTH_META_KEY,
    JSON.stringify({
      userId: payload?.sub || null,
      email: payload?.email || null,
      tokenType: authData?.tokenType || "Bearer",
      expiresInSeconds: authData?.expiresInSeconds || null,
    }),
  );
};
