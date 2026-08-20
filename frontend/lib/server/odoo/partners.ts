import { getOdooClient, type OdooClient } from "./client";
import type { ClientProfile } from "../types";

/** Fields customers are allowed to see — never use fields=[] */
export const PARTNER_PROFILE_FIELDS = [
  "name",
  "email",
  "phone",
  // ponytail: staging res.partner has no `mobile` field — phone only until Studio adds it.
  "street",
  "street2",
  "city",
  "zip",
  "state_id",
  "country_id",
  "vat",
  "website",
  "lang",
  "is_company",
] as const;

/** Portal credential / meta fields on res.partner (Odoo Studio). */
export const PARTNER_PORTAL_FIELDS = [
  "x_portal_password_hash",
  "x_portal_account_id",
  "x_portal_status",
  "x_portal_created_at",
  "x_portal_last_login",
] as const;

export type PortalPartnerStatus = "active" | "disabled" | "deleted";

export type PartnerPortalMeta = {
  x_portal_account_id?: string;
  x_portal_status?: PortalPartnerStatus;
  x_portal_created_at?: string;
  x_portal_last_login?: string;
};

type OdooPartner = {
  id: number;
  name: string;
  email: string | false;
  phone: string | false;
  mobile?: string | false;
  street: string | false;
  street2: string | false;
  city: string | false;
  zip: string | false;
  state_id: [number, string] | false;
  country_id: [number, string] | false;
  vat: string | false;
  website: string | false;
  lang: string | false;
  is_company: boolean;
};

/** Prefer phone; optional mobile when present on the Odoo model. */
export function partnerPhone(partner: Pick<OdooPartner, "phone" | "mobile">): string {
  return str(partner.phone) || str(partner.mobile);
}

function str(value: string | false | undefined): string {
  return typeof value === "string" ? value : "";
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function mapPartnerToProfile(partner: OdooPartner): ClientProfile {
  const name = partner.name || "Customer";
  const country = partner.country_id ? partner.country_id[1] : "";
  const city = str(partner.city);
  return {
    id: `partner-${partner.id}`,
    partnerId: partner.id,
    email: str(partner.email),
    name,
    initials: initials(name),
    role: "Customer",
    company: partner.is_company ? name : "Customer",
    phone: partnerPhone(partner),
    location: [city, country].filter(Boolean).join(", "),
    accountManager: "Aptus Support",
    supportTier: "Standard",
    customerSince: "",
    billingCycle: "",
    paymentTerms: "",
    contactType: partner.is_company ? "company" : "person",
    street: str(partner.street),
    street2: str(partner.street2),
    city,
    state: partner.state_id ? partner.state_id[1] : "",
    zip: str(partner.zip),
    country,
    taxId: str(partner.vat),
    website: str(partner.website),
    language: str(partner.lang) || "en_US",
    tags: "",
  };
}

export async function findPartnerByEmail(email: string): Promise<OdooPartner | null> {
  const client = getOdooClient();
  if (!client) return null;

  const rows = await client.searchRead<OdooPartner>(
    "res.partner",
    [["email", "=", email.trim().toLowerCase()]],
    [...PARTNER_PROFILE_FIELDS],
    1,
  );
  return rows[0] ?? null;
}

function normalizeCrNumber(value: string): string {
  return value.replace(/\s/g, "").toUpperCase();
}

function normalizePhoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export async function findPartnerByCrNumber(crNumber: string): Promise<OdooPartner | null> {
  const client = getOdooClient();
  if (!client) return null;

  const normalized = normalizeCrNumber(crNumber);
  if (!normalized) return null;

  const rows = await client.searchRead<OdooPartner>(
    "res.partner",
    [["vat", "=", normalized]],
    [...PARTNER_PROFILE_FIELDS],
    1,
  );
  if (rows[0]) return rows[0];

  const fuzzy = await client.searchRead<OdooPartner>(
    "res.partner",
    [["vat", "ilike", normalized]],
    [...PARTNER_PROFILE_FIELDS],
    1,
  );
  return fuzzy[0] ?? null;
}

export async function findPartnerByPhone(phone: string): Promise<OdooPartner | null> {
  const client = getOdooClient();
  if (!client) return null;

  const digits = normalizePhoneDigits(phone);
  if (digits.length < 7) return null;

  const local = digits.length > 8 ? digits.slice(-8) : digits;
  const rows = await client.searchRead<OdooPartner>(
    "res.partner",
    [
      "|",
      ["phone", "ilike", digits],
      ["phone", "ilike", local],
    ],
    [...PARTNER_PROFILE_FIELDS],
    1,
  );
  return rows[0] ?? null;
}

export async function readPartnerProfile(partnerId: number): Promise<ClientProfile | null> {
  const client = getOdooClient();
  if (!client) return null;

  const rows = await client.read<OdooPartner>(
    "res.partner",
    [partnerId],
    [...PARTNER_PROFILE_FIELDS],
  );
  const partner = rows[0];
  return partner ? mapPartnerToProfile(partner) : null;
}

type PartnerCreateValues = {
  name: string;
  email: string;
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
  is_company?: boolean;
};

async function resolveCountryId(
  client: OdooClient,
  countryName?: string,
): Promise<number | false> {
  if (!countryName?.trim()) return false;
  const rows = await client.searchRead<{ id: number }>(
    "res.country",
    [["name", "ilike", countryName.trim()]],
    ["id"],
    1,
  );
  return rows[0]?.id ?? false;
}

async function resolveStateId(
  client: OdooClient,
  stateName?: string,
  countryId?: number | false,
): Promise<number | false> {
  if (!stateName?.trim()) return false;
  const domain: unknown[] = [["name", "ilike", stateName.trim()]];
  if (countryId) {
    domain.push(["country_id", "=", countryId]);
  }
  const rows = await client.searchRead<{ id: number }>("res.country.state", domain, ["id"], 1);
  return rows[0]?.id ?? false;
}

async function resolveTagIds(client: OdooClient, tags?: string): Promise<number[]> {
  if (!tags?.trim()) return [];
  const names = tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  const ids: number[] = [];
  for (const name of names) {
    const rows = await client.searchRead<{ id: number }>(
      "res.partner.category",
      [["name", "ilike", name]],
      ["id"],
      1,
    );
    if (rows[0]?.id) {
      ids.push(rows[0].id);
    }
  }
  return ids;
}

export async function createPartner(values: PartnerCreateValues): Promise<number> {
  const client = getOdooClient();
  if (!client) throw new Error("Odoo is not configured");

  const countryId = await resolveCountryId(client, values.country);
  const stateId = await resolveStateId(client, values.state, countryId);
  const tagIds = await resolveTagIds(client, values.tags);

  const phone = values.phone ?? "";
  const payload: Record<string, unknown> = {
    name: values.name,
    email: values.email.trim().toLowerCase(),
    phone,
    street: values.street ?? "",
    street2: values.street2 ?? "",
    city: values.city ?? "",
    zip: values.zip ?? "",
    vat: values.taxId ?? "",
    website: values.website ?? "",
    lang: values.language || "en_US",
    is_company: values.is_company ?? false,
    customer_rank: 1,
  };

  if (countryId) payload.country_id = countryId;
  if (stateId) payload.state_id = stateId;
  if (tagIds.length) payload.category_id = [[6, 0, tagIds]];

  return client.create("res.partner", payload);
}

export async function updatePartner(
  partnerId: number,
  values: PartnerCreateValues,
): Promise<void> {
  const client = getOdooClient();
  if (!client) throw new Error("Odoo is not configured");

  const countryId = await resolveCountryId(client, values.country);
  const stateId = await resolveStateId(client, values.state, countryId);
  const tagIds = await resolveTagIds(client, values.tags);

  const phone = values.phone ?? "";
  const payload: Record<string, unknown> = {
    name: values.name,
    street: values.street ?? "",
    street2: values.street2 ?? "",
    city: values.city ?? "",
    zip: values.zip ?? "",
    website: values.website ?? "",
    lang: values.language || "en_US",
    is_company: values.is_company ?? false,
  };
  // Phone is the unique identity for person accounts — only write when explicitly provided
  if (values.phone !== undefined) {
    payload.phone = phone;
  }
  // CR / VAT is unique identity — only write when explicitly provided (never on profile edit)
  if (values.taxId !== undefined) {
    payload.vat = values.taxId;
  }

  if (countryId) payload.country_id = countryId;
  if (stateId) payload.state_id = stateId;
  if (values.tags !== undefined) {
    payload.category_id = tagIds.length ? [[6, 0, tagIds]] : [[5]];
  }

  await client.write("res.partner", [partnerId], payload);
}

function odooChar(value: string | false | undefined): string | null {
  return typeof value === "string" && value ? value : null;
}

export async function setPartnerPasswordHash(partnerId: number, hash: string): Promise<void> {
  const client = getOdooClient();
  if (!client) throw new Error("Odoo not configured");
  try {
    await client.write("res.partner", [partnerId], { x_portal_password_hash: hash });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/x_portal_password_hash/i.test(message)) {
      throw new Error(
        "Odoo is missing writable Contact field x_portal_password_hash for the API user. " +
          "Create/fix that Char field on res.partner (Technical → Fields), then retry.",
      );
    }
    throw error;
  }
}

export async function getPartnerPasswordHash(partnerId: number): Promise<string | null> {
  const client = getOdooClient();
  if (!client) return null;
  try {
    const rows = await client.read<{ x_portal_password_hash: string | false }>(
      "res.partner",
      [partnerId],
      ["x_portal_password_hash"],
    );
    return odooChar(rows[0]?.x_portal_password_hash);
  } catch (error) {
    // Missing/inaccessible custom field must not crash login with a generic 503.
    const message = error instanceof Error ? error.message : String(error);
    if (/x_portal_password_hash/i.test(message)) {
      return null;
    }
    throw error;
  }
}

export async function updatePartnerPortalMeta(
  partnerId: number,
  meta: PartnerPortalMeta,
): Promise<void> {
  const client = getOdooClient();
  if (!client) throw new Error("Odoo not configured");
  await client.write("res.partner", [partnerId], meta);
}

export async function getPartnerPortalMeta(
  partnerId: number,
): Promise<(PartnerPortalMeta & { x_portal_password_hash?: string | null }) | null> {
  const client = getOdooClient();
  if (!client) return null;
  const rows = await client.read<{
    x_portal_password_hash: string | false;
    x_portal_account_id: string | false;
    x_portal_status: string | false;
    x_portal_created_at: string | false;
    x_portal_last_login: string | false;
  }>("res.partner", [partnerId], [...PARTNER_PORTAL_FIELDS]);
  const row = rows[0];
  if (!row) return null;
  const status = odooChar(row.x_portal_status);
  return {
    x_portal_password_hash: odooChar(row.x_portal_password_hash),
    x_portal_account_id: odooChar(row.x_portal_account_id) ?? undefined,
    x_portal_status:
      status === "active" || status === "disabled" || status === "deleted"
        ? status
        : undefined,
    x_portal_created_at: odooChar(row.x_portal_created_at) ?? undefined,
    x_portal_last_login: odooChar(row.x_portal_last_login) ?? undefined,
  };
}

export async function findPartnerByPortalAccountId(
  portalAccountId: string,
): Promise<{ id: number; email: string; is_company: boolean } | null> {
  const client = getOdooClient();
  if (!client || !portalAccountId.trim()) return null;
  const rows = await client.searchRead<{
    id: number;
    email: string | false;
    is_company: boolean;
  }>(
    "res.partner",
    [["x_portal_account_id", "=", portalAccountId.trim()]],
    ["id", "email", "is_company"],
    1,
  );
  const row = rows[0];
  if (!row) return null;
  return { id: row.id, email: str(row.email), is_company: Boolean(row.is_company) };
}

/** Soft-delete portal access on the partner — does not archive the CRM record. */
export async function softDeletePartnerPortal(partnerId: number): Promise<void> {
  const client = getOdooClient();
  if (!client) throw new Error("Odoo not configured");
  await client.write("res.partner", [partnerId], {
    x_portal_status: "deleted",
    x_portal_password_hash: "",
  });
}
