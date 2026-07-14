/**
 * Runnable self-check for allowedOrigins() CORS parsing.
 * Run: npx tsx backend/lib/api-cors.check.ts
 */
import assert from "node:assert";
import { allowedOrigins } from "./api-cors";

// Comma-separated list + trailing-slash normalization, prod mode (no localhost).
(process.env as Record<string, string>).NODE_ENV = "production";
process.env.APTUS_FRONTEND_URL = "https://aptusinfotech.com, https://www.aptusinfotech.com/";
delete process.env.NEXT_PUBLIC_SITE_URL;
{
  const o = allowedOrigins();
  assert.deepStrictEqual(o, ["https://aptusinfotech.com", "https://www.aptusinfotech.com"]);
  assert.ok(!o.includes("http://localhost:3000"), "prod must not auto-allow localhost");
}

// Dev mode auto-allows localhost.
(process.env as Record<string, string>).NODE_ENV = "development";
process.env.APTUS_FRONTEND_URL = "https://aptusinfotech.com";
{
  assert.ok(allowedOrigins().includes("http://localhost:3000"), "dev should allow localhost");
}

console.log("api-cors.check: OK");
