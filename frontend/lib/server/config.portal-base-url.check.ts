/**
 * Email verification links must resolve to the deployed app, not a parked domain.
 * Run: npx --yes tsx lib/server/config.portal-base-url.check.ts
 */
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";

const configSource = fs.readFileSync(path.join(__dirname, "config.ts"), "utf8");
assert.match(configSource, /VERCEL_URL/, "getPortalBaseUrl must fall back to VERCEL_URL on Vercel");
assert.match(configSource, /NEXT_PUBLIC_SITE_URL/);

const authSource = fs.readFileSync(path.join(__dirname, "auth-service.ts"), "utf8");
assert.match(authSource, /getPortalBaseUrl\(\).*\/verify-email/);
assert.doesNotMatch(
  authSource,
  /function getPortalBaseUrl/,
  "auth-service must import shared getPortalBaseUrl from config",
);

console.log("config.portal-base-url.check: ok");
