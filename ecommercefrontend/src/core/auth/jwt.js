const decodeBase64Url = (value) => {
  if (!value) {
    return "";
  }

  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return atob(padded);
};

export const parseJwtPayload = (token) => {
  if (!token || typeof token !== "string") {
    return null;
  }

  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }

  try {
    const payloadString = decodeBase64Url(parts[1]);
    const payload = JSON.parse(payloadString);
    return payload && typeof payload === "object" ? payload : null;
  } catch {
    return null;
  }
};

export const isJwtExpired = (token) => {
  const payload = parseJwtPayload(token);
  if (!payload || typeof payload.exp !== "number") {
    return true;
  }

  const currentEpochSeconds = Math.floor(Date.now() / 1000);
  return payload.exp <= currentEpochSeconds;
};
