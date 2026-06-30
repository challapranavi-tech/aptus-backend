import { DEFAULT_USER_ROLE, isDemoMode, isTestOtpEnabled } from "./config";
import {
  createPortalAccount,
  findPortalAccountByCrNumber,
  findPortalAccountByPhone,
  getPortalAccountByEmail,
  getPortalAccountById,
  toClientProfile,
  touchPortalLogin,
  updatePortalPassword,
  updatePortalProfile,
  verifyPortalCredentials,
  type PortalAccount,
} from "./portal-accounts";
import { checkPartnerPortalAccess } from "./odoo/partner-access";
import {
  createPartner,
  findPartnerByCrNumber,
  findPartnerByEmail,
  findPartnerByPhone,
  readPartnerProfile,
  updatePartner,
} from "./odoo/partners";
import { maskEmail, maskPhone } from "./mask-pii";
import { verifyPassword } from "./password";
import {
  clearRecoverySession,
  createRecoverySession,
  getRecoverySession,
  issueOtp,
  verifyOtp,
} from "./recovery-sessions";
import type { ClientProfile, ProfileUpdateInput, RegisterInput, UserType } from "./types";
import type { SessionClaims } from "./jwt";

function odooString(value: string | false | undefined): string {
  return typeof value === "string" ? value : "";
}

function mergeProfiles(local: ClientProfile, odoo: ClientProfile): ClientProfile {
  return {
    ...local,
    ...odoo,
    portalAccountId: local.portalAccountId,
    contactType: local.contactType ?? odoo.contactType,
    street2: odoo.street2 || local.street2,
    state: odoo.state || local.state,
    zip: odoo.zip || local.zip,
    taxId: odoo.taxId || local.taxId,
    website: odoo.website || local.website,
    language: odoo.language || local.language,
    tags: local.tags || odoo.tags,
    customerSince: local.customerSince || odoo.customerSince,
    billingCycle: local.billingCycle || odoo.billingCycle,
    paymentTerms: local.paymentTerms || odoo.paymentTerms,
  };
}

export type AuthDenyReason =
  | "invalid_credentials"
  | "account_disabled"
  | "partner_not_found"
  | "partner_archived"
  | "partner_portal_disabled";

export type AuthResult =
  | { ok: true; profile: ClientProfile; account: PortalAccount }
  | { ok: false; reason: AuthDenyReason };

export type LoginPrefill = {
  email: string;
  name: string;
  phone: string;
  crNumber?: string;
  company?: string;
};

export type LoginAttemptResult =
  | { status: "success"; profile: ClientProfile; account: PortalAccount }
  | { status: "not_found" }
  | { status: "partner_exists"; prefill: LoginPrefill }
  | { status: "invalid_password"; maskedEmail: string; maskedPhone: string }
  | { status: "account_disabled" }
  | { status: "partner_not_found" }
  | { status: "partner_archived" }
  | { status: "partner_portal_disabled" };

async function resolveProfileForAccount(account: PortalAccount): Promise<ClientProfile | null> {
  const base = toClientProfile(account);

  if (isDemoMode() || !account.partnerId) {
    return base;
  }

  const odoo = await readPartnerProfile(account.partnerId);
  return odoo ? mergeProfiles(base, odoo) : base;
}

async function assertPartnerAccess(partnerId: number): Promise<AuthDenyReason | null> {
  if (isDemoMode()) return null;

  const access = await checkPartnerPortalAccess(partnerId);
  if (!access.exists) return "partner_not_found";
  if (access.reason === "archived") return "partner_archived";
  if (access.reason === "portal_disabled") return "partner_portal_disabled";
  return null;
}

/** Login entry point: distinguishes unknown email, existing partner, and wrong password. */
export async function resolveLoginAttempt(
  email: string,
  password: string,
): Promise<LoginAttemptResult> {
  const normalized = email.trim().toLowerCase();
  const portalAccount = getPortalAccountByEmail(normalized);

  if (portalAccount) {
    if (portalAccount.status !== "active") {
      return { status: "account_disabled" };
    }

    if (!verifyPassword(password, portalAccount.passwordHash)) {
      const profile = toClientProfile(portalAccount);
      return {
        status: "invalid_password",
        maskedEmail: maskEmail(profile.email),
        maskedPhone: maskPhone(profile.phone),
      };
    }

    if (portalAccount.partnerId) {
      const denied = await assertPartnerAccess(portalAccount.partnerId);
      if (denied === "partner_not_found") return { status: "partner_not_found" };
      if (denied === "partner_archived") return { status: "partner_archived" };
      if (denied === "partner_portal_disabled") return { status: "partner_portal_disabled" };
    }

    touchPortalLogin(portalAccount);
    const profile = await resolveProfileForAccount(portalAccount);
    if (!profile) {
      return { status: "invalid_password", maskedEmail: maskEmail(normalized), maskedPhone: "" };
    }

    return { status: "success", profile, account: portalAccount };
  }

  if (!isDemoMode()) {
    const partner = await findPartnerByEmail(normalized);
    if (partner) {
      const partnerEmail = odooString(partner.email) || normalized;
      return {
        status: "partner_exists",
        prefill: {
          email: partnerEmail,
          name: partner.name,
          phone: odooString(partner.phone),
          crNumber: odooString(partner.vat) || undefined,
          company: partner.is_company ? partner.name : undefined,
        },
      };
    }
  }

  return { status: "not_found" };
}

export async function authenticateUser(
  email: string,
  password: string,
): Promise<AuthResult> {
  const account = verifyPortalCredentials(email, password);
  if (!account) {
    const existing = getPortalAccountByEmail(email);
    if (existing?.status === "disabled") {
      return { ok: false, reason: "account_disabled" };
    }
    return { ok: false, reason: "invalid_credentials" };
  }

  if (account.partnerId) {
    const denied = await assertPartnerAccess(account.partnerId);
    if (denied) return { ok: false, reason: denied };
  }

  touchPortalLogin(account);
  const profile = await resolveProfileForAccount(account);
  if (!profile) {
    return { ok: false, reason: "invalid_credentials" };
  }

  return { ok: true, profile, account };
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

async function existingMatchResult(
  email: string,
  phone: string,
  identifier: string,
): Promise<IdentificationCheckResult> {
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

  let portalAccount = isIndividual
    ? findPortalAccountByPhone(trimmed)
    : findPortalAccountByCrNumber(trimmed);

  let matchedEmail = portalAccount?.email ?? "";
  let phone = portalAccount ? decryptProfilePhone(portalAccount) : "";
  let odooPartnerEmail = "";

  if (!portalAccount && !isDemoMode()) {
    const partner = isIndividual
      ? await findPartnerByPhone(trimmed)
      : await findPartnerByCrNumber(trimmed);

    if (partner) {
      odooPartnerEmail = odooString(partner.email);
      matchedEmail = matchedEmail || odooPartnerEmail;
      phone = phone || odooString(partner.phone);
      if (matchedEmail) {
        portalAccount = getPortalAccountByEmail(matchedEmail);
      }
    }
  }

  if (normalizedPending) {
    if (portalAccount) {
      if (emailsMatch(portalAccount.email, normalizedPending)) {
        const profile = toClientProfile(portalAccount);
        return await existingMatchResult(profile.email, profile.phone || phone, trimmed);
      }
      const profile = toClientProfile(portalAccount);
      return await existingMatchResult(profile.email, profile.phone || phone, trimmed);
    }

    if (odooPartnerEmail && !emailsMatch(odooPartnerEmail, normalizedPending)) {
      return await existingMatchResult(odooPartnerEmail, phone, trimmed);
    }

    return { exists: false };
  }

  if (!matchedEmail && !phone && !portalAccount) {
    return { exists: false };
  }

  if (!matchedEmail) {
    return { exists: false };
  }

  if (portalAccount) {
    const profile = toClientProfile(portalAccount);
    matchedEmail = profile.email;
    phone = profile.phone || phone;
  }

  return await existingMatchResult(matchedEmail, phone, trimmed);
}

function decryptProfilePhone(account: PortalAccount): string {
  return toClientProfile(account).phone;
}

export type SendOtpResult = {
  sent: true;
  channel: "email" | "sms";
  maskedDestination: string;
  demoCode?: string;
};

export async function sendPasswordRecoveryOtp(
  recoveryToken: string,
  channel: "email" | "sms",
): Promise<SendOtpResult | null> {
  const session = await getRecoverySession(recoveryToken);
  if (!session) return null;

  const account = getPortalAccountByEmail(session.accountEmail);
  const profile = account ? toClientProfile(account) : null;
  const destination =
    channel === "email"
      ? profile?.email || session.accountEmail
      : profile?.phone || session.identifier;

  const issued = await issueOtp(recoveryToken, channel);
  if (!issued) return null;

  return {
    sent: true,
    channel,
    maskedDestination: channel === "email" ? maskEmail(destination) : maskPhone(destination),
    demoCode: isDemoMode() || isTestOtpEnabled() ? issued.code : undefined,
  };
}

export async function resetPasswordWithOtp(
  recoveryToken: string,
  otp: string,
  password: string,
): Promise<ClientProfile | null> {
  const session = await getRecoverySession(recoveryToken);
  if (!session || !(await verifyOtp(recoveryToken, otp))) return null;

  let account = getPortalAccountByEmail(session.accountEmail);

  if (!account && !isDemoMode()) {
    const partner =
      (await findPartnerByEmail(session.accountEmail)) ??
      (await findPartnerByPhone(session.identifier)) ??
      (await findPartnerByCrNumber(session.identifier));

    if (partner) {
      const email = odooString(partner.email) || session.accountEmail;
      account = createPortalAccount({
        email,
        password,
        partnerId: partner.id,
        registerInput: {
          email,
          password,
          name: partner.name,
          userType: partner.is_company ? "oman_company" : "individual",
          contactType: partner.is_company ? "company" : "person",
          phone: odooString(partner.phone),
          crNumber: odooString(partner.vat),
        },
      });
    }
  }

  if (!account) return null;

  const updated = updatePortalPassword(account.id, password);
  await clearRecoverySession(recoveryToken);
  return updated ? await resolveProfileForAccount(updated) : null;
}

export async function registerCustomer(input: RegisterInput): Promise<ClientProfile | null> {
  const email = input.email.trim().toLowerCase();
  const userType = input.userType ?? "individual";
  const contactType = input.contactType ?? contactTypeForUserType(userType);
  const isCompany = contactType === "company";
  const crNumber = input.crNumber?.trim();
  const phone = input.phone?.trim();

  if (getPortalAccountByEmail(email)) return null;

  if (isCompany && crNumber && findPortalAccountByCrNumber(crNumber)) return null;
  if (!isCompany && phone && findPortalAccountByPhone(phone)) return null;

  if (isDemoMode()) {
    const account = createPortalAccount({
      email,
      password: input.password,
      registerInput: { ...input, email, contactType, userType },
    });
    return account ? toClientProfile(account) : null;
  }

  let odooExisting = await findPartnerByEmail(email);
  if (odooExisting) {
    const denied = await assertPartnerAccess(odooExisting.id);
    if (denied === "partner_archived" || denied === "partner_portal_disabled") {
      return null;
    }
  }

  if (!odooExisting && isCompany && crNumber) {
    const crMatch = await findPartnerByCrNumber(crNumber);
    if (crMatch) {
      const crEmail = odooString(crMatch.email);
      if (crEmail && !emailsMatch(crEmail, email)) {
        return null;
      }
      odooExisting = crMatch;
    }
  }

  if (!odooExisting && !isCompany && phone) {
    const phoneMatch = await findPartnerByPhone(phone);
    if (phoneMatch) {
      const phoneEmail = odooString(phoneMatch.email);
      if (phoneEmail && !emailsMatch(phoneEmail, email)) {
        return null;
      }
      odooExisting = phoneMatch;
    }
  }

  if (isCompany && crNumber) {
    const crMatch = await findPartnerByCrNumber(crNumber);
    if (crMatch && crMatch.id !== odooExisting?.id) return null;
  }

  if (!isCompany && phone) {
    const phoneMatch = await findPartnerByPhone(phone);
    if (phoneMatch && phoneMatch.id !== odooExisting?.id) return null;
  }

  const partnerId = odooExisting
    ? odooExisting.id
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

  const account = createPortalAccount({
    email,
    password: input.password,
    partnerId,
    registerInput: {
      ...input,
      email,
      contactType,
      userType,
      name: odooExisting?.name ?? input.name,
      phone: input.phone ?? odooString(odooExisting?.phone),
      crNumber: crNumber ?? odooString(odooExisting?.vat),
    },
  });

  return account ? await resolveProfileForAccount(account) : null;
}

export async function updateCustomerProfile(
  portalAccountId: string,
  input: ProfileUpdateInput,
): Promise<ClientProfile | null> {
  const existing = getPortalAccountById(portalAccountId);
  if (!existing) return null;

  if (existing.partnerId) {
    const denied = await assertPartnerAccess(existing.partnerId);
    if (denied) return null;

    const contactType = input.contactType ?? existing.profile.contactType ?? "person";
    const isCompany = contactType === "company";
    await updatePartner(existing.partnerId, {
      name: input.name,
      email: existing.email,
      phone: input.phone,
      street: input.street,
      street2: input.street2,
      city: input.city,
      state: input.state,
      zip: input.zip,
      country: input.country,
      taxId: input.taxId,
      website: input.website,
      language: input.language,
      tags: input.tags,
      is_company: isCompany,
    });
  }

  const updated = updatePortalProfile(portalAccountId, input);
  return updated ? await resolveProfileForAccount(updated) : null;
}

export async function resolveProfile(claims: SessionClaims): Promise<ClientProfile | null> {
  const account = getPortalAccountById(claims.sub);
  if (!account || account.status !== "active") return null;

  if (account.partnerId) {
    const denied = await assertPartnerAccess(account.partnerId);
    if (denied) return null;
  }

  return resolveProfileForAccount(account);
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
