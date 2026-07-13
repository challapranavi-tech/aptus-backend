/**
 * Fixed-window rate limiter (in-memory).
 *
 * ponytail: process-local Map — fine for a single Node/Edge isolate; multi-instance
 * deploys need a shared store (e.g. Upstash) so counters stay consistent across replicas.
 */

export type RateLimitResult = {
  ok: boolean;
  limit: number;
  remaining: number;
  /** Epoch ms when the current window resets. */
  resetAt: number;
  retryAfterSec: number;
};

export type RateLimitPolicy = {
  limit: number;
  windowMs: number;
};

/** Named policies — generous on reads, tight on writes. */
export const RATE_LIMITS = {
  /** Public CMS / read APIs — enough for ISR + browse, not scrapers. */
  publicRead: { limit: 120, windowMs: 60_000 } satisfies RateLimitPolicy,
  /** Form / upload POSTs by IP. */
  publicWrite: { limit: 8, windowMs: 15 * 60_000 } satisfies RateLimitPolicy,
  /** Same forms keyed by submitted email (when present). */
  publicWriteIdentity: { limit: 3, windowMs: 15 * 60_000 } satisfies RateLimitPolicy,
  /** Token-protected webhooks by IP (failed auth still burns this). */
  authWriteIp: { limit: 60, windowMs: 60_000 } satisfies RateLimitPolicy,
  /** Token-protected webhooks by auth identity. */
  authWriteUser: { limit: 120, windowMs: 60_000 } satisfies RateLimitPolicy,
  /** Debug / sensitive tools. */
  debug: { limit: 30, windowMs: 60_000 } satisfies RateLimitPolicy,
} as const;

export type RateLimitPreset = keyof typeof RATE_LIMITS;

type Bucket = { count: number; resetAt: number };

// ponytail: unbounded growth if unique keys explode — prune expired entries periodically.
const store = new Map<string, Bucket>();
let opsSincePrune = 0;

function prune(now: number) {
  for (const [key, bucket] of store) {
    if (bucket.resetAt <= now) store.delete(key);
  }
  opsSincePrune = 0;
}

/**
 * Client IP for rate limiting.
 *
 * Prefer platform-asserted headers (CF-Connecting-IP, X-Real-IP). Use
 * X-Forwarded-For only behind a trusted reverse proxy (Vercel sets VERCEL=1).
 * security: without a trusted proxy, accepting client-supplied XFF enables
 * IP spoofing to bypass per-IP limits — fall back to a shared bucket instead.
 */
export function clientIp(headers: Headers, fallback = "unknown"): string {
  const cf = headers.get("cf-connecting-ip")?.trim();
  if (cf) return cf;

  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const trustForwarded =
    process.env.VERCEL === "1" ||
    process.env.TRUST_PROXY === "true" ||
    process.env.NODE_ENV !== "production";

  if (trustForwarded) {
    const forwarded = headers.get("x-forwarded-for");
    if (forwarded) {
      const first = forwarded.split(",")[0]?.trim();
      if (first) return first;
    }
  }

  return fallback;
}

export function consume(
  key: string,
  policy: RateLimitPolicy,
  now = Date.now(),
): RateLimitResult {
  opsSincePrune += 1;
  if (opsSincePrune >= 200) prune(now);

  let bucket = store.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + policy.windowMs };
    store.set(key, bucket);
  }

  if (bucket.count >= policy.limit) {
    const retryAfterSec = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    return {
      ok: false,
      limit: policy.limit,
      remaining: 0,
      resetAt: bucket.resetAt,
      retryAfterSec,
    };
  }

  bucket.count += 1;
  return {
    ok: true,
    limit: policy.limit,
    remaining: Math.max(0, policy.limit - bucket.count),
    resetAt: bucket.resetAt,
    retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
  };
}

export function consumePreset(
  key: string,
  preset: RateLimitPreset,
  now = Date.now(),
): RateLimitResult {
  return consume(key, RATE_LIMITS[preset], now);
}

/** Standard rate-limit response headers (RFC-ish + common X-RateLimit-*). */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "Retry-After": String(result.retryAfterSec),
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };
}

/** Stable key fragment for a secret without storing the raw token. */
export function identityKey(raw: string): string {
  let h = 2166136261;
  for (let i = 0; i < raw.length; i++) {
    h ^= raw.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

/** Test-only: clear buckets between assertions. */
export function __resetRateLimitStoreForTests() {
  store.clear();
  opsSincePrune = 0;
}
