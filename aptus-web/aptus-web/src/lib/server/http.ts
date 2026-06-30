import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_TOKEN_MAX_AGE_SEC,
  DEFAULT_USER_ROLE,
  REFRESH_COOKIE,
  REFRESH_TOKEN_MAX_AGE_SEC,
  SESSION_COOKIE,
} from "./config";
import {
  signTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  type SessionClaims,
  type SignedTokens,
  type TokenPairInput,
} from "./jwt";
import {
  getRefreshRecord,
  registerRefreshToken,
  rotateRefreshToken,
} from "./refresh-tokens";
import { revokeToken } from "./token-blocklist";

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
};

export function setRefreshCookie(response: NextResponse, refreshToken: string, maxAgeSec: number): void {
  response.cookies.set(REFRESH_COOKIE, refreshToken, {
    ...COOKIE_OPTS,
    maxAge: maxAgeSec,
  });
}

export function clearRefreshCookie(response: NextResponse): void {
  response.cookies.set(REFRESH_COOKIE, "", { ...COOKIE_OPTS, maxAge: 0 });
}

/** Legacy — clears old single-session cookie during migration. */
export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE, "", { ...COOKIE_OPTS, maxAge: 0 });
  clearRefreshCookie(response);
}

export function clearAllAuthCookies(response: NextResponse): void {
  clearSessionCookie(response);
}

export function issueAuthTokens(claims: TokenPairInput): SignedTokens {
  const tokens = signTokenPair({
    ...claims,
    roles: claims.roles ?? [DEFAULT_USER_ROLE],
  });
  registerRefreshToken(
    tokens.refreshJti,
    claims.sub,
    Math.floor(Date.now() / 1000) + REFRESH_TOKEN_MAX_AGE_SEC,
  );
  return tokens;
}

export function attachAuthToResponse(
  response: NextResponse,
  tokens: SignedTokens,
): NextResponse {
  setRefreshCookie(response, tokens.refreshToken, REFRESH_TOKEN_MAX_AGE_SEC);
  return response;
}

export function authJsonResponse<T extends Record<string, unknown>>(
  data: T,
  tokens: SignedTokens,
  status = 200,
): NextResponse {
  const response = NextResponse.json(
    {
      ...data,
      accessToken: tokens.accessToken,
      expiresIn: tokens.expiresIn,
      traceId: tokens.traceId,
    },
    { status },
  );
  return attachAuthToResponse(response, tokens);
}

export async function getAccessTokenFromRequest(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7).trim() || null;
  }
  return null;
}

export async function getSessionFromRequest(request?: NextRequest): Promise<SessionClaims | null> {
  if (request) {
    const bearer = await getAccessTokenFromRequest(request);
    if (bearer) {
      const claims = verifyAccessToken(bearer);
      if (claims) return claims;
    }
  }

  const cookieStore = await cookies();
  const legacy = cookieStore.get(SESSION_COOKIE)?.value;
  if (legacy) {
    return verifyAccessToken(legacy);
  }

  return null;
}

export async function getSessionFromCookies(): Promise<SessionClaims | null> {
  return getSessionFromRequest();
}

/**
 * Resolves the session from a NextRequest, falling back to the refresh-token
 * cookie when the access token is missing or expired. Use this in API routes
 * that are called by aptus_portal_auth.js (which only sends cookies, no Bearer).
 *
 * IMPORTANT: this only *verifies* the refresh token — it does NOT rotate it.
 * Rotation must happen only at /api/auth/refresh so the browser cookie stays
 * valid. Rotating here without updating the cookie would revoke the user's
 * session after the first call.
 */
export async function getSessionFromRequestOrRefresh(
  request: NextRequest,
): Promise<SessionClaims | null> {
  const claims = await getSessionFromRequest(request);
  if (claims) return claims;

  const refreshToken = await getRefreshTokenFromCookies();
  if (!refreshToken) return null;

  // Verify the refresh JWT without rotating it.
  const refreshClaims = verifyRefreshToken(refreshToken);
  if (!refreshClaims) return null;

  // Also confirm the token is still registered and not revoked in the store.
  const record = getRefreshRecord(refreshClaims.jti);
  if (!record) return null;

  return refreshClaims;
}

export async function getRefreshTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(REFRESH_COOKIE)?.value ?? null;
}

export type RefreshResult =
  | { ok: true; tokens: SignedTokens }
  | { ok: false; reason: "missing" | "invalid" | "reuse_detected" };

const refreshInflight = new Map<string, Promise<RefreshResult>>();

/** Deduplicates concurrent refresh attempts that share the same refresh jti. */
export async function refreshAuthTokensOnce(refreshToken: string): Promise<RefreshResult> {
  const claims = verifyRefreshToken(refreshToken);
  if (!claims) return { ok: false, reason: "invalid" };

  const key = claims.jti;
  const pending = refreshInflight.get(key);
  if (pending) return pending;

  const work = Promise.resolve(refreshAuthTokens(refreshToken)).finally(() => {
    refreshInflight.delete(key);
  });
  refreshInflight.set(key, work);
  return work;
}

export function refreshAuthTokens(refreshToken: string): RefreshResult {
  const claims = verifyRefreshToken(refreshToken);
  if (!claims) return { ok: false, reason: "invalid" };

  const record = getRefreshRecord(claims.jti);
  if (!record) return { ok: false, reason: "invalid" };

  const newTokens = signTokenPair({
    sub: claims.sub,
    email: claims.email,
    name: claims.name,
    partnerId: claims.partnerId,
    roles: claims.roles,
    traceId: claims.traceId,
  });

  const rotated = rotateRefreshToken(
    claims.jti,
    newTokens.refreshJti,
    claims.sub,
    Math.floor(Date.now() / 1000) + REFRESH_TOKEN_MAX_AGE_SEC,
  );

  if (rotated === "reuse_detected") {
    revokeToken(claims.jti, Math.floor(Date.now() / 1000) + REFRESH_TOKEN_MAX_AGE_SEC);
    return { ok: false, reason: "reuse_detected" };
  }
  if (!rotated) return { ok: false, reason: "invalid" };

  return { ok: true, tokens: newTokens };
}

export function revokeAccessToken(claims: SessionClaims, expiresAtSec?: number): void {
  revokeToken(claims.jti, expiresAtSec ?? Math.floor(Date.now() / 1000) + ACCESS_TOKEN_MAX_AGE_SEC);
}

/** @deprecated Use issueAuthTokens + attachAuthToResponse */
export function setSessionCookie(
  response: NextResponse,
  claims: Omit<SessionClaims, "jti" | "traceId" | "roles"> & { roles?: SessionClaims["roles"] },
  _remember?: boolean,
): void {
  void _remember;
  const tokens = issueAuthTokens(claims);
  attachAuthToResponse(response, tokens);
}

export function jsonError(message: string, status: number, code?: string): NextResponse {
  return NextResponse.json({ error: message, ...(code ? { code } : {}) }, { status });
}

export function jsonOk<T extends Record<string, unknown>>(
  data: T,
  status = 200,
  headers?: HeadersInit,
): NextResponse {
  return NextResponse.json(data, { status, headers });
}

export function rateLimitedResponse(retryAfterSec: number): NextResponse {
  return NextResponse.json(
    { error: "Too many requests. Please try again later.", code: "RATE_LIMITED" },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSec) },
    },
  );
}

export function hasRole(claims: SessionClaims, role: SessionClaims["roles"][number]): boolean {
  return claims.roles.includes(role);
}
