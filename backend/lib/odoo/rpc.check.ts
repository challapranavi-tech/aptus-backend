/**
 * Runnable self-check for Odoo URL normalization.
 * Run: npx --yes tsx backend/lib/odoo/rpc.check.ts
 */
import assert from "node:assert/strict";
import { normalizeOdooBaseUrl } from "./rpc";

const host = "https://aptusinfotech-staging-35193445.dev.odoo.com";

assert.equal(normalizeOdooBaseUrl(host), host);
assert.equal(normalizeOdooBaseUrl(`${host}/`), host);
assert.equal(normalizeOdooBaseUrl(`${host}/odoo`), host, "strip /odoo UI path");
assert.equal(
  normalizeOdooBaseUrl(`${host}/odoo/`),
  host,
  "strip /odoo/ trailing",
);
assert.equal(
  normalizeOdooBaseUrl(` ${host}/odoo `),
  host,
  "trim whitespace around pasted URL",
);
assert.equal(
  normalizeOdooBaseUrl(`${host}/web`),
  host,
  "strip /web UI path",
);
assert.equal(
  normalizeOdooBaseUrl(`${host}/web/login`),
  host,
  "strip /web/login",
);
assert.equal(
  normalizeOdooBaseUrl(`${host}/odoo/web#action=1`),
  host,
  "strip /odoo/web + fragment path",
);

console.log("odoo rpc self-check passed");
