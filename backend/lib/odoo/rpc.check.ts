/**
 * Runnable self-check for Odoo URL normalization + JSON-2 arg mapping.
 * Run: npx --yes tsx backend/lib/odoo/rpc.check.ts
 */
import assert from "node:assert/strict";
import { json2BodyFromExecuteKw, normalizeOdooBaseUrl } from "./rpc";

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

assert.deepEqual(
  json2BodyFromExecuteKw("create", [{ name: "Lead" }]),
  { vals_list: [{ name: "Lead" }] },
);
assert.deepEqual(
  json2BodyFromExecuteKw("search_read", [[["code", "=", "x"]]], {
    fields: ["id"],
    limit: 1,
  }),
  { domain: [["code", "=", "x"]], fields: ["id"], limit: 1 },
);
assert.deepEqual(
  json2BodyFromExecuteKw("write", [[42], { name: "n" }]),
  { ids: [42], vals: { name: "n" } },
);
assert.deepEqual(
  json2BodyFromExecuteKw("next_by_code", ["request.quote"]),
  { sequence_code: "request.quote" },
);
assert.deepEqual(
  json2BodyFromExecuteKw("message_post", [7], { body: "<p>hi</p>" }),
  { body: "<p>hi</p>", ids: [7] },
);

console.log("odoo rpc self-check passed");
