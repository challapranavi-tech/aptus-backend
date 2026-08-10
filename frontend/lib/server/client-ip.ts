import { createHash } from "crypto";

/**
 * Trusted client IP resolution.
 *
 * `X-Forwarded-For` is append-only and fully attacker-controlled on the left,
 * so reading `xff.split(",")[0]` lets anyone forge a fresh identity per request
 * and walk straight through IP rate limits. We only trust hops we can attribute
 * to infrastructure we actually run in front of the app.
 */

export type ResolvedClientIp = {
  /** Normalized address used for logging. `unknown` when nothing trustworthy was found. */
  ip: string;
  /** Rate-limit scope: IPv6 collapsed to its /64 so a single allocation is one bucket. */
  scope: string;
  /** Which header the value came from — useful when debugging a proxy misconfiguration. */
  source: string;
  /** False when the value could have been forged by the caller. */
  trusted: boolean;
};

const UNKNOWN: ResolvedClientIp = {
  ip: "unknown",
  scope: "unknown",
  source: "none",
  trusted: false,
};

function splitForwarded(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

/** Strips brackets, zone ids and any `:port` suffix, and unwraps IPv4-mapped IPv6. */
export function normalizeIp(raw: string): string {
  let value = raw.trim().toLowerCase();
  if (!value) return "";

  const bracketed = value.match(/^\[(.+?)\](?::\d+)?$/);
  if (bracketed) {
    value = bracketed[1];
  } else if (/^\d{1,3}(\.\d{1,3}){3}:\d+$/.test(value)) {
    value = value.slice(0, value.lastIndexOf(":"));
  }

  value = value.split("%")[0];

  const mapped = value.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (mapped) value = mapped[1];

  if (!isIpv4(value) && !isIpv6(value)) return "";
  return value;
}

function isIpv4(value: string): boolean {
  const parts = value.split(".");
  if (parts.length !== 4) return false;
  return parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255);
}

function isIpv6(value: string): boolean {
  return value.includes(":") && /^[0-9a-f:]+$/.test(value);
}

/**
 * Collapses IPv6 to its /64 prefix. Residential IPv6 customers routinely get a
 * whole /64 (or larger), so limiting a single address would be trivially evaded
 * by rotating within the allocation.
 */
export function ipRateLimitScope(ip: string): string {
  if (!ip || ip === "unknown") return "unknown";
  if (!isIpv6(ip)) return ip;

  const expanded = expandIpv6(ip);
  if (!expanded) return ip;
  return `${expanded.slice(0, 4).join(":")}::/64`;
}

function expandIpv6(ip: string): string[] | null {
  const [head, tail, ...rest] = ip.split("::");
  if (rest.length > 0) return null;

  const headGroups = head ? head.split(":").filter(Boolean) : [];
  const tailGroups = tail ? tail.split(":").filter(Boolean) : [];

  if (tail === undefined) {
    return headGroups.length === 8 ? headGroups : null;
  }

  const missing = 8 - headGroups.length - tailGroups.length;
  if (missing < 0) return null;
  return [...headGroups, ...Array(missing).fill("0"), ...tailGroups];
}

function firstValid(values: string[]): string | null {
  for (const value of values) {
    const normalized = normalizeIp(value);
    if (normalized) return normalized;
  }
  return null;
}

function trustedProxyHops(): number {
  const raw = Number(process.env.RATE_LIMIT_TRUSTED_PROXY_HOPS ?? "");
  return Number.isInteger(raw) && raw > 0 ? raw : 0;
}

export function resolveClientIp(request: Request): ResolvedClientIp {
  const headers = request.headers;
  const forwarded = splitForwarded(headers.get("x-forwarded-for"));

  const build = (ip: string, source: string, trusted: boolean): ResolvedClientIp => ({
    ip,
    scope: ipRateLimitScope(ip),
    source,
    trusted,
  });

  // Explicit operator configuration wins: count N hops back from the right,
  // since our own edge appends the address it actually received the request from.
  const hops = trustedProxyHops();
  if (hops > 0 && forwarded.length >= hops) {
    const ip = normalizeIp(forwarded[forwarded.length - hops]);
    if (ip) return build(ip, `x-forwarded-for[-${hops}]`, true);
  }

  // Vercel stamps x-vercel-id on every request it proxies and overwrites
  // x-vercel-forwarded-for, so both are safe once we've seen x-vercel-id.
  if (headers.get("x-vercel-id")) {
    const ip =
      firstValid(splitForwarded(headers.get("x-vercel-forwarded-for"))) ??
      firstValid(splitForwarded(headers.get("x-real-ip")));
    if (ip) return build(ip, "vercel", true);
  }

  // Cloudflare likewise overwrites cf-connecting-ip and always sets cf-ray.
  if (headers.get("cf-ray")) {
    const ip = firstValid(splitForwarded(headers.get("cf-connecting-ip")));
    if (ip) return build(ip, "cloudflare", true);
  }

  // No recognised edge. The rightmost XFF entry is the only one a reverse proxy
  // could have appended itself, so it is the least forgeable choice available.
  if (forwarded.length > 0) {
    const ip = firstValid([...forwarded].reverse());
    if (ip) return build(ip, "x-forwarded-for[last]", false);
  }

  const realIp = firstValid(splitForwarded(headers.get("x-real-ip")));
  if (realIp) return build(realIp, "x-real-ip", false);

  return UNKNOWN;
}

let cachedSalt: string | null = null;

function ipHashSalt(): string {
  if (cachedSalt) return cachedSalt;
  cachedSalt =
    process.env.RATE_LIMIT_IP_SALT?.trim() ||
    process.env.JWT_SECRET?.trim() ||
    process.env.PII_ENCRYPTION_KEY?.trim() ||
    "aptus-rate-limit-v1";
  return cachedSalt;
}

/**
 * Rate-limit buckets only need a stable, opaque key. IP addresses and email
 * addresses are both personal data that this app already handles carefully
 * elsewhere, so the shared store never sees either in the clear.
 */
export function hashIdentifier(value: string): string {
  return createHash("sha256").update(`${ipHashSalt()}:${value}`).digest("hex").slice(0, 20);
}

export function hashIpScope(scope: string): string {
  if (!scope || scope === "unknown") return "unknown";
  return hashIdentifier(scope);
}

const allowlistCache = new Map<string, boolean>();

/** Comma-separated exact IPs or IPv6 /64 scopes exempt from rate limiting (monitoring, office egress). */
export function isRateLimitAllowlisted(resolved: ResolvedClientIp): boolean {
  const raw = process.env.RATE_LIMIT_ALLOWLIST_IPS?.trim();
  if (!raw || !resolved.trusted) return false;

  const cacheKey = `${raw}|${resolved.scope}`;
  const cached = allowlistCache.get(cacheKey);
  if (cached !== undefined) return cached;

  const entries = raw.split(",").map((entry) => entry.trim().toLowerCase()).filter(Boolean);
  const allowed = entries.some((entry) => {
    if (entry === resolved.scope) return true;
    const normalized = normalizeIp(entry);
    return Boolean(normalized) && normalized === resolved.ip;
  });

  if (allowlistCache.size > 64) allowlistCache.clear();
  allowlistCache.set(cacheKey, allowed);
  return allowed;
}
