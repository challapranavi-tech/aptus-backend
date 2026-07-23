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
  assert.deepStrictEqual(
    new Set(o),
    new Set(["https://aptusinfotech.com", "https://www.aptusinfotech.com"]),
  );
  assert.ok(!o.includes("http://localhost:3000"), "prod must not auto-allow localhost");
}

// Single env host must allow both www and apex (careers fetch fails otherwise).
process.env.APTUS_FRONTEND_URL = "https://www.aptusinfotech.com/";
{
  const o = allowedOrigins();
  assert.ok(o.includes("https://www.aptusinfotech.com"));
  assert.ok(
    o.includes("https://aptusinfotech.com"),
    "apex must be allowed when only www is configured",
  );
}

process.env.APTUS_FRONTEND_URL = "https://aptusinfotech.com";
{
  const o = allowedOrigins();
  assert.ok(
    o.includes("https://www.aptusinfotech.com"),
    "www alias when only apex set",
  );
}

// Dev mode auto-allows localhost.
(process.env as Record<string, string>).NODE_ENV = "development";
process.env.APTUS_FRONTEND_URL = "https://www.aptusinfotech.com/";
{
  assert.ok(allowedOrigins().includes("http://localhost:3000"), "dev should allow localhost");
}

console.log("api-cors.check: OK");
