import { withCors } from "@/lib/api-cors";
import {
  clientIp,
  consumePreset,
  rateLimitHeaders,
  type RateLimitPreset,
} from "@shared/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";

/**
 * Path → IP rate-limit preset for public API surface.
 * /api/health is exempt so deploy probes are never throttled.
 */
function presetFor(pathname: string): RateLimitPreset | null {
  if (pathname === "/api/health") return null;
  if (pathname === "/api/contact" || pathname.startsWith("/api/career/")) {
    return "publicWrite";
  }
  if (pathname === "/api/revalidate") return "authWriteIp";
  if (pathname === "/api/odoo") return "debug";
  if (pathname.startsWith("/api/")) return "publicRead";
  return null;
}

function needsCors(pathname: string): boolean {
  return pathname === "/api/contact" || pathname.startsWith("/api/career/");
}

export function middleware(request: NextRequest) {
  if (request.method === "OPTIONS") {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  const preset = presetFor(pathname);
  if (!preset) return NextResponse.next();

  const ip = clientIp(request.headers);
  const result = consumePreset(`mw:ip:${pathname}:${ip}`, preset);

  if (!result.ok) {
    const denied = NextResponse.json(
      {
        error: "Too many requests. Please try again later.",
        retryAfter: result.retryAfterSec,
      },
      { status: 429, headers: rateLimitHeaders(result) },
    );
    return needsCors(pathname) ? withCors(denied, request) : denied;
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
