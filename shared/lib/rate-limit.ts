/**
 * Fixed-window rate limiter.
 *
 * Uses Upstash Redis when UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
 * are set (shared across Vercel instances). Falls back to process-local
 * memory for local dev and tests.
 */

import { Redis } from "@upstash/redis";

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

// ponytail: memory fallback only — production on Vercel must set Upstash env.
const store = new Map<string, Bucket>();
let opsSincePrune = 0;
let warnedMissingRedis = false;

function prune(now: number) {
  for (const [key, bucket] of store) {
    if (bucket.resetAt <= now) store.delete(key);
  }
  opsSincePrune = 0;
}

function redisEnvConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
  );
}

let _redis: Redis | null | undefined;

function getRedis(): Redis | null {
  if (_redis !== undefined) return _redis;
  if (!redisEnvConfigured()) {
    if (process.env.VERCEL === "1" && !warnedMissingRedis) {
      warnedMissingRedis = true;
      console.warn(
        "[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN unset — in-memory counters are not shared across instances",
      );
    }
    _redis = null;
    return null;
  }
  _redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
  return _redis;
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

function resultFromCount(
  count: number,
  policy: RateLimitPolicy,
  resetAt: number,
  now: number,
): RateLimitResult {
  const retryAfterSec = Math.max(1, Math.ceil((resetAt - now) / 1000));
  if (count > policy.limit) {
    return {
      ok: false,
      limit: policy.limit,
      remaining: 0,
      resetAt,
      retryAfterSec,
    };
  }
  return {
    ok: true,
    limit: policy.limit,
    remaining: Math.max(0, policy.limit - count),
    resetAt,
    retryAfterSec,
  };
}

/** Sync in-memory consume — used by checks/tests and as Redis fallback. */
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
    return resultFromCount(policy.limit + 1, policy, bucket.resetAt, now);
  }

  bucket.count += 1;
  return resultFromCount(bucket.count, policy, bucket.resetAt, now);
}

async function consumeRedis(
  redis: Redis,
  key: string,
  policy: RateLimitPolicy,
  now: number,
): Promise<RateLimitResult> {
  const redisKey = `rl:${key}`;
  const count = await redis.incr(redisKey);
  let ttl = await redis.pttl(redisKey);
  // New key or missing TTL — start / refresh the fixed window.
  if (count === 1 || ttl < 0) {
    await redis.pexpire(redisKey, policy.windowMs);
    ttl = policy.windowMs;
  }
  const resetAt = now + Math.max(ttl, 0);
  return resultFromCount(count, policy, resetAt, now);
}

/**
 * Prefer shared Redis when configured; otherwise process-local memory.
 * Callers on Vercel should await this (not sync consume).
 */
export async function consumeAsync(
  key: string,
  policy: RateLimitPolicy,
  now = Date.now(),
): Promise<RateLimitResult> {
  const redis = getRedis();
  if (!redis) return consume(key, policy, now);
  return consumeRedis(redis, key, policy, now);
}

export function consumePreset(
  key: string,
  preset: RateLimitPreset,
  now = Date.now(),
): RateLimitResult {
  return consume(key, RATE_LIMITS[preset], now);
}

export async function consumePresetAsync(
  key: string,
  preset: RateLimitPreset,
  now = Date.now(),
): Promise<RateLimitResult> {
  return consumeAsync(key, RATE_LIMITS[preset], now);
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

/** Test-only: clear memory buckets between assertions. */
export function __resetRateLimitStoreForTests() {
  store.clear();
  opsSincePrune = 0;
  _redis = undefined;
  warnedMissingRedis = false;
}
