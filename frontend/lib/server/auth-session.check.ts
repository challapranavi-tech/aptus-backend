/**
 * Auth session security smoke check (no HTTP server).
 * Run: npx --yes tsx frontend/lib/server/auth-session.check.ts
 */
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";

async function main() {
  const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  process.chdir(frontendRoot);

  process.env.AUTH_DEMO_MODE = "true";

  const { signTokenPair, verifyAccessToken, verifyRefreshToken } = await import("./jwt");
  const { revokeToken, isTokenRevoked } = await import("./token-blocklist");
  const {
    registerRefreshToken,
    getRefreshRecord,
    revokeAllUserRefreshTokens,
  } = await import("./refresh-tokens");
  const {
    registerCustomer,
    sendPasswordRecoveryOtp,
    verifyPasswordRecoveryOtp,
    resetPasswordWithOtp,
  } = await import("./auth-service");

  const claims = {
    sub: `check-${Date.now()}`,
    email: "session.check@example.com",
    name: "Session Check",
  };

  // A05: refresh JWT exp matches remember-me / session TTL
  const shortPair = signTokenPair(claims, { refreshMaxAgeSec: 3600 });
  assert.equal(shortPair.refreshMaxAgeSec, 3600);
  const refreshParts = shortPair.refreshToken.split(".");
  const refreshPayload = JSON.parse(
    Buffer.from(refreshParts[1]!, "base64url").toString("utf8"),
  ) as { exp: number; iat: number; typ: string; alg?: string };
  assert.equal(refreshPayload.typ, "refresh");
  assert.ok(
    Math.abs(refreshPayload.exp - refreshPayload.iat - 3600) <= 1,
    "refresh JWT exp must match refreshMaxAgeSec",
  );

  // A09: reject non-RS256 alg in header (tampered header, broken sig → null)
  const badAlgHeader = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString(
    "base64url",
  );
  const forged = `${badAlgHeader}.${refreshParts[1]}.${refreshParts[2]}`;
  assert.equal(await verifyRefreshToken(forged), null);

  // A02: access JTI revoke is visible via isTokenRevoked + verifyAccessToken
  const accessClaims = await verifyAccessToken(shortPair.accessToken);
  assert.ok(accessClaims);
  const exp = Math.floor(Date.now() / 1000) + 900;
  await revokeToken(accessClaims!.jti, exp);
  assert.equal(await isTokenRevoked(accessClaims!.jti), true);
  assert.equal(await verifyAccessToken(shortPair.accessToken), null);

  // A01: password reset revokes refresh tokens for the actor
  const email = `session.reset.${Date.now()}@example.com`;
  const password = "TestPass123!";
  const phone = `+9689${String(Date.now()).slice(-7)}`;
  const registered = await registerCustomer({
    userType: "individual",
    name: "Reset Check",
    email,
    password,
    phone,
  });
  assert.equal(registered.ok, true);
  if (!registered.ok) throw new Error("register failed");

  const actorId = registered.profile.portalAccountId ?? registered.profile.id;
  const jti = `rjti-${Date.now()}`;
  await registerRefreshToken(jti, actorId, Math.floor(Date.now() / 1000) + 3600);
  assert.ok(await getRefreshRecord(jti));

  // Force conflict recovery path to get a recovery token for this email
  const duplicate = await registerCustomer({
    userType: "individual",
    name: "Reset Check 2",
    email,
    password: "OtherPass123!",
    phone: "+96892222222",
  });
  assert.equal(duplicate.ok, false);
  if (duplicate.ok) throw new Error("expected conflict");

  const otpSend = await sendPasswordRecoveryOtp(duplicate.recoveryToken, "email");
  assert.equal(otpSend.ok, true);
  if (!otpSend.ok || !otpSend.demoCode) throw new Error("otp send failed");
  assert.equal(await verifyPasswordRecoveryOtp(duplicate.recoveryToken, otpSend.demoCode), true);

  const resetProfile = await resetPasswordWithOtp(duplicate.recoveryToken, "ResetPass123!");
  assert.ok(resetProfile);
  assert.equal(await getRefreshRecord(jti), null, "password reset must revoke refresh JTIs");

  // Sanity: explicit revoke helper still works
  const jti2 = `rjti2-${Date.now()}`;
  await registerRefreshToken(jti2, actorId, Math.floor(Date.now() / 1000) + 3600);
  await revokeAllUserRefreshTokens(actorId);
  assert.equal(await getRefreshRecord(jti2), null);

  console.log("auth-session.check: ok");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
