import { withCors } from "@/lib/api-cors";
import {
  clientIp,
  consumePresetAsync,
  rateLimitHeaders,
  type RateLimitPreset,
} from "@shared/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";

/**
 * Path → IP rate-limit preset for public API surface.
 * /api/health is exempt so deploy probes are never throttled.
 *
 * Multipart upload routes (/api/careers/apply, parse-resume, /api/career/apply)
 * are excluded from the matcher below — Edge middleware body cloning 502s ~1MB+
 * payloads before the Node function starts. Those routes enforce IP limits
 * themselves via enforceIpRateLimit.
 */
function presetFor(pathname: string): RateLimitPreset | null {
  if (pathname === "/api/health") return null;
  if (
    pathname === "/api/contact" ||
    pathname === "/api/enquiry" ||
    pathname.startsWith("/api/career/")
  ) {
    return "publicWrite";
  }
  if (
    pathname === "/api/revalidate" ||
    pathname === "/api/crm/retry" ||
    pathname === "/api/cms/seed-page"
  ) {
    return "authWriteIp";
  }
  if (pathname === "/api/odoo") return "debug";
  if (pathname.startsWith("/api/")) return "publicRead";
  return null;
}

function needsCors(pathname: string): boolean {
  return (
    pathname === "/api/contact" ||
    pathname === "/api/enquiry" ||
    pathname.startsWith("/api/career")
  );
}

export async function middleware(request: NextRequest) {
  if (request.method === "OPTIONS") {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  // Public CMS reads are cacheable and high-QPS — skip Edge Redis RTT here.
  // Abuse still hits Vercel/platform limits; writes keep rate limits below.
  if (
    request.method === "GET" &&
    (pathname.startsWith("/api/cms/") || pathname === "/api/health")
  ) {
    return NextResponse.next();
  }

  const preset = presetFor(pathname);
  if (!preset) return NextResponse.next();

  const ip = clientIp(request.headers);
  const result = await consumePresetAsync(`mw:ip:${pathname}:${ip}`, preset);

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
  // ponytail: negative lookahead keeps multipart uploads off Edge middleware
  // body clone (Vercel 502s ~1MB+). Ceiling: upload routes must rate-limit in-handler.
  matcher: [
    "/api/((?!careers/apply|careers/parse-resume|career/apply).*)",
  ],
};
