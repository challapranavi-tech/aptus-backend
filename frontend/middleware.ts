import {
  clientIp,
  consumePreset,
  rateLimitHeaders,
} from "@shared/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";

/**
 * Frontend API surface is only /api/revalidate (shared-secret webhook).
 * security: IP rate limit at the edge so abuse is stopped before the handler.
 */
export function middleware(request: NextRequest) {
  if (request.method === "OPTIONS") {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname !== "/api/revalidate") {
    return NextResponse.next();
  }

  const ip = clientIp(request.headers);
  const result = consumePreset(`mw:ip:/api/revalidate:${ip}`, "authWriteIp");

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
  response.headers.set("X-RateLimit-Limit", String(result.limit));
  response.headers.set("X-RateLimit-Remaining", String(result.remaining));
  response.headers.set(
    "X-RateLimit-Reset",
    String(Math.ceil(result.resetAt / 1000)),
  );
  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
