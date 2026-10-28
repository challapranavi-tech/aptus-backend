import assert from "node:assert/strict";
import { resolvePolicy } from "./rate-limit-policy";

// Method-specific overrides must win over the method-agnostic fallback for
// the same path (write traffic should never fall through to a read policy).
assert.equal(resolvePolicy("/api/cart", "PUT").name, "cart_write");
assert.equal(resolvePolicy("/api/cart", "DELETE").name, "session_write");
assert.equal(resolvePolicy("/api/cart", "GET").name, "session_read");

assert.equal(resolvePolicy("/api/refunds", "POST").name, "portal_write");
assert.equal(resolvePolicy("/api/refunds", "GET").name, "portal_read");

assert.equal(resolvePolicy("/api/auth/verify-email", "POST").name, "auth_otp_reset");
// GET is a stateless redirect (no token consumption) — default policy is enough.
assert.equal(resolvePolicy("/api/auth/verify-email", "GET").name, "default_api");

// Pre-existing routes, guarding against regressions from reordering ROUTES.
assert.equal(resolvePolicy("/api/auth/login", "POST").name, "auth_login");
assert.equal(resolvePolicy("/api/admin/orders", "GET").name, "admin");
assert.equal(resolvePolicy("/api/payments/webhook", "POST").name, "webhook");

// Unmatched paths fall back to the generic default so new routes are never unprotected.
assert.equal(resolvePolicy("/api/some-future-route", "POST").name, "default_api");

console.log("rate-limit-policy.check: ok");
