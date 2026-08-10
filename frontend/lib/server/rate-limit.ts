import { isSharedStoreConfigured, kvIncrWindow } from "./kv-store";
import { logger } from "./logger";

/**
 * Sliding-window-counter rate limiter.
 *
 * A plain fixed window lets a caller spend a full quota at the end of one window
 * and another immediately after, so a "60/min" rule really permits 120 requests
 * in two seconds. We weight the previous window by how much of it still overlaps
 * the trailing period, which smooths that boundary without the memory cost of
 * storing every request timestamp.
 */

const RATE_PREFIX = "aptus:rl:";

export type RateLimitRule = {
  /** Identifies the rule in logs and in the `RateLimit-Policy` header. */
  name: string;
  limit: number;
  windowSec: number;
};

export type RateLimitDecision = {
  allowed: boolean;
  limit: number;
  remaining: number;
  /** Seconds until the quota fully replenishes. */
  resetSec: number;
  /** Length of the quota window, reported in `RateLimit-Policy`. */
  windowSec: number;
  /** Seconds the caller should wait before retrying. Zero when allowed. */
  retryAfterSec: number;
  rule: string;
  /** True when the shared store was unreachable and a local fallback was used. */
  degraded: boolean;
};

function allowedDecision(rule: RateLimitRule, remaining: number, resetSec: number, degraded = false): RateLimitDecision {
  return {
    allowed: true,
    limit: rule.limit,
    remaining,
    resetSec,
    windowSec: rule.windowSec,
    retryAfterSec: 0,
    rule: rule.name,
    degraded,
  };
}

/**
 * Estimates when the weighted count will fall back below the limit, so callers
 * get a truthful `Retry-After` instead of always being told to wait a full window.
 */
function retryAfterFor(
  current: number,
  previous: number,
  limit: number,
  windowSec: number,
  elapsedSec: number,
): number {
  const resetSec = Math.max(1, Math.ceil(windowSec - elapsedSec));

  // Already over the limit on this window's own traffic — nothing decays in time.
  if (previous <= 0 || current >= limit) return resetSec;

  const allowedPrevWeight = (limit - current) / previous;
  if (allowedPrevWeight <= 0) return resetSec;

  const targetElapsed = windowSec * (1 - allowedPrevWeight);
  const wait = Math.ceil(targetElapsed - elapsedSec);
  return Math.min(resetSec, Math.max(1, wait));
}

/**
 * Per-instance counters. Used deliberately in development, where there is a
 * single process and no Upstash, and as a fallback in production when the
 * shared store is unreachable. Mirrors the shared-store algorithm so behaviour
 * is identical in both environments.
 */
type MemoryBucket = {
  windowIndex: number;
  current: number;
  previous: number;
  /** Absolute time after which this bucket can no longer affect a decision. */
  expiresAtSec: number;
};

const memoryBuckets = new Map<string, MemoryBucket>();
let lastMemorySweep = 0;

function sweepMemoryBuckets(nowSec: number): void {
  if (nowSec - lastMemorySweep < 60) return;
  lastMemorySweep = nowSec;
  for (const [key, bucket] of memoryBuckets) {
    if (bucket.expiresAtSec <= nowSec) memoryBuckets.delete(key);
  }
  // Hard ceiling so a flood of unique keys cannot grow the map without bound.
  if (memoryBuckets.size > 50_000) memoryBuckets.clear();
}

function memoryWindow(
  key: string,
  rule: RateLimitRule,
  windowIndex: number,
  nowSec: number,
): { current: number; previous: number } {
  sweepMemoryBuckets(nowSec);

  const expiresAtSec = (windowIndex + 2) * rule.windowSec;
  const bucket = memoryBuckets.get(key);

  if (!bucket || bucket.expiresAtSec <= nowSec) {
    memoryBuckets.set(key, { windowIndex, current: 1, previous: 0, expiresAtSec });
    return { current: 1, previous: 0 };
  }

  if (bucket.windowIndex === windowIndex) {
    bucket.current += 1;
    return { current: bucket.current, previous: bucket.previous };
  }

  const previous = bucket.windowIndex === windowIndex - 1 ? bucket.current : 0;
  bucket.windowIndex = windowIndex;
  bucket.previous = previous;
  bucket.current = 1;
  bucket.expiresAtSec = expiresAtSec;
  return { current: 1, previous };
}

let lastBackendErrorLog = 0;

function logBackendFailure(error: unknown, key: string): void {
  const now = Date.now();
  if (now - lastBackendErrorLog < 30_000) return;
  lastBackendErrorLog = now;
  logger.error("Rate limit store unavailable, using in-memory fallback", {
    action: "rate_limit.backend_error",
    key,
    error: error instanceof Error ? error.message : String(error),
  });
}

/** Evaluates one rule against one scope key. */
export async function evaluateRule(scope: string, rule: RateLimitRule): Promise<RateLimitDecision> {
  const nowSec = Date.now() / 1000;
  const windowIndex = Math.floor(nowSec / rule.windowSec);
  const elapsedSec = nowSec - windowIndex * rule.windowSec;

  const base = `${RATE_PREFIX}${scope}:${rule.name}:${rule.windowSec}`;

  let current: number;
  let previous: number;
  let degraded = false;

  if (isSharedStoreConfigured()) {
    try {
      // Keep the previous bucket readable for the whole of the next window.
      ({ current, previous } = await kvIncrWindow(
        `${base}:${windowIndex}`,
        `${base}:${windowIndex - 1}`,
        rule.windowSec * 2 + 60,
      ));
    } catch (error) {
      logBackendFailure(error, base);
      degraded = true;
      ({ current, previous } = memoryWindow(base, rule, windowIndex, nowSec));
    }
  } else if (process.env.NODE_ENV === "production") {
    // Production without a shared store is a misconfiguration: counters would
    // not be shared across instances. Keep enforcing locally and stay loud.
    logBackendFailure(new Error("No shared rate-limit store configured"), base);
    degraded = true;
    ({ current, previous } = memoryWindow(base, rule, windowIndex, nowSec));
  } else {
    // Development runs a single process, so local counters are exact and avoid
    // rewriting the JSON file fallback on every request.
    ({ current, previous } = memoryWindow(base, rule, windowIndex, nowSec));
  }

  const previousWeight = (rule.windowSec - elapsedSec) / rule.windowSec;
  const weighted = previous * previousWeight + current;
  const resetSec = Math.max(1, Math.ceil(rule.windowSec - elapsedSec));

  if (weighted > rule.limit) {
    return {
      allowed: false,
      limit: rule.limit,
      remaining: 0,
      resetSec,
      windowSec: rule.windowSec,
      retryAfterSec: retryAfterFor(current, previous, rule.limit, rule.windowSec, elapsedSec),
      rule: rule.name,
      degraded,
    };
  }

  return allowedDecision(rule, Math.max(0, Math.floor(rule.limit - weighted)), resetSec, degraded);
}

export type ScopedRule = RateLimitRule & { scope: string };

/**
 * Evaluates every rule in parallel and returns the most restrictive outcome.
 * All rules are evaluated even once one denies, so counters stay consistent and
 * a caller cannot dodge the expensive quota by tripping a cheap one first.
 */
export async function evaluateRules(rules: ScopedRule[]): Promise<RateLimitDecision | null> {
  if (rules.length === 0) return null;

  const decisions = await Promise.all(
    rules.map(({ scope, ...rule }) => evaluateRule(scope, rule)),
  );

  const denied = decisions.filter((decision) => !decision.allowed);
  if (denied.length > 0) {
    return denied.reduce((worst, decision) =>
      decision.retryAfterSec > worst.retryAfterSec ? decision : worst,
    );
  }

  // Report the quota closest to exhaustion so clients see the binding constraint.
  return decisions.reduce((tightest, decision) => {
    const a = decision.remaining / Math.max(1, decision.limit);
    const b = tightest.remaining / Math.max(1, tightest.limit);
    return a < b ? decision : tightest;
  });
}

/** Headers describing the outcome, following the IETF RateLimit header draft plus the legacy X- forms. */
export function rateLimitHeaders(decision: RateLimitDecision): Record<string, string> {
  const headers: Record<string, string> = {
    "RateLimit-Limit": String(decision.limit),
    "RateLimit-Remaining": String(decision.remaining),
    "RateLimit-Reset": String(decision.resetSec),
    "RateLimit-Policy": `${decision.limit};w=${decision.windowSec}`,
    "X-RateLimit-Limit": String(decision.limit),
    "X-RateLimit-Remaining": String(decision.remaining),
    "X-RateLimit-Reset": String(decision.resetSec),
  };
  if (!decision.allowed) {
    headers["Retry-After"] = String(Math.max(1, decision.retryAfterSec));
  }
  return headers;
}

export type LegacyRateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
};

/** @deprecated Prefer `evaluateRules` with a policy from `rate-limit-policy`. */
export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): Promise<LegacyRateLimitResult> {
  const decision = await evaluateRule(key, {
    name: "legacy",
    limit: maxRequests,
    windowSec: Math.ceil(windowMs / 1000),
  });
  return {
    allowed: decision.allowed,
    remaining: decision.remaining,
    retryAfterSec: decision.retryAfterSec,
  };
}

export function rateLimitKey(prefix: string, ip: string, identifier?: string): string {
  return `${prefix}:${ip}:${identifier?.toLowerCase().trim() ?? "*"}`;
}

/** Auth endpoints: 10 attempts per 15 minutes per IP+email */
export const AUTH_RATE_LIMIT = { max: 10, windowMs: 15 * 60 * 1000 };

/** Refresh endpoint: 30 per 15 minutes per IP */
export const REFRESH_RATE_LIMIT = { max: 30, windowMs: 15 * 60 * 1000 };
