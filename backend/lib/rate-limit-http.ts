import {
  clientIp,
  consumePreset,
  rateLimitHeaders,
  type RateLimitPreset,
  type RateLimitResult,
} from "@shared/lib/rate-limit";
import { NextResponse } from "next/server";

export function tooManyRequests(
  result: RateLimitResult,
  cors?: (response: NextResponse) => NextResponse,
): NextResponse {
  const response = NextResponse.json(
    {
      error: "Too many requests. Please try again later.",
      retryAfter: result.retryAfterSec,
    },
    {
      status: 429,
      headers: rateLimitHeaders(result),
    },
  );
  return cors ? cors(response) : response;
}

/** IP-based limit. Returns 429 response or null when allowed. */
export function enforceIpRateLimit(
  request: Request,
  preset: RateLimitPreset,
  scope: string,
  cors?: (response: NextResponse) => NextResponse,
): NextResponse | null {
  const ip = clientIp(request.headers);
  const result = consumePreset(`ip:${scope}:${ip}`, preset);
  if (result.ok) return null;
  return tooManyRequests(result, cors);
}

/** Identity / auth-key limit (email hash, token hash, user id, …). */
export function enforceKeyRateLimit(
  key: string,
  preset: RateLimitPreset,
  scope: string,
  cors?: (response: NextResponse) => NextResponse,
): NextResponse | null {
  const result = consumePreset(`id:${scope}:${key}`, preset);
  if (result.ok) return null;
  return tooManyRequests(result, cors);
}

export { clientIp, identityKey } from "@shared/lib/rate-limit";
