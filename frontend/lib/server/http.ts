import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_TOKEN_MAX_AGE_SEC,
  DEFAULT_USER_ROLE,
  REFRESH_COOKIE,
  REFRESH_TOKEN_MAX_AGE_SEC,
  SESSION_COOKIE,
  SESSION_REFRESH_MAX_AGE_SEC,
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

export async function issueAuthTokens(
  claims: TokenPairInput,
  options?: { remember?: boolean },
): Promise<SignedTokens> {
  const refreshMaxAgeSec =
    options?.remember === false ? SESSION_REFRESH_MAX_AGE_SEC : REFRESH_TOKEN_MAX_AGE_SEC;
  const tokens = signTokenPair(
    {
      ...claims,
      roles: claims.roles ?? [DEFAULT_USER_ROLE],
    },
    { refreshMaxAgeSec },
  );
  await registerRefreshToken(
    tokens.refreshJti,
    claims.sub,
    Math.floor(Date.now() / 1000) + refreshMaxAgeSec,
  );
  return tokens;
}

export function attachAuthToResponse(
  response: NextResponse,
  tokens: SignedTokens,
  refreshMaxAgeSec: number = REFRESH_TOKEN_MAX_AGE_SEC,
): NextResponse {
  setRefreshCookie(response, tokens.refreshToken, refreshMaxAgeSec);
  return response;
}

export function authJsonResponse<T extends Record<string, unknown>>(
  data: T,
  tokens: SignedTokens,
  status = 200,
  options?: { remember?: boolean },
): NextResponse {
  const refreshMaxAgeSec =
    options?.remember === false
      ? SESSION_REFRESH_MAX_AGE_SEC
      : tokens.refreshMaxAgeSec ?? REFRESH_TOKEN_MAX_AGE_SEC;
  const response = NextResponse.json(
    {
      ...data,
      accessToken: tokens.accessToken,
      expiresIn: tokens.expiresIn,
      traceId: tokens.traceId,
    },
    { status },
  );
  return attachAuthToResponse(response, tokens, refreshMaxAgeSec);
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
      const claims = await verifyAccessToken(bearer);
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
 * that are called with cookies only (no Bearer header).
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
  const refreshClaims = await verifyRefreshToken(refreshToken);
  if (!refreshClaims) return null;

  // Also confirm the token is still registered and not revoked in the store.
  const record = await getRefreshRecord(refreshClaims.jti);
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
  const claims = await verifyRefreshToken(refreshToken);
  if (!claims) return { ok: false, reason: "invalid" };

  const key = claims.jti;
  const pending = refreshInflight.get(key);
  if (pending) return pending;

  const work = refreshAuthTokens(refreshToken).finally(() => {
    refreshInflight.delete(key);
  });
  refreshInflight.set(key, work);
  return work;
}

export async function refreshAuthTokens(refreshToken: string): Promise<RefreshResult> {
  const claims = await verifyRefreshToken(refreshToken);
  if (!claims) return { ok: false, reason: "invalid" };

  const record = await getRefreshRecord(claims.jti);
  if (!record) return { ok: false, reason: "invalid" };

  const now = Math.floor(Date.now() / 1000);
  // Preserve the original remember-me window across rotation (session stays short).
  const remainingSec = Math.ceil((new Date(record.expiresAt).getTime() - Date.now()) / 1000);
  const refreshMaxAgeSec = Math.max(60, Math.min(REFRESH_TOKEN_MAX_AGE_SEC, remainingSec));

  const newTokens = signTokenPair(
    {
      sub: claims.sub,
      email: claims.email,
      name: claims.name,
      partnerId: claims.partnerId,
      roles: claims.roles,
      traceId: claims.traceId,
    },
    { refreshMaxAgeSec },
  );

  const rotated = await rotateRefreshToken(
    claims.jti,
    newTokens.refreshJti,
    claims.sub,
    now + refreshMaxAgeSec,
  );

  if (rotated === "reuse_detected") {
    await revokeToken(claims.jti, now + REFRESH_TOKEN_MAX_AGE_SEC);
    return { ok: false, reason: "reuse_detected" };
  }
  if (!rotated) return { ok: false, reason: "invalid" };

  return { ok: true, tokens: newTokens };
}

export async function revokeAccessToken(
  claims: SessionClaims,
  expiresAtSec?: number,
): Promise<void> {
  await revokeToken(
    claims.jti,
    expiresAtSec ?? Math.floor(Date.now() / 1000) + ACCESS_TOKEN_MAX_AGE_SEC,
  );
}

/** @deprecated Use issueAuthTokens + attachAuthToResponse */
export async function setSessionCookie(
  response: NextResponse,
  claims: Omit<SessionClaims, "jti" | "traceId" | "roles"> & { roles?: SessionClaims["roles"] },
  _remember?: boolean,
): Promise<void> {
  void _remember;
  const tokens = await issueAuthTokens(claims);
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
  const retryAfter = Math.max(1, Math.ceil(retryAfterSec));
  return NextResponse.json(
    {
      error: "Too many requests. Please try again later.",
      code: "RATE_LIMITED",
      retryAfter,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "RateLimit-Reset": String(retryAfter),
        "Cache-Control": "no-store",
      },
    },
  );
}

/** Copies rate-limit headers from a guard outcome onto an outgoing response. */
export function withRateLimitHeaders(
  response: NextResponse,
  headers: Record<string, string>,
): NextResponse {
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  return response;
}

export function hasRole(claims: SessionClaims, role: SessionClaims["roles"][number]): boolean {
  return claims.roles.includes(role);
}
