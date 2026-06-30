import { getOdooClient, type OdooClient } from "./client";
import type { ClientProfile } from "../types";

/** Fields customers are allowed to see — never use fields=[] */
export const PARTNER_PROFILE_FIELDS = [
  "name",
  "email",
  "phone",
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

type OdooPartner = {
  id: number;
  name: string;
  email: string | false;
  phone: string | false;
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
    phone: str(partner.phone),
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

  const rows = await client.searchRead<OdooPartner>(
    "res.partner",
    ["|", ["phone", "ilike", digits], ["mobile", "ilike", digits]],
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

  const payload: Record<string, unknown> = {
    name: values.name,
    email: values.email.trim().toLowerCase(),
    phone: values.phone ?? "",
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

  const payload: Record<string, unknown> = {
    name: values.name,
    phone: values.phone ?? "",
    street: values.street ?? "",
    street2: values.street2 ?? "",
    city: values.city ?? "",
    zip: values.zip ?? "",
    vat: values.taxId ?? "",
    website: values.website ?? "",
    lang: values.language || "en_US",
    is_company: values.is_company ?? false,
  };

  if (countryId) payload.country_id = countryId;
  if (stateId) payload.state_id = stateId;
  if (values.tags !== undefined) {
    payload.category_id = tagIds.length ? [[6, 0, tagIds]] : [[5]];
  }

  await client.write("res.partner", [partnerId], payload);
}
