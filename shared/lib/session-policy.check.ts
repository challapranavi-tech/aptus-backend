/**
 * Runnable check: session policy invariants.
 * Run: npx --yes tsx shared/lib/session-policy.check.ts
 */
import assert from "node:assert/strict";
import {
  HAS_END_USER_SESSIONS,
  SERVER_ONLY_SECRET_ENV_NAMES,
} from "./session-policy";

assert.equal(HAS_END_USER_SESSIONS, true);
assert.ok(SERVER_ONLY_SECRET_ENV_NAMES.includes("ODOO_API_KEY"));
assert.ok(SERVER_ONLY_SECRET_ENV_NAMES.includes("ODOO_REVALIDATE_TOKEN"));
assert.ok(SERVER_ONLY_SECRET_ENV_NAMES.includes("JWT_PRIVATE_KEY"));
assert.ok(SERVER_ONLY_SECRET_ENV_NAMES.includes("PII_ENCRYPTION_KEY"));
for (const name of SERVER_ONLY_SECRET_ENV_NAMES) {
  assert.ok(!name.startsWith("NEXT_PUBLIC_"), `${name} must stay server-only`);
}

console.log("session-policy.check: ok");
