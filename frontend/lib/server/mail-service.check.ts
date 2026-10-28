/**
 * Portal mail channel selection smoke check.
 * Run: npx --yes tsx lib/server/mail-service.check.ts
 */
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";

async function main() {
  const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  process.chdir(frontendRoot);

  delete process.env.RESEND_API_KEY;
  delete process.env.FROM_EMAIL;
  delete process.env.SMTP_HOST;
  delete process.env.SMTP_FROM;

  // Fresh import after env wipe is awkward with ESM cache — test helpers via dynamic eval of config functions
  const { isPortalMailConfigured } = await import("./mail-service");

  // Without keys, mail is not configured (may still be true if .env.local was loaded by Next — this script does not load dotenv)
  // Assert the exported helper exists and returns a boolean.
  assert.equal(typeof isPortalMailConfigured(), "boolean");

  process.env.RESEND_API_KEY = "re_test";
  process.env.FROM_EMAIL = "Aptus Infotech <no-reply@aptusinfotech.com>";

  // Re-import won't refresh module-level env reads (they're function-local) — helper reads env each call.
  assert.equal(isPortalMailConfigured(), true);

  delete process.env.RESEND_API_KEY;
  process.env.SMTP_HOST = "smtp.example.com";
  process.env.SMTP_FROM = "Aptus Infotech <no-reply@aptusinfotech.com>";
  assert.equal(isPortalMailConfigured(), true);

  delete process.env.SMTP_HOST;
  delete process.env.SMTP_FROM;
  delete process.env.FROM_EMAIL;
  assert.equal(isPortalMailConfigured(), false);

  console.log("mail-service.check: ok");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
