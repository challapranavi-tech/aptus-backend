export { REFRESH_COOKIE, SESSION_COOKIE } from "@/lib/cookie-names";

export const ACCESS_TOKEN_MAX_AGE_SEC = Number(
  process.env.JWT_ACCESS_EXPIRES_SEC ?? 60 * 15,
);
export const REFRESH_TOKEN_MAX_AGE_SEC = Number(
  process.env.JWT_REFRESH_EXPIRES_SEC ?? 60 * 60 * 24 * 7,
);

export const SESSION_MAX_AGE_SEC = ACCESS_TOKEN_MAX_AGE_SEC;
export const REFRESH_MAX_AGE_SEC = REFRESH_TOKEN_MAX_AGE_SEC;
