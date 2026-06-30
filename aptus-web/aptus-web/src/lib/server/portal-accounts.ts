import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { hashPassword, verifyPassword } from "./password";
import type { ClientProfile, ContactType, ProfileUpdateInput, RegisterInput } from "./types";
import { readAuditForUser, writeAudit } from "./audit-log";
import { decryptPiiFields, encryptPiiFields } from "./pii-crypto";

export type PortalAccountStatus = "active" | "disabled" | "deleted";

/** Profile snapshot stored with the portal account (Odoo is canonical in live mode). */
export type StoredProfile = Omit<ClientProfile, "id" | "partnerId" | "portalAccountId">;

export type PortalAccount = {
  id: string;
  email: string;
  passwordHash: string;
  partnerId?: number;
  status: PortalAccountStatus;
  createdAt: string;
  lastLoginAt?: string;
  deletedAt?: string;
  profile: StoredProfile;
};

type LegacyStoredAccount = StoredProfile & {
  id: string;
  email: string;
  password: string;
  partnerId?: number;
};

const DATA_DIR = path.join(process.cwd(), ".data");
const ACCOUNTS_FILE = path.join(DATA_DIR, "portal-accounts.json");
const LEGACY_USERS_FILE = path.join(DATA_DIR, "registered-users.json");

type GlobalStore = typeof globalThis & {
  __aptusPortalAccounts?: Map<string, PortalAccount>;
};

const globalStore = globalThis as GlobalStore;

function accountId(): string {
  return `pa-${randomUUID()}`;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function buildLocation(city?: string, country?: string): string {
  return [city?.trim(), country?.trim()].filter(Boolean).join(", ");
}

function contactFieldsFromInput(input: {
  contactType?: ContactType;
  phone?: string;
  street?: string;
  street2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  taxId?: string;
  website?: string;
  language?: string;
  tags?: string;
}) {
  const city = input.city?.trim() || "";
  const country = input.country?.trim() || "";
  return {
    contactType: input.contactType ?? "person",
    phone: input.phone?.trim() || "",
    street: input.street?.trim() || "",
    street2: input.street2?.trim() || "",
    city,
    state: input.state?.trim() || "",
    zip: input.zip?.trim() || "",
    country,
    taxId: input.taxId?.trim() || "",
    website: input.website?.trim() || "",
    language: input.language?.trim() || "en_US",
    tags: input.tags?.trim() || "",
    location: buildLocation(city, country),
  };
}

function profileFromRegisterInput(input: RegisterInput): StoredProfile {
  const email = normalizeEmail(input.email);
  const userType = input.userType ?? "individual";
  const contactType =
    input.contactType ?? (userType === "individual" ? "person" : "company");
  const isCompany = contactType === "company";
  const name = input.name.trim();
  const companyName = input.companyName?.trim() || (isCompany ? name : "Customer");
  const contact = contactFieldsFromInput({
    ...input,
    contactType,
    taxId: input.crNumber ?? input.taxId,
    city: input.region ?? input.city,
    country:
      input.country ?? (userType === "oman_company" ? "Oman" : input.country ?? ""),
  });
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  return {
    email,
    name,
    initials: initials || "CU",
    role: "Customer",
    company: isCompany ? companyName : "Customer",
    accountManager: "Aptus Support",
    supportTier: "Standard",
    customerSince: new Date().getFullYear().toString(),
    billingCycle: "",
    paymentTerms: "",
    ...contact,
  };
}

function legacyToProfile(legacy: LegacyStoredAccount): StoredProfile {
  const { id: _id, password: _pw, partnerId: _pid, ...profile } = legacy;
  void _id;
  void _pw;
  void _pid;
  return profile;
}

function loadAccountsFromDisk(): Map<string, PortalAccount> {
  try {
    if (!fs.existsSync(ACCOUNTS_FILE)) {
      return new Map();
    }
    const raw = JSON.parse(fs.readFileSync(ACCOUNTS_FILE, "utf8")) as Record<
      string,
      PortalAccount
    >;
    return new Map(Object.entries(raw));
  } catch {
    return new Map();
  }
}

function saveAccountsToDisk(accounts: Map<string, PortalAccount>): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(
    ACCOUNTS_FILE,
    JSON.stringify(Object.fromEntries(accounts), null, 2),
    "utf8",
  );
}

function migrateLegacyUsers(accounts: Map<string, PortalAccount>): boolean {
  if (!fs.existsSync(LEGACY_USERS_FILE)) return false;

  let changed = false;
  try {
    const legacy = JSON.parse(fs.readFileSync(LEGACY_USERS_FILE, "utf8")) as Record<
      string,
      LegacyStoredAccount
    >;

    for (const [emailKey, row] of Object.entries(legacy)) {
      const email = normalizeEmail(row.email || emailKey);
      if (accounts.has(email)) continue;

      accounts.set(email, {
        id: accountId(),
        email,
        passwordHash: hashPassword(row.password),
        partnerId: row.partnerId,
        status: "active",
        createdAt: new Date().toISOString(),
        profile: legacyToProfile(row),
      });
      changed = true;
    }

    if (changed) {
      const backup = `${LEGACY_USERS_FILE}.migrated-${Date.now()}.bak`;
      fs.renameSync(LEGACY_USERS_FILE, backup);
    }
  } catch {
    return false;
  }

  return changed;
}

function decryptAccountProfile(account: PortalAccount): PortalAccount {
  return {
    ...account,
    profile: decryptPiiFields(account.profile) as StoredProfile,
  };
}

function encryptStoredProfile(profile: StoredProfile): StoredProfile {
  return encryptPiiFields(profile) as StoredProfile;
}

function getAccounts(): Map<string, PortalAccount> {
  if (!globalStore.__aptusPortalAccounts) {
    const accounts = loadAccountsFromDisk();
    const migrated = migrateLegacyUsers(accounts);
    if (migrated) {
      saveAccountsToDisk(accounts);
    }
    globalStore.__aptusPortalAccounts = accounts;
  }
  return globalStore.__aptusPortalAccounts;
}

function normalizeCrNumber(value: string): string {
  return value.replace(/\s/g, "").toUpperCase();
}

function normalizePhoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function phonesMatch(a: string, b: string): boolean {
  const left = normalizePhoneDigits(a);
  const right = normalizePhoneDigits(b);
  if (!left || !right) return false;
  if (left === right) return true;
  return left.endsWith(right) || right.endsWith(left);
}

export function findPortalAccountByCrNumber(crNumber: string): PortalAccount | null {
  const normalized = normalizeCrNumber(crNumber);
  if (!normalized) return null;

  for (const account of getAccounts().values()) {
    if (account.status === "deleted") continue;
    const profile = decryptAccountProfile(account).profile;
    if (normalizeCrNumber(profile.taxId || "") === normalized) {
      return account;
    }
  }
  return null;
}

export function findPortalAccountByPhone(phone: string): PortalAccount | null {
  for (const account of getAccounts().values()) {
    if (account.status === "deleted") continue;
    const profile = decryptAccountProfile(account).profile;
    if (phonesMatch(profile.phone || "", phone)) {
      return account;
    }
  }
  return null;
}

export function updatePortalPassword(accountId: string, password: string): PortalAccount | null {
  const accounts = getAccounts();
  const account = [...accounts.values()].find((a) => a.id === accountId);
  if (!account || account.status !== "active") return null;

  account.passwordHash = hashPassword(password);
  accounts.set(account.email, account);
  saveAccountsToDisk(accounts);
  return decryptAccountProfile(account);
}

export function toClientProfile(account: PortalAccount): ClientProfile {
  const decrypted = decryptAccountProfile(account);
  return {
    ...decrypted.profile,
    portalAccountId: decrypted.id,
    id: decrypted.partnerId ? `partner-${decrypted.partnerId}` : decrypted.id,
    partnerId: decrypted.partnerId,
  };
}

export function getPortalAccountByEmail(email: string): PortalAccount | null {
  const account = getAccounts().get(normalizeEmail(email));
  if (!account || account.status === "deleted") return null;
  return account;
}

export function getPortalAccountById(id: string): PortalAccount | null {
  const account = [...getAccounts().values()].find((a) => a.id === id) ?? null;
  if (!account || account.status === "deleted") return null;
  return account;
}

export function findPortalAccountByPartnerId(partnerId: number): PortalAccount | null {
  const account =
    [...getAccounts().values()].find(
      (entry) => entry.partnerId === partnerId && entry.status === "active",
    ) ?? null;
  return account;
}

export type LoginFailureReason =
  | "ok"
  | "not_found"
  | "invalid_password"
  | "disabled";

export function getLoginFailureReason(email: string, password: string): LoginFailureReason {
  const account = getPortalAccountByEmail(email);
  if (!account) return "not_found";
  if (account.status !== "active") return "disabled";
  if (!verifyPassword(password, account.passwordHash)) return "invalid_password";
  return "ok";
}

export function verifyPortalCredentials(
  email: string,
  password: string,
): PortalAccount | null {
  const account = getPortalAccountByEmail(email);
  if (!account || account.status !== "active") return null;
  if (!verifyPassword(password, account.passwordHash)) return null;
  return account;
}

export function touchPortalLogin(account: PortalAccount): void {
  const accounts = getAccounts();
  account.lastLoginAt = new Date().toISOString();
  accounts.set(account.email, account);
  saveAccountsToDisk(accounts);
}

export function createPortalAccount(input: {
  email: string;
  password: string;
  partnerId?: number;
  profile?: StoredProfile;
  registerInput?: RegisterInput;
}): PortalAccount | null {
  const email = normalizeEmail(input.email);
  const accounts = getAccounts();
  if (!email || accounts.has(email)) return null;

  const profile =
    input.profile ??
    (input.registerInput ? profileFromRegisterInput(input.registerInput) : null);
  if (!profile) return null;

  const account: PortalAccount = {
    id: accountId(),
    email,
    passwordHash: hashPassword(input.password),
    partnerId: input.partnerId,
    status: "active",
    createdAt: new Date().toISOString(),
    profile: encryptStoredProfile({ ...profile, email }),
  };

  accounts.set(email, account);
  saveAccountsToDisk(accounts);
  return account;
}

export function updatePortalProfile(
  accountId: string,
  input: ProfileUpdateInput,
): PortalAccount | null {
  const accounts = getAccounts();
  const account = [...accounts.values()].find((a) => a.id === accountId);
  if (!account) return null;

  const contactType = input.contactType ?? account.profile.contactType ?? "person";
  const isCompany = contactType === "company";
  const name = input.name.trim();
  const contact = contactFieldsFromInput({ ...input, contactType });
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  account.profile = encryptStoredProfile({
    ...decryptAccountProfile(account).profile,
    name,
    initials: initials || account.profile.initials,
    company: isCompany ? name : "Customer",
    ...contact,
  });

  accounts.set(account.email, account);
  saveAccountsToDisk(accounts);

  writeAudit({
    action: "profile.update",
    actorId: account.id,
    targetId: account.id,
    metadata: { fields: Object.keys(input) },
  });

  return decryptAccountProfile(account);
}

export function linkPortalAccountPartner(email: string, partnerId: number): void {
  const accounts = getAccounts();
  const account = accounts.get(normalizeEmail(email));
  if (!account) return;
  account.partnerId = partnerId;
  accounts.set(account.email, account);
  saveAccountsToDisk(accounts);
}

/** Soft delete — anonymises PII while retaining record for audit/compliance. */
export function softDeletePortalAccount(accountId: string, actorId: string): boolean {
  const accounts = getAccounts();
  const account = [...accounts.values()].find((a) => a.id === accountId);
  if (!account || account.status === "deleted") return false;

  account.status = "deleted";
  account.deletedAt = new Date().toISOString();
  account.profile = encryptStoredProfile({
    ...account.profile,
    name: "Deleted User",
    phone: "",
    taxId: "",
    street: "",
    street2: "",
    company: "Deleted",
    location: "",
  });

  accounts.set(account.email, account);
  saveAccountsToDisk(accounts);

  writeAudit({
    action: "profile.soft_delete",
    actorId,
    targetId: accountId,
  });

  return true;
}

/** GDPR data export — returns all stored account data for the user. */
export function exportPortalAccountData(accountId: string): Record<string, unknown> | null {
  const raw = [...getAccounts().values()].find((a) => a.id === accountId);
  if (!raw) return null;
  const account = decryptAccountProfile(raw);
  return {
    exportedAt: new Date().toISOString(),
    account: {
      id: account.id,
      email: account.email,
      status: account.status,
      partnerId: account.partnerId,
      createdAt: account.createdAt,
      lastLoginAt: account.lastLoginAt,
      deletedAt: account.deletedAt,
      profile: account.profile,
    },
    auditLog: readAuditForUser(accountId),
  };
}
