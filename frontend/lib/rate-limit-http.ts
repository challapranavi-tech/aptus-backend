import {
  clientIp,
  consumePresetAsync,
  rateLimitHeaders,
  type RateLimitPreset,
  type RateLimitResult,
} from "@shared/lib/rate-limit";
import { NextResponse } from "next/server";

export function tooManyRequests(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    {
      error: "Too many requests. Please try again later.",
      retryAfter: result.retryAfterSec,
    },
    { status: 429, headers: rateLimitHeaders(result) },
  );
}

export async function enforceIpRateLimit(
  request: Request,
  preset: RateLimitPreset,
  scope: string,
): Promise<NextResponse | null> {
  const ip = clientIp(request.headers);
  const result = await consumePresetAsync(`ip:${scope}:${ip}`, preset);
  if (result.ok) return null;
  return tooManyRequests(result);
}

export async function enforceKeyRateLimit(
  key: string,
  preset: RateLimitPreset,
  scope: string,
): Promise<NextResponse | null> {
  const result = await consumePresetAsync(`id:${scope}:${key}`, preset);
  if (result.ok) return null;
  return tooManyRequests(result);
}

export { identityKey } from "@shared/lib/rate-limit";
