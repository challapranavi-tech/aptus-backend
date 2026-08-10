import { NextResponse } from "next/server";
import { REFRESH_COOKIE, SESSION_COOKIE } from "@/lib/cookie-names";
import { hashIdentifier, hashIpScope, isRateLimitAllowlisted, resolveClientIp } from "./client-ip";
import { verifyAccessToken, verifyRefreshToken } from "./jwt";
import { logger } from "./logger";
import {
  evaluateRules,
  rateLimitHeaders,
  type RateLimitDecision,
  type RateLimitRule,
  type ScopedRule,
} from "./rate-limit";
import {
  DEFAULT_POLICY,
  GLOBAL_IP_RULE,
  resolvePolicy,
  type RateLimitPolicy,
} from "./rate-limit-policy";

export type RateLimitOutcome =
  | { ok: true; headers: Record<string, string> }
  | { ok: false; response: NextResponse };

type IdentifiedRequest = {
  cookieValue: (name: string) => string | undefined;
  headers: Headers;
};

/**
 * Best-effort user identification for rate limiting only.
 *
 * This is not an authorization decision — routes still perform their own session
 * checks. We accept an unexpired refresh token as proof of identity because many
 * portal calls are made with cookies alone, and attributing those to a user is
 * far more accurate than falling back to a shared NAT address.
 */
export async function identifyUser(request: IdentifiedRequest): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const claims = await verifyAccessToken(authHeader.slice(7).trim());
    if (claims) return claims.sub;
  }

  const refresh = request.cookieValue(REFRESH_COOKIE);
  if (refresh) {
    const claims = await verifyRefreshToken(refresh);
    if (claims) return claims.sub;
  }

  const legacy = request.cookieValue(SESSION_COOKIE);
  if (legacy) {
    const claims = await verifyAccessToken(legacy);
    if (claims) return claims.sub;
  }

  return null;
}

function describeWait(seconds: number): string {
  if (seconds <= 60) return `${Math.max(1, seconds)} seconds`;
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  const hours = Math.ceil(minutes / 60);
  return `${hours} hour${hours === 1 ? "" : "s"}`;
}

/** Builds the 429 response, including the headers a well-behaved client needs to back off. */
export function rateLimitExceededResponse(
  decision: RateLimitDecision,
  traceId?: string,
): NextResponse {
  const retryAfter = Math.max(1, decision.retryAfterSec);
  const headers: Record<string, string> = {
    ...rateLimitHeaders(decision),
    // A 429 is transient and must never be cached or reused for another client.
    "Cache-Control": "no-store",
    Vary: "Authorization, Cookie",
  };
  if (traceId) headers["x-trace-id"] = traceId;

  return NextResponse.json(
    {
      error: `Too many requests. Please try again in ${describeWait(retryAfter)}.`,
      code: "RATE_LIMITED",
      retryAfter,
      ...(traceId ? { traceId } : {}),
    },
    { status: 429, headers },
  );
}

let lastUntrustedIpWarning = 0;

/**
 * In production an untrusted address means IP limits can be sidestepped by
 * forging `X-Forwarded-For`. That is a deployment misconfiguration rather than a
 * code fault, so surface it loudly instead of failing requests.
 */
function warnIfClientIpUntrusted(client: ReturnType<typeof resolveClientIp>): void {
  if (process.env.NODE_ENV !== "production" || client.trusted) return;

  const now = Date.now();
  if (now - lastUntrustedIpWarning < 300_000) return;
  lastUntrustedIpWarning = now;

  logger.warn(
    "Client IP could not be established from a trusted source; IP rate limits are weakened. " +
      "Set RATE_LIMIT_TRUSTED_PROXY_HOPS to the number of proxies in front of this app.",
    { action: "rate_limit.untrusted_ip", ipSource: client.source },
  );
}

function scopeRules(rules: RateLimitRule[] | undefined, scope: string): ScopedRule[] {
  if (!rules) return [];
  return rules.map((rule) => ({ ...rule, scope }));
}

export type EnforceOptions = {
  /** Overrides the policy looked up from the path. */
  policy?: RateLimitPolicy;
  /** Supplies the user id when the caller has already resolved the session. */
  userId?: string | null;
  traceId?: string;
};

/**
 * Applies the IP rules, the per-user rules when a session is present, and the
 * cross-endpoint IP ceiling. Returns headers to merge into a successful
 * response, or a ready-to-send 429.
 */
export async function enforceApiRateLimit(
  request: Request,
  pathname: string,
  options: EnforceOptions = {},
): Promise<RateLimitOutcome> {
  const method = request.method.toUpperCase();

  // Preflight and cache-validation requests carry no cost and must not consume quota.
  if (method === "OPTIONS" || method === "HEAD") {
    return { ok: true, headers: {} };
  }

  const client = resolveClientIp(request);
  warnIfClientIpUntrusted(client);

  if (isRateLimitAllowlisted(client)) {
    return { ok: true, headers: {} };
  }

  const policy = options.policy ?? resolvePolicy(pathname, method);
  const userId =
    options.userId ??
    (await identifyUser({
      headers: request.headers,
      cookieValue: (name) => readCookie(request.headers.get("cookie"), name),
    }));

  const ipScope = `ip:${hashIpScope(client.scope)}:${policy.name}`;
  const rules: ScopedRule[] = scopeRules(policy.ip, ipScope);

  if (userId) {
    rules.push(...scopeRules(policy.user, `user:${userId}:${policy.name}`));
  }

  if (!policy.exemptFromGlobal) {
    rules.push({ ...GLOBAL_IP_RULE, scope: `ip:${hashIpScope(client.scope)}:all` });
  }

  const decision = await evaluateRules(rules);
  if (!decision) return { ok: true, headers: {} };

  if (!decision.allowed) {
    logger.warn("Rate limit exceeded", {
      action: "rate_limit.blocked",
      path: pathname,
      method,
      policy: policy.name,
      rule: decision.rule,
      retryAfterSec: decision.retryAfterSec,
      ip: client.ip,
      ipSource: client.source,
      ipTrusted: client.trusted,
      userId: userId ?? undefined,
      degraded: decision.degraded,
      traceId: options.traceId,
    });
    return { ok: false, response: rateLimitExceededResponse(decision, options.traceId) };
  }

  return { ok: true, headers: rateLimitHeaders(decision) };
}

/**
 * Enforces a limit tied to something from the request body, such as the email
 * being logged into. IP rules alone cannot stop a distributed attack on one
 * account, and user rules do not exist before authentication succeeds.
 */
export async function enforceIdentifierLimit(
  rule: RateLimitRule,
  identifier: string,
): Promise<RateLimitOutcome> {
  const normalized = identifier.trim().toLowerCase();
  if (!normalized) return { ok: true, headers: {} };

  const decision = await evaluateRules([
    { ...rule, scope: `id:${hashIdentifier(normalized)}` },
  ]);
  if (!decision) return { ok: true, headers: {} };

  if (!decision.allowed) {
    logger.warn("Identifier rate limit exceeded", {
      action: "rate_limit.identifier_blocked",
      rule: rule.name,
      retryAfterSec: decision.retryAfterSec,
    });
    return { ok: false, response: rateLimitExceededResponse(decision) };
  }

  return { ok: true, headers: rateLimitHeaders(decision) };
}

function readCookie(header: string | null, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;
    if (part.slice(0, separator).trim() !== name) continue;
    return decodeURIComponent(part.slice(separator + 1).trim());
  }
  return undefined;
}

export { DEFAULT_POLICY };
