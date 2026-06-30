import { kvIncr, kvTtlSec } from "./kv-store";

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
};

const RATE_PREFIX = "aptus:rl:";

export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const windowSec = Math.ceil(windowMs / 1000);
  const storeKey = `${RATE_PREFIX}${key}`;
  const count = await kvIncr(storeKey, windowSec);

  if (count > maxRequests) {
    const retryAfterSec = await kvTtlSec(storeKey);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: retryAfterSec || windowSec,
    };
  }

  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - count),
    retryAfterSec: 0,
  };
}

export function rateLimitKey(prefix: string, ip: string, identifier?: string): string {
  return `${prefix}:${ip}:${identifier?.toLowerCase().trim() ?? "*"}`;
}

/** Auth endpoints: 10 attempts per 15 minutes per IP+email */
export const AUTH_RATE_LIMIT = { max: 10, windowMs: 15 * 60 * 1000 };

/** Refresh endpoint: 30 per 15 minutes per IP */
export const REFRESH_RATE_LIMIT = { max: 30, windowMs: 15 * 60 * 1000 };
