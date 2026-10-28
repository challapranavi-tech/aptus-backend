import {
  clientIp,
  consumePresetAsync,
  rateLimitHeaders,
} from "@shared/lib/rate-limit";
import { REFRESH_COOKIE, SESSION_COOKIE } from "@/lib/cookie-names";
import { verifyAccessToken, verifyRefreshToken } from "@/lib/server/jwt";
import { getRefreshRecord } from "@/lib/server/refresh-tokens";
import { enforceApiRateLimit, identifyUser } from "@/lib/server/rate-limit-guard";
import { NextRequest, NextResponse } from "next/server";

/**
 * Frontend middleware:
 *  - /api/revalidate — shared-secret webhook IP limit (existing Aptus behaviour)
 *  - other /api/* — portal sliding-window rate limits
 *  - /portal/* — JWT refresh/session cookie gate (crypto + live KV refresh record)
 */
export async function middleware(request: NextRequest) {
  const traceId = request.headers.get("x-trace-id") ?? crypto.randomUUID();
  const { pathname } = request.nextUrl;

  if (request.method === "OPTIONS") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api")) {
    if (pathname === "/api/revalidate") {
      return handleRevalidate(request, traceId);
    }
    // Hot GET paths: IP rate limits only — skip JWT identify (crypto) on every call.
    const skipIdentify =
      request.method === "GET" &&
      (pathname === "/api/auth/me" ||
        pathname === "/api/notifications" ||
        pathname === "/api/orders" ||
        pathname === "/api/subscriptions");
    return handlePortalApi(request, pathname, traceId, skipIdentify);
  }

  const response = NextResponse.next();
  response.headers.set("x-trace-id", traceId);

  if (!pathname.startsWith("/portal")) {
    return response;
  }

  const refreshCookie = request.cookies.get(REFRESH_COOKIE)?.value;
  const refreshClaims = refreshCookie ? await verifyRefreshToken(refreshCookie) : null;
  const liveRefresh =
    refreshClaims && (await getRefreshRecord(refreshClaims.jti)) ? refreshClaims : null;

  const legacyCookie = request.cookies.get(SESSION_COOKIE)?.value;
  const validLegacy = legacyCookie ? await verifyAccessToken(legacyCookie) : null;

  if (liveRefresh || validLegacy) {
    return response;
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", pathname);
  const redirect = NextResponse.redirect(loginUrl);
  redirect.headers.set("x-trace-id", traceId);
  // Soft-nav RSC cache must not reuse this redirect after the user signs in
  // (stale /portal/cart → /login is what left the header logged-in on /login).
  redirect.headers.set("Cache-Control", "no-store, must-revalidate");
  // Do not clear cookies here — a missing KV row / transient lookup must not
  // destroy a still-valid refresh JWT; /api/auth/me and logout clear when needed.
  return redirect;
}

async function handleRevalidate(request: NextRequest, traceId: string) {
  const ip = clientIp(request.headers);
  const result = await consumePresetAsync(
    `mw:ip:/api/revalidate:${ip}`,
    "authWriteIp",
  );

  if (!result.ok) {
    return NextResponse.json(
      {
        error: "Too many requests. Please try again later.",
        retryAfter: result.retryAfterSec,
      },
      { status: 429, headers: rateLimitHeaders(result) },
    );
  }

  const response = NextResponse.next();
  response.headers.set("x-trace-id", traceId);
  response.headers.set("X-RateLimit-Limit", String(result.limit));
  response.headers.set("X-RateLimit-Remaining", String(result.remaining));
  response.headers.set(
    "X-RateLimit-Reset",
    String(Math.ceil(result.resetAt / 1000)),
  );
  return response;
}

async function handlePortalApi(
  request: NextRequest,
  pathname: string,
  traceId: string,
  skipIdentify = false,
) {
  const userId = skipIdentify
    ? null
    : await identifyUser({
        headers: request.headers,
        cookieValue: (name) => request.cookies.get(name)?.value,
      });

  const outcome = await enforceApiRateLimit(request, pathname, {
    userId,
    traceId,
  });

  if (!outcome.ok) {
    return outcome.response;
  }

  const response = NextResponse.next();
  response.headers.set("x-trace-id", traceId);
  for (const [key, value] of Object.entries(outcome.headers)) {
    response.headers.set(key, value);
  }
  return response;
}

export const config = {
  matcher: ["/portal/:path*", "/api/:path*"],
  // Node crypto + getJwtPublicKey (fs/env) — Edge cannot verify RS256 with our jwt.ts.
  runtime: "nodejs",
};
