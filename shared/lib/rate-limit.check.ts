/**
 * Runnable self-check for the rate limiter.
 * Run: npx --yes tsx shared/lib/rate-limit.check.ts
 */
import assert from "node:assert/strict";
import {
  __resetRateLimitStoreForTests,
  clientIp,
  consume,
  consumeAsync,
  identityKey,
  rateLimitHeaders,
} from "./rate-limit.ts";

async function main() {
  __resetRateLimitStoreForTests();

  const headers = new Headers({
    "x-forwarded-for": "203.0.113.9, 10.0.0.1",
    "x-real-ip": "198.51.100.1",
  });
  // Prefer platform-asserted X-Real-IP over client-influenced XFF when both present.
  assert.equal(clientIp(headers), "198.51.100.1", "prefer X-Real-IP over XFF");
  assert.equal(
    clientIp(new Headers({ "x-forwarded-for": "203.0.113.9" })),
    "203.0.113.9",
    "XFF used when trusted and no real-ip",
  );
  assert.equal(
    clientIp(
      new Headers({
        "cf-connecting-ip": "198.51.100.7",
        "x-forwarded-for": "1.2.3.4",
      }),
    ),
    "198.51.100.7",
    "prefer CF-Connecting-IP",
  );
  assert.equal(clientIp(new Headers()), "unknown");

  const policy = { limit: 2, windowMs: 60_000 };
  const t0 = 1_000_000;
  assert.equal(consume("k", policy, t0).ok, true);
  assert.equal(consume("k", policy, t0 + 1).ok, true);
  const blocked = consume("k", policy, t0 + 2);
  assert.equal(blocked.ok, false);
  assert.equal(blocked.remaining, 0);
  assert.ok(blocked.retryAfterSec >= 1);

  const afterReset = consume("k", policy, t0 + policy.windowMs);
  assert.equal(afterReset.ok, true, "window rollover allows traffic again");

  const hdrs = rateLimitHeaders(blocked);
  assert.equal(hdrs["X-RateLimit-Limit"], "2");
  assert.equal(hdrs["X-RateLimit-Remaining"], "0");
  assert.ok(hdrs["Retry-After"]);

  assert.equal(identityKey("same"), identityKey("same"));
  assert.notEqual(identityKey("a"), identityKey("b"));

  // Async path falls back to memory when Upstash env is unset.
  __resetRateLimitStoreForTests();
  assert.equal((await consumeAsync("async-k", policy, t0)).ok, true);
  assert.equal((await consumeAsync("async-k", policy, t0 + 1)).ok, true);
  assert.equal((await consumeAsync("async-k", policy, t0 + 2)).ok, false);

  console.log("rate-limit.check: ok");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
