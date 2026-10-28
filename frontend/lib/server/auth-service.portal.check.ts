/**
 * Demo-mode auth smoke check (no HTTP server).
 * Run: npx --yes tsx frontend/lib/server/auth-service.portal.check.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Reads the file-backed KV store (no Upstash locally) to pull out a test-only verification token. */
function findVerificationToken(frontendRoot: string, actorId: string): string | null {
  const dataFile = path.join(frontendRoot, ".data", "kv-store.json");
  if (!fs.existsSync(dataFile)) return null;
  const store = JSON.parse(fs.readFileSync(dataFile, "utf8")) as Record<
    string,
    { value: unknown }
  >;
  const prefix = "aptus:email-verify:";
  for (const [key, entry] of Object.entries(store)) {
    if (!key.startsWith(prefix)) continue;
    const payload = entry.value as { actorId?: string } | null;
    if (payload?.actorId === actorId) return key.slice(prefix.length);
  }
  return null;
}

async function main() {
  const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  process.chdir(frontendRoot);

  process.env.AUTH_DEMO_MODE = "true";

  const {
    registerCustomer,
    resolveLoginAttempt,
    checkIdentification,
    sendPasswordRecoveryOtp,
    verifyPasswordRecoveryOtp,
    resetPasswordWithOtp,
    consumeEmailVerificationToken,
  } = await import("./auth-service");
  const { isDemoMode } = await import("./config");
  const { hashPassword, verifyPassword } = await import("./password");

  assert.equal(isDemoMode(), true, "expected demo mode");

  const email = `portal.check.${Date.now()}@example.com`;
  const password = "TestPass123!";
  const phone = `+9689${String(Date.now()).slice(-7)}`;

  const registered = await registerCustomer({
    userType: "individual",
    name: "Portal Check",
    email,
    password,
    phone,
  });
  assert.equal(registered.ok, true, "registerCustomer should succeed in demo mode");
  if (!registered.ok) throw new Error("register failed");
  assert.equal(registered.profile.email, email);
  const actorId = registered.profile.portalAccountId ?? registered.profile.id;

  const duplicate = await registerCustomer({
    userType: "individual",
    name: "Portal Check 2",
    email,
    password: "OtherPass123!",
    phone: "+96891111111",
  });
  assert.equal(duplicate.ok, false, "duplicate email must conflict");
  if (duplicate.ok) throw new Error("expected conflict");
  assert.ok(duplicate.recoveryToken);
  assert.ok(duplicate.maskedEmail);

  const duplicatePhone = await registerCustomer({
    userType: "individual",
    name: "Portal Check Phone",
    email: `portal.check.phone.${Date.now()}@example.com`,
    password: "OtherPass123!",
    phone,
  });
  assert.equal(duplicatePhone.ok, false, "duplicate person phone must conflict");
  if (duplicatePhone.ok) throw new Error("expected phone conflict");
  assert.equal(duplicatePhone.conflictField, "mobile");

  // Freshly registered account must not be able to sign in before verifying email.
  const loginBeforeVerify = await resolveLoginAttempt(email, password);
  assert.equal(loginBeforeVerify.status, "email_not_verified", "login must gate on unverified email");

  const verifyToken = findVerificationToken(frontendRoot, actorId);
  assert.ok(verifyToken, "expected a verification token to have been issued");
  const consumed = await consumeEmailVerificationToken(verifyToken!);
  assert.ok(consumed, "verification token should be valid");
  assert.equal(consumed!.email, email);

  const login = await resolveLoginAttempt(email, password);
  assert.equal(login.status, "success", "login should succeed once email is verified");

  const bad = await resolveLoginAttempt(email, "WrongPass999!");
  assert.equal(bad.status, "invalid_password");

  const otpSend = await sendPasswordRecoveryOtp(duplicate.recoveryToken, "email");
  assert.equal(otpSend.ok, true, "OTP send should succeed in demo");
  if (!otpSend.ok) throw new Error("otp send failed");
  assert.ok(otpSend.demoCode);

  const verified = await verifyPasswordRecoveryOtp(duplicate.recoveryToken, otpSend.demoCode!);
  assert.equal(verified, true);

  const newPassword = "ResetPass123!";
  const resetProfile = await resetPasswordWithOtp(duplicate.recoveryToken, newPassword);
  assert.ok(resetProfile);

  const loginAfterReset = await resolveLoginAttempt(email, newPassword);
  assert.equal(loginAfterReset.status, "success");

  const hash = hashPassword(password);
  assert.equal(verifyPassword(password, hash), true);
  assert.equal(verifyPassword("nope", hash), false);

  // Identify check is Odoo-backed in live mode; in demo it only matches pending email.
  const identify = await checkIdentification("individual", phone, email);
  assert.equal(identify.exists, true);

  console.log("auth-service.portal.check: ok", {
    email,
    portalAccountId: registered.profile.portalAccountId,
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
