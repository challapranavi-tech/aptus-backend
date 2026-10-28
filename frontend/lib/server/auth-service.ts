import { randomUUID } from "crypto";
import { DEFAULT_USER_ROLE, getPortalBaseUrl, isDemoMode, isTestOtpEnabled } from "./config";
import { checkPartnerPortalAccess } from "./odoo/partner-access";
import {
  createPartner,
  findPartnerByCrNumber,
  findPartnerByEmail,
  findPartnerByPhone,
  findPartnerByPortalAccountId,
  findPartnerForLogin,
  findPartnerSessionByPortalAccountId,
  getPartnerPasswordHash,
  writePartnerPortalSetup,
  getPartnerPortalMeta,
  mapPartnerToProfile,
  partnerPhone,
  readPartnerProfile,
  setPartnerPasswordHash,
  softDeletePartnerPortal,
  updatePartner,
  updatePartnerPortalMeta,
} from "./odoo/partners";
import { kvDel, kvGet, kvSet, kvSetNx } from "./kv-store";
import { sendPortalEmail } from "./mail-service";
import { maskEmail, maskPhone } from "./mask-pii";
import {
  formatEmailVerificationEmail,
  formatNewDeviceLoginEmail,
  formatPasswordResetEmail,
  formatPasswordResetOtpEmail,
  formatRegistrationSuccessfulEmail,
} from "./order-notification";
import { hashPassword, verifyPassword } from "./password";
import {
  clearRecoverySession,
  createRecoverySession,
  getRecoverySession,
  isRecoveryOtpVerified,
  issueOtp,
  verifyOtp,
} from "./recovery-sessions";
import { readAuditForUser, writeAudit } from "./audit-log";
import { logger } from "./logger";
import { revokeAllUserRefreshTokens } from "./refresh-tokens";
import type { ClientProfile, ProfileUpdateInput, RegisterInput, UserType } from "./types";
import type { SessionClaims } from "./jwt";

function odooString(value: string | false | undefined): string {
  return typeof value === "string" ? value : "";
}

async function resolveRecoveryCustomerName(session: {
  accountEmail: string;
  identifier: string;
}): Promise<string> {
  if (isDemoMode()) {
    const account = await getDemoAccountByEmail(session.accountEmail);
    return account?.profile.name ?? session.accountEmail;
  }
  const partner = await findPartnerByEmail(session.accountEmail);
  return partner?.name?.trim() || session.accountEmail;
}

/** Best-effort customer email — never blocks registration/reset. */
async function sendAuthLifecycleEmail(
  to: string,
  content: { subject: string; body: string },
  action: string,
): Promise<void> {
  try {
    const result = await sendPortalEmail({
      to,
      subject: content.subject,
      body: content.body,
    });
    if (!result.sent) {
      logger.warn("Auth lifecycle email not sent", {
        action,
        channel: result.channel,
        error: result.error,
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn("Auth lifecycle email failed", { action, error: message });
  }
}

const EMAIL_VERIFICATION_TTL_SEC = 30 * 60; // 30 minutes — single-use, time-limited (spec §11)
const NEW_DEVICE_KNOWN_IP_TTL_SEC = 180 * 24 * 60 * 60; // remember known IPs for 180 days

type EmailVerificationTokenPayload = {
  actorId: string;
  email: string;
};

function emailVerificationTokenKey(token: string): string {
  return `aptus:email-verify:${token}`;
}

function emailVerificationRequiredKey(actorId: string): string {
  return `aptus:email-verify-required:${actorId}`;
}

function emailVerifiedKey(actorId: string): string {
  return `aptus:email-verified:${actorId}`;
}

/**
 * Event 11 — Email Verification (post-registration). Issues a single-use, time-limited
 * token and emails the verification link. Best-effort: never blocks registration.
 *
 * Sets a permanent "verification required" marker for this actor so login can gate on
 * it later. Accounts that predate this feature (never had a link sent) never get this
 * marker, so they are never retroactively locked out.
 */
async function sendEmailVerificationLink(actorId: string, email: string, name: string): Promise<void> {
  try {
    await kvSet(emailVerificationRequiredKey(actorId), true);

    const token = randomUUID();
    await kvSet(
      emailVerificationTokenKey(token),
      { actorId, email } satisfies EmailVerificationTokenPayload,
      EMAIL_VERIFICATION_TTL_SEC,
    );

    // Confirm page POSTs to consume — link itself must not mutate (prefetch-safe).
    const verifyUrl = `${getPortalBaseUrl()}/verify-email?token=${token}`;
    const mail = formatEmailVerificationEmail({
      customerName: name,
      verifyUrl,
      expiresInMinutes: Math.round(EMAIL_VERIFICATION_TTL_SEC / 60),
    });

    await sendAuthLifecycleEmail(email, mail, "auth.email_verification");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn("Email verification link failed", { action: "auth.email_verification", error: message });
  }
}

/**
 * True when this actor must verify their email before signing in: a verification link
 * was sent at some point (post-registration) and has not yet been confirmed.
 */
export async function isEmailVerificationPending(actorId: string): Promise<boolean> {
  try {
    const [required, verified] = await Promise.all([
      kvGet<boolean>(emailVerificationRequiredKey(actorId)),
      kvGet<boolean>(emailVerifiedKey(actorId)),
    ]);
    return Boolean(required) && !verified;
  } catch (error) {
    logger.error("Email verification lookup failed", {
      action: "auth.email_verification_pending",
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/** Consumes a verification token (single-use). Returns the verified actor/email, or null if invalid/expired/used. */
export async function consumeEmailVerificationToken(
  token: string,
): Promise<EmailVerificationTokenPayload | null> {
  const key = emailVerificationTokenKey(token);
  const payload = await kvGet<EmailVerificationTokenPayload>(key);
  if (!payload) return null;
  await kvDel(key);

  // Track verified status in KV rather than a bespoke Odoo field (no x_portal_email_verified_at
  // custom field is assumed to exist on res.partner in this deployment).
  await kvSet(emailVerifiedKey(payload.actorId), true);
  await kvDel(emailVerificationRequiredKey(payload.actorId));

  writeAudit({
    action: "auth.email_verified",
    actorId: payload.actorId,
    metadata: { email: payload.email },
  });

  return payload;
}

/**
 * Resends the verification link for a pending account. Silently no-ops when the email
 * is unknown or already verified, so the response never reveals account existence.
 */
export async function resendEmailVerification(email: string): Promise<void> {
  const normalized = normalizeEmailValue(email);

  if (isDemoMode()) {
    const account = await getDemoAccountByEmail(normalized);
    if (!account) return;
    if (!(await isEmailVerificationPending(account.id))) return;
    await sendEmailVerificationLink(account.id, account.email, account.profile.name);
    return;
  }

  const partner = await findPartnerByEmail(normalized);
  if (!partner) return;
  const meta = await getPartnerPortalMeta(partner.id);
  const actorId = meta?.x_portal_account_id;
  if (!actorId) return;
  if (!(await isEmailVerificationPending(actorId))) return;

  const profile = await resolveLiveProfile(partner.id, actorId);
  await sendEmailVerificationLink(actorId, normalized, profile?.name ?? partner.name);
}

function newDeviceKnownIpKey(actorId: string): string {
  return `aptus:known-ip:${actorId}`;
}

/**
 * Event 13 — Login from a new / unrecognised device. Transactional security alert;
 * bypasses marketing opt-out by design (it is never gated on notification preferences).
 * Best-effort and never blocks login.
 */
export async function maybeSendNewDeviceLoginAlert(
  actorId: string,
  email: string,
  name: string,
  ip: string | undefined,
): Promise<void> {
  if (!ip || ip === "unknown") return;
  try {
    const key = newDeviceKnownIpKey(actorId);
    const knownIps = (await kvGet<string[]>(key)) ?? [];

    if (knownIps.includes(ip)) {
      // Still refresh TTL / ordering by re-writing — cheap and keeps recently-seen IPs "known".
      await kvSet(key, knownIps, NEW_DEVICE_KNOWN_IP_TTL_SEC);
      return;
    }

    const isFirstLogin = knownIps.length === 0;
    const updated = [...knownIps, ip].slice(-10);
    await kvSet(key, updated, NEW_DEVICE_KNOWN_IP_TTL_SEC);

    // Don't alert on the very first recorded login for an account — nothing to compare against yet.
    if (isFirstLogin) return;

    const mail = formatNewDeviceLoginEmail({
      customerName: name,
      ip,
      timestamp: new Date().toISOString(),
      portalUrl: getPortalBaseUrl(),
    });

    await sendAuthLifecycleEmail(email, mail, "auth.new_device_login");
    writeAudit({
      action: "notification.email",
      actorId,
      metadata: { type: "new_device_login", ip },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn("New device login alert failed", { action: "auth.new_device_login", error: message });
  }
}

function contactTypeForUserType(userType: UserType): "person" | "company" {
  return userType === "individual" ? "person" : "company";
}

function normalizeEmailValue(email: string): string {
  return email.trim().toLowerCase();
}

function emailsMatch(a: string, b: string): boolean {
  const left = normalizeEmailValue(a);
  const right = normalizeEmailValue(b);
  return Boolean(left && right && left === right);
}

function profileWithPortalId(profile: ClientProfile, portalAccountId: string): ClientProfile {
  return { ...profile, portalAccountId };
}

// ── Demo accounts (KV only — live path uses Odoo partner fields) ─────────────

type DemoAccount = {
  id: string;
  email: string;
  passwordHash: string;
  partnerId?: number;
  status: "active" | "disabled" | "deleted";
  createdAt: string;
  lastLoginAt?: string;
  profile: ClientProfile;
};

function demoKey(email: string): string {
  return `aptus:demo-account:${normalizeEmailValue(email)}`;
}

function demoIdKey(id: string): string {
  return `aptus:demo-account-id:${id}`;
}

function demoPhoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

function demoPhoneKey(phone: string): string {
  return `aptus:demo-account-phone:${demoPhoneDigits(phone)}`;
}

async function getDemoAccountByEmail(email: string): Promise<DemoAccount | null> {
  const account = await kvGet<DemoAccount>(demoKey(email));
  if (!account || account.status === "deleted") return null;
  return account;
}

async function getDemoAccountById(id: string): Promise<DemoAccount | null> {
  const email = await kvGet<string>(demoIdKey(id));
  if (!email) return null;
  return getDemoAccountByEmail(email);
}

async function getDemoAccountByPhone(phone: string): Promise<DemoAccount | null> {
  const digits = demoPhoneDigits(phone);
  if (digits.length < 7) return null;
  const email = await kvGet<string>(demoPhoneKey(phone));
  if (!email) return null;
  return getDemoAccountByEmail(email);
}

/** Claim a phone as unique for a person account. Returns false if already taken. */
async function claimDemoPhone(phone: string, email: string): Promise<boolean> {
  const digits = demoPhoneDigits(phone);
  if (digits.length < 7) return true;
  return kvSetNx(demoPhoneKey(phone), normalizeEmailValue(email));
}

async function saveDemoAccount(account: DemoAccount): Promise<void> {
  await kvSet(demoKey(account.email), account);
  await kvSet(demoIdKey(account.id), account.email);
}

function demoProfileFromRegister(input: RegisterInput, id: string): ClientProfile {
  const email = normalizeEmailValue(input.email);
  const userType = input.userType ?? "individual";
  const contactType = input.contactType ?? contactTypeForUserType(userType);
  const isCompany = contactType === "company";
  const name = input.name.trim();
  const city = (input.region ?? input.city)?.trim() || "";
  const country = input.country?.trim() || "";
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  return {
    id,
    portalAccountId: id,
    email,
    name,
    initials: initials || "C",
    role: "Customer",
    company: isCompany ? input.companyName?.trim() || name : "Customer",
    phone: input.phone?.trim() || "",
    location: [city, country].filter(Boolean).join(", "),
    accountManager: "Aptus Support",
    supportTier: "Standard",
    customerSince: new Date().toISOString().slice(0, 10),
    billingCycle: "",
    paymentTerms: "",
    contactType,
    street: input.street?.trim() || "",
    street2: input.street2?.trim() || "",
    city,
    state: input.state?.trim() || "",
    zip: input.zip?.trim() || "",
    country,
    taxId: (input.crNumber ?? input.taxId)?.trim() || "",
    website: input.website?.trim() || "",
    language: input.language?.trim() || "en_US",
    tags: input.tags?.trim() || "",
  };
}

// ── Auth result types ────────────────────────────────────────────────────────

export type AuthDenyReason =
  | "invalid_credentials"
  | "account_disabled"
  | "partner_not_found"
  | "partner_archived"
  | "partner_portal_disabled";

export type AuthResult =
  | { ok: true; profile: ClientProfile }
  | { ok: false; reason: AuthDenyReason };

export type LoginPrefill = {
  email: string;
  name: string;
  phone: string;
  crNumber?: string;
  company?: string;
};

export type LoginAttemptResult =
  | { status: "success"; profile: ClientProfile }
  | { status: "not_found" }
  | { status: "partner_exists"; prefill: LoginPrefill }
  | { status: "invalid_password"; maskedEmail: string; maskedPhone: string }
  | { status: "account_disabled" }
  | { status: "partner_not_found" }
  | { status: "partner_archived" }
  | { status: "partner_portal_disabled" }
  | { status: "email_not_verified"; maskedEmail: string };

async function assertPartnerAccess(partnerId: number): Promise<AuthDenyReason | null> {
  if (isDemoMode()) return null;

  const access = await checkPartnerPortalAccess(partnerId);
  if (!access.exists) return "partner_not_found";
  if (access.reason === "archived") return "partner_archived";
  if (access.reason === "portal_disabled") return "partner_portal_disabled";
  return null;
}

async function resolveLiveProfile(partnerId: number, portalAccountId: string): Promise<ClientProfile | null> {
  const profile = await readPartnerProfile(partnerId);
  if (!profile) return null;
  return profileWithPortalId(profile, portalAccountId);
}

/** Login entry point: distinguishes unknown email, existing partner, and wrong password. */
export async function resolveLoginAttempt(
  email: string,
  password: string,
): Promise<LoginAttemptResult> {
  const normalized = normalizeEmailValue(email);

  if (isDemoMode()) {
    const account = await getDemoAccountByEmail(normalized);
    if (!account) return { status: "not_found" };
    if (account.status !== "active") return { status: "account_disabled" };
    if (!verifyPassword(password, account.passwordHash)) {
      return {
        status: "invalid_password",
        maskedEmail: maskEmail(account.email),
        maskedPhone: maskPhone(account.profile.phone),
      };
    }
    if (await isEmailVerificationPending(account.id)) {
      return { status: "email_not_verified", maskedEmail: maskEmail(account.email) };
    }

    account.lastLoginAt = new Date().toISOString();
    await saveDemoAccount(account);
    return { status: "success", profile: account.profile };
  }

  const snapshot = await findPartnerForLogin(normalized);
  if (!snapshot) return { status: "not_found" };

  const { partner, passwordHash: storedHash, meta } = snapshot;
  if (!storedHash) {
    return {
      status: "partner_exists",
      prefill: {
        email: odooString(partner.email) || normalized,
        name: partner.name,
        phone: partnerPhone(partner),
        crNumber: odooString(partner.vat) || undefined,
        company: partner.is_company ? partner.name : undefined,
      },
    };
  }

  if (meta.x_portal_status === "disabled" || meta.x_portal_status === "deleted") {
    return { status: "account_disabled" };
  }

  if (!verifyPassword(password, storedHash)) {
    return {
      status: "invalid_password",
      maskedEmail: maskEmail(odooString(partner.email) || normalized),
      maskedPhone: maskPhone(partnerPhone(partner)),
    };
  }

  if (!snapshot.active) return { status: "partner_archived" };
  if (process.env.ODOO_PORTAL_ENABLED_FIELD?.trim()) {
    const denied = await assertPartnerAccess(partner.id);
    if (denied === "partner_not_found") return { status: "partner_not_found" };
    if (denied === "partner_archived") return { status: "partner_archived" };
    if (denied === "partner_portal_disabled") return { status: "partner_portal_disabled" };
  }

  const portalAccountId = meta.x_portal_account_id || `pa-${partner.id}`;

  if (await isEmailVerificationPending(portalAccountId)) {
    return { status: "email_not_verified", maskedEmail: maskEmail(odooString(partner.email) || normalized) };
  }

  void updatePartnerPortalMeta(partner.id, {
    x_portal_last_login: new Date().toISOString(),
    ...(meta.x_portal_account_id ? {} : { x_portal_account_id: portalAccountId }),
  }).catch((error) => {
    logger.warn("Portal last-login write failed", {
      action: "auth.login",
      error: error instanceof Error ? error.message : String(error),
    });
  });

  const profile = profileWithPortalId(mapPartnerToProfile(partner), portalAccountId);
  return { status: "success", profile };
}

export async function authenticateUser(
  email: string,
  password: string,
): Promise<AuthResult> {
  const result = await resolveLoginAttempt(email, password);
  if (result.status === "success") return { ok: true, profile: result.profile };
  if (result.status === "account_disabled") return { ok: false, reason: "account_disabled" };
  if (result.status === "partner_not_found") return { ok: false, reason: "partner_not_found" };
  if (result.status === "partner_archived") return { ok: false, reason: "partner_archived" };
  if (result.status === "partner_portal_disabled") {
    return { ok: false, reason: "partner_portal_disabled" };
  }
  return { ok: false, reason: "invalid_credentials" };
}

export async function loginWithCredentials(
  email: string,
  password: string,
): Promise<ClientProfile | null> {
  const result = await authenticateUser(email, password);
  return result.ok ? result.profile : null;
}

export type IdentificationCheckResult =
  | {
      exists: true;
      maskedEmail: string;
      maskedPhone: string;
      recoveryToken: string;
    }
  | { exists: false };

type ExistingIdentification = Extract<IdentificationCheckResult, { exists: true }>;

async function existingMatchResult(
  email: string,
  phone: string,
  identifier: string,
): Promise<ExistingIdentification> {
  return {
    exists: true,
    maskedEmail: maskEmail(email),
    maskedPhone: maskPhone(phone),
    recoveryToken: await createRecoverySession(email, identifier),
  };
}

export async function checkIdentification(
  userType: UserType,
  identifier: string,
  pendingEmail?: string,
): Promise<IdentificationCheckResult> {
  const trimmed = identifier.trim();
  const isIndividual = userType === "individual";
  const normalizedPending = pendingEmail ? normalizeEmailValue(pendingEmail) : "";

  if (isDemoMode()) {
    // ponytail: demo ID lookup uses phone index for individuals; companies stay CR/email-only in demo
    if (isIndividual) {
      const byPhone = await getDemoAccountByPhone(trimmed);
      if (byPhone) {
        return existingMatchResult(byPhone.email, byPhone.profile.phone, trimmed);
      }
    }
    if (normalizedPending) {
      const byEmail = await getDemoAccountByEmail(normalizedPending);
      if (byEmail) {
        return existingMatchResult(byEmail.email, byEmail.profile.phone, trimmed);
      }
    }
    return { exists: false };
  }

  const partner = isIndividual
    ? await findPartnerByPhone(trimmed)
    : await findPartnerByCrNumber(trimmed);

  if (!partner) {
    return { exists: false };
  }

  const matchedEmail = odooString(partner.email);
  const phone = partnerPhone(partner);

  // Allow claiming an existing CRM contact that shares the same email and has no portal password yet.
  const hash = odooString(partner.x_portal_password_hash) || (await getPartnerPasswordHash(partner.id));
  if (
    !hash &&
    normalizedPending &&
    matchedEmail &&
    emailsMatch(matchedEmail, normalizedPending)
  ) {
    return { exists: false };
  }

  return existingMatchResult(matchedEmail, phone, trimmed);
}

export type SendOtpResult =
  | {
      ok: true;
      channel: "email" | "sms";
      maskedDestination: string;
      demoCode?: string;
    }
  | {
      ok: false;
      code: "SESSION_EXPIRED" | "SMS_UNAVAILABLE" | "EMAIL_FAILED";
      message: string;
    };

export async function sendPasswordRecoveryOtp(
  recoveryToken: string,
  channel: "email" | "sms",
): Promise<SendOtpResult> {
  const session = await getRecoverySession(recoveryToken);
  if (!session) {
    return {
      ok: false,
      code: "SESSION_EXPIRED",
      message: "Recovery session expired. Please start again.",
    };
  }

  // ponytail: no SMS gateway in this stack — email OTP only until Twilio/etc. is wired.
  if (channel === "sms") {
    return {
      ok: false,
      code: "SMS_UNAVAILABLE",
      message: "SMS OTP is temporarily unavailable. Please use Email OTP.",
    };
  }

  const destination = session.accountEmail;
  if (!destination) {
    return {
      ok: false,
      code: "EMAIL_FAILED",
      message: "No email is on file for this account. Please contact support.",
    };
  }

  const issued = await issueOtp(recoveryToken, channel);
  if (!issued) {
    return {
      ok: false,
      code: "SESSION_EXPIRED",
      message: "Recovery session expired. Please start again.",
    };
  }

  const allowDemoCode = isDemoMode() || isTestOtpEnabled();
  const portalUrl = getPortalBaseUrl();
  const customerName = await resolveRecoveryCustomerName(session);
  const otpMail = formatPasswordResetOtpEmail({
    customerName,
    otp: issued.code,
    otpValidityMinutes: Math.max(1, Math.round(issued.expiresInSec / 60)),
    resetUrl: `${portalUrl}/register`,
    portalUrl,
  });
  const emailResult = await sendPortalEmail({
    to: destination,
    subject: otpMail.subject,
    body: otpMail.body,
  });

  if (!emailResult.sent && !allowDemoCode) {
    logger.warn("Password recovery OTP email failed", {
      action: "auth.password_reset_otp",
      channel: emailResult.channel,
      error: emailResult.error,
    });
    return {
      ok: false,
      code: "EMAIL_FAILED",
      message: "Unable to send verification email. Please try again later or contact support.",
    };
  }

  if (emailResult.sent) {
    logger.info("Password recovery OTP email sent", {
      action: "auth.password_reset_otp",
      mailChannel: emailResult.channel,
      maskedDestination: maskEmail(destination),
    });
  } else {
    logger.warn("Password recovery OTP email skipped (test/demo fallback)", {
      action: "auth.password_reset_otp",
      mailChannel: emailResult.channel,
      error: emailResult.error,
    });
  }

  return {
    ok: true,
    channel: "email",
    maskedDestination: maskEmail(destination),
    demoCode: allowDemoCode ? issued.code : undefined,
  };
}

/** Step 2 of recovery: verify OTP before allowing password reset. */
export async function verifyPasswordRecoveryOtp(
  recoveryToken: string,
  otp: string,
): Promise<boolean> {
  return verifyOtp(recoveryToken, otp);
}

/**
 * Step 3 of recovery: set a new password after OTP was verified.
 * Accepts otp optionally for backward compatibility with single-step clients.
 */
export async function resetPasswordWithOtp(
  recoveryToken: string,
  password: string,
  otp?: string,
): Promise<ClientProfile | null> {
  const session = await getRecoverySession(recoveryToken);
  if (!session) return null;

  const alreadyVerified = await isRecoveryOtpVerified(recoveryToken);
  if (!alreadyVerified) {
    if (!otp || !(await verifyOtp(recoveryToken, otp))) return null;
  }

  const hash = hashPassword(password);

  if (isDemoMode()) {
    const account = await getDemoAccountByEmail(session.accountEmail);
    if (!account) return null;
    account.passwordHash = hash;
    await saveDemoAccount(account);
    await clearRecoverySession(recoveryToken);
    const actorId = account.profile.portalAccountId ?? account.profile.id;
    await revokeAllUserRefreshTokens(actorId);
    await sendAuthLifecycleEmail(
      account.email,
      formatPasswordResetEmail({
        customerName: account.profile.name,
        portalUrl: getPortalBaseUrl(),
      }),
      "auth.password_reset_done",
    );
    return account.profile;
  }

  const partner =
    (session.accountEmail ? await findPartnerByEmail(session.accountEmail) : null) ??
    (await findPartnerByPhone(session.identifier)) ??
    (await findPartnerByCrNumber(session.identifier));

  if (!partner) return null;

  const meta = await getPartnerPortalMeta(partner.id);
  let portalAccountId = meta?.x_portal_account_id;
  if (!portalAccountId) {
    portalAccountId = `pa-${randomUUID()}`;
    await updatePartnerPortalMeta(partner.id, {
      x_portal_account_id: portalAccountId,
      x_portal_status: "active",
      x_portal_created_at: new Date().toISOString(),
    });
  }

  await setPartnerPasswordHash(partner.id, hash);
  await clearRecoverySession(recoveryToken);
  await revokeAllUserRefreshTokens(portalAccountId);
  const profile = await resolveLiveProfile(partner.id, portalAccountId);
  if (profile?.email) {
    await sendAuthLifecycleEmail(
      profile.email,
      formatPasswordResetEmail({
        customerName: profile.name,
        portalUrl: getPortalBaseUrl(),
      }),
      "auth.password_reset_done",
    );
  }
  return profile;
}

export type RegisterConflictField = "email" | "cr" | "mobile";

export type RegisterResult =
  | { ok: true; profile: ClientProfile }
  | {
      ok: false;
      conflictField: RegisterConflictField;
      maskedEmail: string;
      maskedPhone: string;
      recoveryToken: string;
    };

async function conflictFromPartner(
  partner: { email: string | false; phone: string | false; mobile?: string | false },
  identifier: string,
  conflictField: RegisterConflictField,
): Promise<Extract<RegisterResult, { ok: false }>> {
  const match = await existingMatchResult(
    odooString(partner.email),
    partnerPhone(partner as { phone: string | false; mobile: string | false }),
    identifier,
  );
  return {
    ok: false,
    conflictField,
    maskedEmail: match.maskedEmail,
    maskedPhone: match.maskedPhone,
    recoveryToken: match.recoveryToken,
  };
}

export async function registerCustomer(input: RegisterInput): Promise<RegisterResult> {
  const email = normalizeEmailValue(input.email);
  const userType = input.userType ?? "individual";
  const contactType = input.contactType ?? contactTypeForUserType(userType);
  const isCompany = contactType === "company";
  const crNumber = (input.crNumber ?? input.taxId)?.trim();
  const phone = input.phone?.trim();

  if (isDemoMode()) {
    if (await getDemoAccountByEmail(email)) {
      const existing = await getDemoAccountByEmail(email);
      const match = await existingMatchResult(
        existing!.email,
        existing!.profile.phone,
        crNumber || phone || email,
      );
      return {
        ok: false,
        conflictField: "email",
        maskedEmail: match.maskedEmail,
        maskedPhone: match.maskedPhone,
        recoveryToken: match.recoveryToken,
      };
    }
    // Phone is the unique identity for person accounts (mirrors CR for companies)
    if (!isCompany && phone) {
      const phoneOwner = await getDemoAccountByPhone(phone);
      if (phoneOwner) {
        const match = await existingMatchResult(
          phoneOwner.email,
          phoneOwner.profile.phone,
          phone,
        );
        return {
          ok: false,
          conflictField: "mobile",
          maskedEmail: match.maskedEmail,
          maskedPhone: match.maskedPhone,
          recoveryToken: match.recoveryToken,
        };
      }
      const claimed = await claimDemoPhone(phone, email);
      if (!claimed) {
        const raceOwner = await getDemoAccountByPhone(phone);
        const match = await existingMatchResult(
          raceOwner?.email ?? email,
          raceOwner?.profile.phone ?? phone,
          phone,
        );
        return {
          ok: false,
          conflictField: "mobile",
          maskedEmail: match.maskedEmail,
          maskedPhone: match.maskedPhone,
          recoveryToken: match.recoveryToken,
        };
      }
    }
    const id = `pa-${randomUUID()}`;
    const account: DemoAccount = {
      id,
      email,
      passwordHash: hashPassword(input.password),
      status: "active",
      createdAt: new Date().toISOString(),
      profile: demoProfileFromRegister(input, id),
    };
    await saveDemoAccount(account);
    await sendAuthLifecycleEmail(
      email,
      formatRegistrationSuccessfulEmail({
        customerName: account.profile.name,
        email,
        portalUrl: getPortalBaseUrl(),
      }),
      "auth.register_email",
    );
    await sendEmailVerificationLink(id, email, account.profile.name);
    return { ok: true, profile: account.profile };
  }

  let partner = await findPartnerByEmail(email);

  if (partner) {
    const existingHash = await getPartnerPasswordHash(partner.id);
    if (existingHash) {
      return conflictFromPartner(partner, crNumber || phone || email, "email");
    }

    const denied = await assertPartnerAccess(partner.id);
    if (denied === "partner_archived" || denied === "partner_portal_disabled") {
      return conflictFromPartner(partner, crNumber || phone || email, "email");
    }
  }

  if (isCompany && crNumber) {
    const crMatch = await findPartnerByCrNumber(crNumber);
    if (crMatch && crMatch.id !== partner?.id) {
      const crEmail = odooString(crMatch.email);
      if (!partner && crEmail && emailsMatch(crEmail, email)) {
        partner = crMatch;
      } else if (!partner && !crEmail) {
        partner = crMatch;
      } else {
        return conflictFromPartner(crMatch, crNumber, "cr");
      }
    } else if (crMatch) {
      partner = crMatch;
    }
  }

  if (!isCompany && phone) {
    const phoneMatch = await findPartnerByPhone(phone);
    if (phoneMatch && phoneMatch.id !== partner?.id) {
      const phoneEmail = odooString(phoneMatch.email);
      if (!partner && phoneEmail && emailsMatch(phoneEmail, email)) {
        partner = phoneMatch;
      } else if (!partner && !phoneEmail) {
        partner = phoneMatch;
      } else {
        return conflictFromPartner(phoneMatch, phone, "mobile");
      }
    } else if (phoneMatch && !partner) {
      partner = phoneMatch;
    }
  }

  if (partner) {
    const existingHash = await getPartnerPasswordHash(partner.id);
    if (existingHash) {
      return conflictFromPartner(
        partner,
        crNumber || phone || email,
        isCompany && crNumber ? "cr" : phone ? "mobile" : "email",
      );
    }
  }

  const partnerId = partner
    ? partner.id
    : await createPartner({
        name: isCompany ? input.companyName?.trim() || input.name : input.name,
        email,
        phone: input.phone,
        street: input.street,
        street2: input.street2,
        city: input.region ?? input.city,
        state: input.state,
        zip: input.zip,
        country: input.country ?? (userType === "oman_company" ? "Oman" : input.country),
        taxId: crNumber ?? input.taxId,
        website: input.website,
        language: input.language,
        tags: input.tags,
        is_company: isCompany,
      });

  if (partner) {
    await updatePartner(partnerId, {
      name: isCompany ? input.companyName?.trim() || input.name : input.name,
      email,
      phone: input.phone,
      street: input.street,
      street2: input.street2,
      city: input.region ?? input.city,
      state: input.state,
      zip: input.zip,
      country: input.country ?? (userType === "oman_company" ? "Oman" : input.country),
      taxId: crNumber ?? input.taxId,
      website: input.website,
      language: input.language,
      tags: input.tags,
      is_company: isCompany,
    });
  }

  const portalAccountId = `pa-${randomUUID()}`;
  await writePartnerPortalSetup(partnerId, {
    x_portal_password_hash: hashPassword(input.password),
    x_portal_account_id: portalAccountId,
    x_portal_status: "active",
    x_portal_created_at: new Date().toISOString(),
  });

  const profile = await resolveLiveProfile(partnerId, portalAccountId);
  if (!profile) {
    throw new Error("Partner created but profile could not be loaded");
  }
  void sendAuthLifecycleEmail(
    email,
    formatRegistrationSuccessfulEmail({
      customerName: profile.name,
      email,
      portalUrl: getPortalBaseUrl(),
    }),
    "auth.register_email",
  );
  void sendEmailVerificationLink(portalAccountId, email, profile.name);
  return { ok: true, profile };
}

export async function updateCustomerProfile(
  portalAccountId: string,
  input: ProfileUpdateInput,
): Promise<ClientProfile | null> {
  if (isDemoMode()) {
    const account = await getDemoAccountById(portalAccountId);
    if (!account || account.status !== "active") return null;
    const isPerson = account.profile.contactType !== "company";
    const next = demoProfileFromRegister(
      {
        ...input,
        email: account.email,
        password: "unused",
      },
      account.id,
    );
    // CR number and person phone are unique identity fields — immutable after registration
    account.profile = {
      ...next,
      partnerId: account.partnerId,
      taxId: account.profile.taxId,
      contactType: account.profile.contactType,
      ...(isPerson ? { phone: account.profile.phone } : {}),
    };
    await saveDemoAccount(account);
    writeAudit({
      action: "profile.update",
      actorId: account.id,
      targetId: account.id,
      metadata: { fields: Object.keys(input) },
    });
    return account.profile;
  }

  const found = await findPartnerByPortalAccountId(portalAccountId);
  if (!found) return null;

  const denied = await assertPartnerAccess(found.id);
  if (denied) return null;

  const meta = await getPartnerPortalMeta(found.id);
  if (meta?.x_portal_status && meta.x_portal_status !== "active") return null;

  const isCompany = Boolean(found.is_company);
  await updatePartner(found.id, {
    name: input.name,
    email: found.email,
    ...(isCompany ? { phone: input.phone } : {}),
    street: input.street,
    street2: input.street2,
    city: input.city,
    state: input.state,
    zip: input.zip,
    country: input.country,
    website: input.website,
    language: input.language,
    tags: input.tags,
    is_company: isCompany,
  });

  writeAudit({
    action: "profile.update",
    actorId: portalAccountId,
    targetId: portalAccountId,
    metadata: { fields: Object.keys(input) },
  });

  return resolveLiveProfile(found.id, portalAccountId);
}

function profileFromClaims(claims: SessionClaims): ClientProfile {
  const name = claims.name?.trim() || claims.email || "Customer";
  return {
    id: claims.sub,
    portalAccountId: claims.sub,
    partnerId: claims.partnerId,
    email: claims.email,
    name,
    initials: name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join(""),
    role: "Customer",
    company: "",
    phone: "",
    location: "",
    accountManager: "Aptus Support",
    supportTier: "Standard",
    customerSince: "",
    billingCycle: "",
    paymentTerms: "",
  };
}

export async function resolveProfile(claims: SessionClaims): Promise<ClientProfile | null> {
  if (isDemoMode()) {
    const account = await getDemoAccountById(claims.sub);
    if (!account || account.status !== "active") return null;
    return account.profile;
  }

  try {
    const snapshot = await findPartnerSessionByPortalAccountId(claims.sub);
    if (snapshot) {
      if (!snapshot.active) return null;
      if (snapshot.meta.x_portal_status === "disabled" || snapshot.meta.x_portal_status === "deleted") {
        return null;
      }
      if (process.env.ODOO_PORTAL_ENABLED_FIELD?.trim()) {
        const denied = await assertPartnerAccess(snapshot.partner.id);
        if (denied) return null;
      }
      return profileWithPortalId(mapPartnerToProfile(snapshot.partner), claims.sub);
    }

    if (claims.partnerId) {
      const meta = await getPartnerPortalMeta(claims.partnerId);
      if (meta?.x_portal_status === "disabled" || meta?.x_portal_status === "deleted") return null;
      const profile = await resolveLiveProfile(claims.partnerId, claims.sub);
      if (profile) return profile;
    }
  } catch (error) {
    logger.warn("Profile lookup failed; using session claims", {
      action: "auth.resolve_profile",
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Valid JWT — do not treat an Odoo miss as a signed-out / disabled account.
  return profileFromClaims(claims);
}

export async function softDeleteCustomerAccount(portalAccountId: string, actorId: string): Promise<boolean> {
  if (isDemoMode()) {
    const account = await getDemoAccountById(portalAccountId);
    if (!account || account.status === "deleted") return false;
    account.status = "deleted";
    account.profile = {
      ...account.profile,
      name: "Deleted User",
      phone: "",
      taxId: "",
      street: "",
      street2: "",
      company: "Deleted",
      location: "",
    };
    await saveDemoAccount(account);
    writeAudit({ action: "profile.soft_delete", actorId, targetId: portalAccountId });
    return true;
  }

  const found = await findPartnerByPortalAccountId(portalAccountId);
  if (!found) return false;
  await softDeletePartnerPortal(found.id);
  writeAudit({ action: "profile.soft_delete", actorId, targetId: portalAccountId });
  return true;
}

export async function exportCustomerAccountData(
  portalAccountId: string,
): Promise<Record<string, unknown> | null> {
  if (isDemoMode()) {
    const account = await getDemoAccountById(portalAccountId);
    if (!account) return null;
    return {
      exportedAt: new Date().toISOString(),
      account: {
        id: account.id,
        email: account.email,
        status: account.status,
        partnerId: account.partnerId,
        createdAt: account.createdAt,
        lastLoginAt: account.lastLoginAt,
        profile: account.profile,
      },
      auditLog: await readAuditForUser(portalAccountId),
    };
  }

  const found = await findPartnerByPortalAccountId(portalAccountId);
  if (!found) return null;
  const meta = await getPartnerPortalMeta(found.id);
  const profile = await readPartnerProfile(found.id);
  return {
    exportedAt: new Date().toISOString(),
    account: {
      id: portalAccountId,
      email: found.email,
      status: meta?.x_portal_status ?? "active",
      partnerId: found.id,
      createdAt: meta?.x_portal_created_at,
      lastLoginAt: meta?.x_portal_last_login,
      profile,
    },
    auditLog: await readAuditForUser(portalAccountId),
  };
}

/** Resolve customer contact for order/renewal emails from partnerId (Odoo) or demo account. */
export async function resolveCustomerContact(
  partnerId?: number,
  actorId?: string,
): Promise<{ email: string; name: string; actorId: string; phone: string; company: string } | null> {
  if (actorId) {
    if (isDemoMode()) {
      const account = await getDemoAccountById(actorId);
      if (account) {
        return {
          email: account.email,
          name: account.profile.name,
          actorId: account.id,
          phone: account.profile.phone ?? "",
          company: account.profile.company ?? "",
        };
      }
    } else {
      const found = await findPartnerByPortalAccountId(actorId);
      if (found) {
        const profile = await readPartnerProfile(found.id);
        if (profile) {
          return {
            email: profile.email,
            name: profile.name,
            actorId,
            phone: profile.phone ?? "",
            company: profile.company ?? "",
          };
        }
      }
    }
  }

  if (partnerId) {
    const profile = await readPartnerProfile(partnerId);
    if (profile?.email) {
      const meta = await getPartnerPortalMeta(partnerId);
      return {
        email: profile.email,
        name: profile.name,
        actorId: meta?.x_portal_account_id || actorId || `partner-${partnerId}`,
        phone: profile.phone ?? "",
        company: profile.company ?? "",
      };
    }
  }

  return null;
}

export function claimsFromProfile(profile: ClientProfile): Omit<SessionClaims, "jti" | "traceId"> {
  return {
    sub: profile.portalAccountId ?? profile.id,
    email: profile.email,
    name: profile.name,
    partnerId: profile.partnerId,
    roles: [DEFAULT_USER_ROLE],
  };
}

export function authDenyMessage(reason: AuthDenyReason): string {
  switch (reason) {
    case "account_disabled":
      return "This portal account has been disabled. Contact Aptus support.";
    case "partner_not_found":
      return "Your customer record was not found in Odoo. Contact Aptus support.";
    case "partner_archived":
      return "Your customer account is archived in Odoo and portal access is blocked.";
    case "partner_portal_disabled":
      return "Portal access is disabled for this customer record.";
    default:
      return "Invalid email or password";
  }
}
