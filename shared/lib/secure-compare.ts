import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Constant-time comparison for secrets / API tokens (OWASP).
 *
 * Hashes both sides first so unequal lengths do not short-circuit and leak
 * length information. Never log `a` or `b`.
 */
export function secureCompare(a: string, b: string): boolean {
  const digest = (value: string) =>
    createHash("sha256").update(value, "utf8").digest();
  return timingSafeEqual(digest(a), digest(b));
}

/**
 * True when a server-only secret env var is present and non-empty.
 * Does not return or log the value.
 */
export function hasSecret(envName: string): boolean {
  const value = process.env[envName];
  return typeof value === "string" && value.length > 0;
}
