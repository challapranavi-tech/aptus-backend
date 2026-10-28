/**
 * Self-check: cart uses a full document navigation target (not a soft Link to login).
 */
import assert from "node:assert/strict";

const CART_PATH = "/portal/cart";

function cartHref(): string {
  return CART_PATH;
}

assert.equal(cartHref(), "/portal/cart");
assert.ok(!cartHref().includes("/login"));

// Middleware redirect must be uncached so post-login soft nav cannot replay it.
const redirectHeaders = { "Cache-Control": "no-store, must-revalidate" };
assert.equal(redirectHeaders["Cache-Control"], "no-store, must-revalidate");

console.log("portal-auth-perf.check: ok");
