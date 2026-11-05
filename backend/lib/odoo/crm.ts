/**
 * lib/odoo/crm.ts
 *
 * Creates crm.lead records from website Request Quote submissions.
 * Reuses the shared API-key JSON-RPC client (rpc.ts).
 *
 * Quote refs come from Odoo ir.sequence `request.quote` (e.g. RQ-2026-000001).
 * Callers treat CRM create as best-effort after the sales email is sent.
 */
import type { ContactCategory } from "@shared/lib/contact-request";
import { normalizeOdooBaseUrl, type OdooDomain, type OdooRpcSession } from "./rpc";

export type { ContactCategory };

/** Odoo ir.sequence code for Request Quote (provisioned in Studio / Settings). */
export const REQUEST_QUOTE_SEQUENCE = "request.quote";

/**
 * Optional Studio/char field on crm.lead for the quote ref.
 * Default empty — ref is always stored in description (+ name).
 */
export function quoteReferenceField(): string | undefined {
  const f = process.env.ODOO_QUOTE_REF_FIELD?.trim();
  return f || undefined;
}

export type CrmLeadInput = {
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  phone: string;
  product?: string;
  qty?: string;
  /** Drives company_id; categoryLabel is just the display text. Undefined = plain
   *  contact message (never reaches createCrmLead — see app/api/contact/route.ts). */
  category?: ContactCategory;
  categoryLabel?: string;
  message?: string;
  /** Odoo sequence value (RQ-…) or JS fallback. */
  quoteRef?: string;
  customerType?: "individual" | "company";
  profession?: string;
  /** Odoo Tax ID (res.partner vat). */
  vatId?: string;
  crNumber?: string;
  countryCode?: string;
  phoneLocal?: string;
  contactName?: string;
  attachmentName?: string;
  /** Link to portal customer when email matches an existing res.partner. */
  partnerId?: number;
  /**
   * Website capture channel. Talk to Expert leads use a distinct CRM title/source
   * and are created without quote-email side effects (see /api/talk-to-expert).
   */
  channel?: "request-quote" | "talk-to-expert";
};

/**
 * Product type → Odoo company. software → SOFTWARE, elv → INFRA, solar → SOLAR.
 * The Request Quote Product Type is the only input (see resolveContactRouting).
 *
 * Exhaustive + fail-loud on purpose: an unrecognized category (typo, a new
 * ContactCategory added without updating this map, env var not set) must
 * throw, not silently fall through to SOFTWARE. createCrmLead()'s caller
 * (app/api/contact/route.ts) already catches + alerts via
 * reportCrmLeadFailure on any throw here, so this can't misfile a lead
 * without anyone noticing — it just skips company_id and pages ops instead.
 */
export function companyIdForCategory(category?: ContactCategory): number | undefined {
  if (category === undefined) return undefined;

  const envVar: Record<ContactCategory, string> = {
    software: "ODOO_SOFTWARE_COMPANY_ID",
    elv: "ODOO_ELV_COMPANY_ID",
    solar: "ODOO_SOLAR_COMPANY_ID",
  };
  const varName = envVar[category];
  if (!varName) {
    throw new Error(`companyIdForCategory: unrecognized category "${category}"`);
  }

  const raw = process.env[varName];
  const id = Number(raw);
  if (!raw || !Number.isInteger(id) || id <= 0) {
    throw new Error(
      `companyIdForCategory: ${varName} is not set to a valid company id (got "${raw ?? ""}"). ` +
        `Set it in the environment or a lead for category "${category}" cannot be routed.`,
    );
  }
  return id;
}

/** Sales team name created when that company has no team yet. */
export const CRM_TEAM_NAME: Record<ContactCategory, string> = {
  software: "Software Sales Team",
  elv: "ELV Sales Team",
  solar: "Solar Sales Team",
};

/**
 * Sales team + stage for a product type.
 * company_id is recomputed from the team (then the partner). A quote with
 * no team is filed under the partner's company — that is how ELV quotes
 * landed on Smart Grid while the Software pipeline was open. createCrmLead
 * fills a team on the target company when these env vars are empty.
 *
 * Priority:
 *   1. Category-specific env
 *   2. Legacy catch-all env (ODOO_CRM_TEAM_ID) — only if it belongs to the
 *      target company; createCrmLead drops it otherwise
 *   3. Unset → lookup / create CRM_TEAM_NAME on that company
 */
export function crmTeamConfig(category?: ContactCategory): {
  teamId: number | undefined;
  stageId: number | undefined;
} {
  function positiveInt(raw: string | undefined): number | undefined {
    const n = Number(raw?.trim() ?? "");
    return Number.isInteger(n) && n > 0 ? n : undefined;
  }

  const specific =
    category === "elv"
      ? {
          team: process.env.ODOO_CRM_ELV_TEAM_ID,
          stage: process.env.ODOO_CRM_ELV_STAGE_ID,
        }
      : category === "solar"
        ? {
            team: process.env.ODOO_CRM_SOLAR_TEAM_ID,
            stage: process.env.ODOO_CRM_SOLAR_STAGE_ID,
          }
        : {
            team: process.env.ODOO_CRM_SOFTWARE_TEAM_ID,
            stage: process.env.ODOO_CRM_SOFTWARE_STAGE_ID,
          };

  return {
    teamId: positiveInt(specific.team) ?? positiveInt(process.env.ODOO_CRM_TEAM_ID),
    stageId:
      positiveInt(specific.stage) ?? positiveInt(process.env.ODOO_CRM_STAGE_ID),
  };
}

function m2oId(value: [number, string] | false | undefined): number | undefined {
  return Array.isArray(value) ? value[0] : undefined;
}

/**
 * Team whose company_id is exactly `companyId`.
 * ponytail: process-lifetime cache. A team renamed in Odoo is picked up on restart.
 */
const teamByCompany = new Map<number, number>();

async function teamOnCompany(
  category: ContactCategory,
  companyId: number,
  preferred?: number,
): Promise<number> {
  return withAuthRetry(async (session) => {
    const { searchRead, read, create } = await import("./rpc");

    if (preferred && preferred > 0) {
      const rows = await read<{
        id: number;
        company_id: [number, string] | false;
      }>(session, "crm.team", [preferred], ["id", "company_id"]);
      if (m2oId(rows[0]?.company_id) === companyId) return preferred;
    }

    const cached = teamByCompany.get(companyId);
    if (cached) return cached;

    const teams = await searchRead<{ id: number; name: string }>(
      session,
      "crm.team",
      [["company_id", "=", companyId]],
      { fields: ["id", "name"], limit: 20 },
    );
    const wanted = CRM_TEAM_NAME[category];
    const existing =
      teams.find((team) => team.name === wanted)?.id ?? teams[0]?.id;
    const id =
      existing ??
      (await create(session, "crm.team", {
        name: wanted,
        company_id: companyId,
      }));
    teamByCompany.set(companyId, id);
    return id;
  });
}

/**
 * Write company + team again after create. Odoo recomputes company_id from
 * user_id, then team_id, then partner_id, so the create values alone do not stick.
 */
async function pinLeadCompany(
  leadId: number,
  companyId: number,
  teamId: number,
): Promise<void> {
  await withAuthRetry(async (session) => {
    const { executeKw } = await import("./rpc");
    // Current company has to be the target one. A mixed allowed list hides the row.
    const context = { allowed_company_ids: [companyId] };
    const patch: Record<string, unknown> = {
      company_id: companyId,
      team_id: teamId,
    };
    if (process.env.ODOO_CRM_UNASSIGN !== "0") patch.user_id = false;
    await executeKw(session, "crm.lead", "write", [[leadId], patch], { context });
    const rows = await executeKw<
      { company_id: [number, string] | false; team_id: [number, string] | false }[]
    >(session, "crm.lead", "read", [[leadId], ["company_id", "team_id"]], { context });
    const row = rows[0];
    if (m2oId(row?.company_id) !== companyId || m2oId(row?.team_id) !== teamId) {
      throw new Error(
        `crm.lead #${leadId} company/team did not stick ` +
          `(company=${JSON.stringify(row?.company_id)} team=${JSON.stringify(row?.team_id)}, ` +
          `wanted company=${companyId} team=${teamId})`,
      );
    }
  });
}

/** Default Odoo CRM stage name for Talk to Expert website leads. */
export const TALK_TO_EXPERT_STAGE_NAME_DEFAULT = "Website cold calling leads";

/**
 * Pipeline placement for Talk to Expert chatbot leads.
 * Prefer ODOO_CRM_TALK_TO_EXPERT_STAGE_ID; name lookup fills stage when unset.
 */
export function talkToExpertCrmConfig(): {
  teamId: number | undefined;
  stageId: number | undefined;
} {
  function positiveInt(raw: string | undefined): number | undefined {
    const n = Number(raw?.trim() ?? "");
    return Number.isInteger(n) && n > 0 ? n : undefined;
  }

  return {
    teamId:
      positiveInt(process.env.ODOO_CRM_TALK_TO_EXPERT_TEAM_ID) ??
      positiveInt(process.env.ODOO_CRM_SOFTWARE_TEAM_ID) ??
      positiveInt(process.env.ODOO_CRM_TEAM_ID),
    stageId: positiveInt(process.env.ODOO_CRM_TALK_TO_EXPERT_STAGE_ID),
  };
}

export function talkToExpertStageName(): string {
  return (
    process.env.ODOO_CRM_TALK_TO_EXPERT_STAGE_NAME?.trim() ||
    TALK_TO_EXPERT_STAGE_NAME_DEFAULT
  );
}

async function withAuthRetry<T>(fn: (session: OdooRpcSession) => Promise<T>): Promise<T> {
  const {
    getOdooServiceSession,
    invalidateOdooServiceSession,
    isOdooConfigured,
  } = await import("./client");
  const { OdooRpcError } = await import("./rpc");

  if (!isOdooConfigured()) {
    throw new Error("Odoo is not configured");
  }

  try {
    return await fn(await getOdooServiceSession());
  } catch (err) {
    const unauthorized =
      err instanceof OdooRpcError &&
      (err.httpStatus === 401 || /access|denied|auth/i.test(err.message));
    if (!unauthorized) throw err;
    invalidateOdooServiceSession();
    return fn(await getOdooServiceSession());
  }
}

/**
 * Ensure sequence code `request.quote` exists.
 * Staging has a sequence with prefix RQ-%(year)s- but blank code — set it.
 */
export async function ensureRequestQuoteSequence(
  session: OdooRpcSession,
): Promise<void> {
  const { create, searchRead, write } = await import("./rpc");

  const byCode = await searchRead<{ id: number }>(
    session,
    "ir.sequence",
    [["code", "=", REQUEST_QUOTE_SEQUENCE]],
    { fields: ["id"], limit: 1 },
  );
  if (byCode[0]?.id) return;

  // Existing Studio sequence often has no code (code=false).
  const byPrefix = await searchRead<{ id: number; code: string | false }>(
    session,
    "ir.sequence",
    [
      "|",
      ["prefix", "=like", "RQ-%"],
      "|",
      ["name", "ilike", "request quote"],
      ["name", "ilike", "requst quote"],
    ],
    { fields: ["id", "code"], limit: 1 },
  );
  if (byPrefix[0]?.id) {
    if (!byPrefix[0].code) {
      await write(session, "ir.sequence", byPrefix[0].id, {
        code: REQUEST_QUOTE_SEQUENCE,
      });
    }
    return;
  }

  const id = await create(session, "ir.sequence", {
    name: "Request Quote",
    code: REQUEST_QUOTE_SEQUENCE,
    prefix: "RQ-%(year)s-",
    padding: 6,
    implementation: "standard",
  });
  if (!id) {
    throw new Error(`Failed to create ir.sequence ${REQUEST_QUOTE_SEQUENCE}`);
  }
}

/**
 * Next value from ir.sequence `request.quote` (e.g. RQ-2026-000001).
 * Never invents a JS fallback — caller decides.
 */
export async function nextRequestQuoteRef(): Promise<string> {
  return withAuthRetry(async (session) => {
    const { executeKw } = await import("./rpc");
    await ensureRequestQuoteSequence(session);
    const raw = await executeKw<string | false | null>(
      session,
      "ir.sequence",
      "next_by_code",
      [REQUEST_QUOTE_SEQUENCE],
    );
    const ref = typeof raw === "string" ? raw.trim() : "";
    if (!ref) {
      throw new Error(
        `Odoo sequence ${REQUEST_QUOTE_SEQUENCE} returned an empty reference`,
      );
    }
    return ref;
  });
}

/** Pure crm.lead field map — unit-tested in crm.check.ts. */
export function buildCrmLeadValues(
  input: CrmLeadInput,
): Record<string, unknown> {
  const contactName =
    (input.contactName ?? "").trim() ||
    [input.firstName, input.lastName]
      .map((s) => s.trim())
      .filter(Boolean)
      .join(" ");
  const product = (input.product ?? "").trim();
  const quoteRef = (input.quoteRef ?? "").trim();
  const isTalkToExpert = input.channel === "talk-to-expert";
  const isQuoteProduct =
    !isTalkToExpert &&
    Boolean(product) &&
    product !== "Others" &&
    product !== "Select Product" &&
    product !== "Select Products" &&
    product !== "Select Software Product";
  const customerType = input.customerType;
  const isIndividual = customerType === "individual";
  const isCompany = customerType === "company";

  // Individual quotes must not carry company Tax ID / CR into Odoo.
  const taxId = isCompany ? (input.vatId ?? "").trim() : "";
  const crNumber = isCompany ? (input.crNumber ?? "").trim() : "";
  // Never send the placeholder company label "Individual" as an Odoo company name.
  const companyName = isIndividual
    ? ""
    : input.company.trim() === "Individual"
      ? ""
      : input.company.trim();

  const sourceLabel = isTalkToExpert
    ? "Website – Talk to an Expert"
    : "Website – Request Quote";

  const description = isTalkToExpert
    ? [
        `Name: ${contactName || "—"}`,
        `Email: ${input.email.trim() || "—"}`,
        `Phone: ${input.phone.trim() || "—"}`,
        input.message?.trim() ? `Notes: ${input.message.trim()}` : null,
        `Source: ${sourceLabel}`,
      ]
        .filter(Boolean)
        .join(", ")
    : [
        quoteRef ? `Quote Ref: ${quoteRef}` : null,
        customerType
          ? `Customer Type: ${isCompany ? "Company" : "Individual"}`
          : null,
        `Client Message: ${input.message?.trim() || "—"}`,
        `Product: ${product || "—"}`,
        `QTY: ${input.qty?.trim() || "—"}`,
        isIndividual && input.profession?.trim()
          ? `Profession: ${input.profession.trim()}`
          : null,
        taxId ? `Tax ID: ${taxId}` : null,
        crNumber ? `CR Number: ${crNumber}` : null,
        input.countryCode?.trim()
          ? `Country Code: ${input.countryCode.trim()}`
          : null,
        input.phoneLocal?.trim()
          ? `Phone (local): ${input.phoneLocal.trim()}`
          : null,
        input.attachmentName?.trim()
          ? `Attachment: ${input.attachmentName.trim()}`
          : null,
        `Category: ${input.categoryLabel?.trim() || "—"}`,
        `Source: ${sourceLabel}`,
      ]
        .filter(Boolean)
        .join(", ");

  const values: Record<string, unknown> = {
    name: isTalkToExpert
      ? `Talk to an Expert – ${contactName || "Website lead"}`
      : isQuoteProduct
        ? quoteRef
          ? `Request a Quote – ${product} (${quoteRef})`
          : `Request a Quote – ${product}`
        : `Website contact – ${contactName || companyName}`,
    contact_name: contactName,
    // Empty company name → Odoo treats the opportunity as an Individual customer.
    // Non-empty partner_name → Company customer.
    partner_name: isTalkToExpert || isIndividual ? "" : companyName,
    phone: input.phone.trim(),
    // Contacts tab "Job Position". Only individuals submit a profession.
    ...(isIndividual && !isTalkToExpert && input.profession?.trim()
      ? { function: input.profession.trim() }
      : {}),
    description,
    // Talk to Expert + quotes both land in CRM Pipeline (opportunities).
    // The "Website cold calling leads" column is a Pipeline stage — type=lead
    // hid records from My Pipeline / team pipelines where that stage lives.
    type: "opportunity",
  };

  const email = input.email.trim();
  if (email) values.email_from = email;

  if (input.partnerId && Number.isInteger(input.partnerId) && input.partnerId > 0) {
    values.partner_id = input.partnerId;
  }

  const refField = quoteReferenceField();
  if (refField && quoteRef && !isTalkToExpert) {
    values[refField] = quoteRef;
  }

  // Optional Studio/selection field for Individual vs Company (e.g. x_studio_customer_type).
  const customerTypeField = process.env.ODOO_CRM_CUSTOMER_TYPE_FIELD?.trim();
  if (customerTypeField && (isIndividual || isCompany) && !isTalkToExpert) {
    values[customerTypeField] = isCompany ? "company" : "individual";
  }

  // Product type → company. Talk to Expert stays on the Software company.
  if (isTalkToExpert) {
    const softwareCompany = Number(process.env.ODOO_SOFTWARE_COMPANY_ID);
    if (Number.isInteger(softwareCompany) && softwareCompany > 0) {
      values.company_id = softwareCompany;
    }
    const { teamId, stageId } = talkToExpertCrmConfig();
    if (teamId) values.team_id = teamId;
    if (stageId) values.stage_id = stageId;
  } else {
    const companyId = companyIdForCategory(input.category);
    if (companyId) values.company_id = companyId;

    const { teamId, stageId } = crmTeamConfig(input.category);
    if (teamId) values.team_id = teamId;
    if (stageId) values.stage_id = stageId;
  }

  // Omit user_id so Sales Team / New is visible. `false` breaks some Odoo DBs;
  // Talk to Expert never sends it (retry path still strips it for quotes).
  const unassign = process.env.ODOO_CRM_UNASSIGN !== "0";
  if (unassign && !isTalkToExpert) values.user_id = false;

  return values;
}

/** Email Odoo will accept on res.partner. "anagha r" is not an email. */
export function usableQuoteEmail(email: string): string {
  const trimmed = email.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) ? trimmed : "";
}

function normName(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function normId(value: string): string {
  return value.replace(/[\s-]/g, "").toLowerCase();
}

/** Last 6–8 digits. Short numbers never match (too many collisions). */
export function phonesMatch(a: string, b: string): boolean {
  const da = a.replace(/\D/g, "");
  const db = b.replace(/\D/g, "");
  if (da.length < 6 || db.length < 6) return false;
  const n = Math.min(8, da.length, db.length);
  return da.slice(-n) === db.slice(-n);
}

function idsConflict(current: string, incoming: string): boolean {
  const a = normId(current);
  const b = normId(incoming);
  return Boolean(a && b && a !== b);
}

function lowestId<T extends { id: number }>(rows: T[]): T | undefined {
  return rows.reduce<T | undefined>(
    (best, row) => (!best || row.id < best.id ? row : best),
    undefined,
  );
}

/** Snapshot of res.partner used to reuse a customer instead of creating one. */
export type QuotePartnerRow = {
  id: number;
  name: string;
  email: string;
  phone: string;
  vat: string;
  companyRegistry: string;
  isCompany: boolean;
  parentId?: number;
  job: string;
};

export type QuotePartnerQuery = {
  vat: string;
  cr: string;
  name: string;
  phone: string;
};

/**
 * Prefer Tax ID, then CR, then company name.
 * A name hit is rejected when the existing Tax ID or CR disagrees.
 * ponytail: several companies sharing a name → oldest id. Upgrade = require Tax ID or CR.
 */
export function chooseCompanyPartner(
  rows: QuotePartnerRow[],
  query: QuotePartnerQuery,
): QuotePartnerRow | undefined {
  const companies = rows.filter((row) => row.isCompany);
  const byVat = query.vat
    ? companies.filter((row) => normId(row.vat) === normId(query.vat))
    : [];
  if (byVat.length) return lowestId(byVat);
  const byCr = query.cr
    ? companies.filter(
        (row) => normId(row.companyRegistry) === normId(query.cr),
      )
    : [];
  if (byCr.length) return lowestId(byCr);
  const byName = companies.filter(
    (row) =>
      normName(row.name) === normName(query.name) &&
      query.name.trim() &&
      !idsConflict(row.vat, query.vat) &&
      !idsConflict(row.companyRegistry, query.cr),
  );
  const byPhone = byName.filter((row) => phonesMatch(row.phone, query.phone));
  if (byPhone.length) return lowestId(byPhone);
  return lowestId(byName);
}

export function choosePersonPartner(
  rows: QuotePartnerRow[],
  query: { name: string; email: string; phone: string; parentId?: number },
): QuotePartnerRow | undefined {
  const people = rows.filter((row) => !row.isCompany);
  const email = usableQuoteEmail(query.email).toLowerCase();
  if (email) {
    const hits = people.filter((row) => row.email.trim().toLowerCase() === email);
    // Don't attach a quote to a contact that already belongs to a different company.
    const eligible = query.parentId
      ? hits.filter((row) => !row.parentId || row.parentId === query.parentId)
      : hits;
    const underParent = query.parentId
      ? eligible.filter((row) => row.parentId === query.parentId)
      : eligible;
    const pool = underParent.length ? underParent : eligible;
    const picked = lowestId(pool);
    if (picked) return picked;
  }
  if (query.parentId && query.name.trim()) {
    const hits = people.filter(
      (row) =>
        row.parentId === query.parentId &&
        normName(row.name) === normName(query.name),
    );
    const byPhone = hits.filter((row) => phonesMatch(row.phone, query.phone));
    return lowestId(byPhone.length ? byPhone : hits);
  }
  // No company parent: name alone is too common. Require phone or we already matched email.
  if (!query.parentId && query.name.trim()) {
    const hits = people.filter(
      (row) => !row.parentId && normName(row.name) === normName(query.name),
    );
    return lowestId(hits.filter((row) => phonesMatch(row.phone, query.phone)));
  }
  return undefined;
}

/** Fill only blank partner fields. Never overwrite a Tax ID or CR already on file. */
export function partnerFieldPatch(
  current: Pick<QuotePartnerRow, "email" | "phone" | "vat" | "companyRegistry" | "job">,
  desired: { email: string; phone: string; vat: string; companyRegistry: string; job: string },
): Record<string, string> {
  const patch: Record<string, string> = {};
  const email = usableQuoteEmail(desired.email);
  if (!current.email.trim() && email) patch.email = email;
  if (!current.phone.trim() && desired.phone.trim()) patch.phone = desired.phone.trim();
  if (!current.vat.trim() && desired.vat.trim()) patch.vat = desired.vat.trim();
  if (!current.companyRegistry.trim() && desired.companyRegistry.trim()) {
    patch.company_registry = desired.companyRegistry.trim();
  }
  if (!current.job.trim() && desired.job.trim()) patch.function = desired.job.trim();
  return patch;
}

type PartnerRaw = {
  id: number;
  name: string | false;
  email: string | false;
  phone: string | false;
  vat: string | false;
  company_registry?: string | false;
  is_company: boolean;
  parent_id: [number, string] | false;
  function: string | false;
};

function odooStr(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toPartnerRow(row: PartnerRaw): QuotePartnerRow {
  return {
    id: row.id,
    name: odooStr(row.name),
    email: odooStr(row.email),
    phone: odooStr(row.phone),
    vat: odooStr(row.vat),
    companyRegistry: odooStr(row.company_registry),
    isCompany: Boolean(row.is_company),
    parentId: Array.isArray(row.parent_id) ? row.parent_id[0] : undefined,
    job: odooStr(row.function),
  };
}

// ponytail: one failed read flips this off for the process. Upgrade = drop the probe when every DB has company_registry.
let companyRegistryField = true;

const PARTNER_BASE_FIELDS = [
  "id",
  "name",
  "email",
  "phone",
  "vat",
  "is_company",
  "parent_id",
  "function",
] as const;

function partnerFields(): string[] {
  return companyRegistryField
    ? [...PARTNER_BASE_FIELDS, "company_registry"]
    : [...PARTNER_BASE_FIELDS];
}

async function searchPartners(
  session: OdooRpcSession,
  domain: OdooDomain,
): Promise<QuotePartnerRow[]> {
  const { searchRead } = await import("./rpc");
  const { OdooRpcError } = await import("./rpc");
  try {
    const rows = await searchRead<PartnerRaw>(session, "res.partner", domain, {
      fields: partnerFields(),
      limit: 8,
    });
    return rows.map(toPartnerRow);
  } catch (err) {
    const missing =
      err instanceof OdooRpcError &&
      /Invalid field 'company_registry'/.test(err.message);
    if (!missing) throw err;
    companyRegistryField = false;
    const domainUsesRegistry = domain.some(
      (item) => Array.isArray(item) && item[0] === "company_registry",
    );
    if (domainUsesRegistry) return [];
    const rows = await searchRead<PartnerRaw>(session, "res.partner", domain, {
      fields: partnerFields(),
      limit: 8,
    });
    return rows.map(toPartnerRow);
  }
}

async function savePartner(
  session: OdooRpcSession,
  values: Record<string, unknown>,
  existingId?: number,
): Promise<number> {
  const { create, write } = await import("./rpc");
  const payload = { ...values };
  if (!companyRegistryField) delete payload.company_registry;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      if (existingId) {
        if (Object.keys(payload).length) await write(session, "res.partner", existingId, payload);
        return existingId;
      }
      const id = await create(session, "res.partner", payload);
      if (!id) throw new Error("Odoo returned no res.partner id");
      return id;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (payload.company_registry && /company_registry|Invalid field/i.test(message)) {
        companyRegistryField = false;
        delete payload.company_registry;
        continue;
      }
      // Odoo rejects some Tax ID formats. Keep the partner; Tax ID stays in the lead notes.
      if (payload.vat && /vat/i.test(message)) {
        delete payload.vat;
        continue;
      }
      throw err;
    }
  }
  throw new Error("res.partner save failed");
}

function rememberPartner(bucket: QuotePartnerRow[], rows: QuotePartnerRow[]) {
  for (const row of rows) {
    if (!bucket.some((existing) => existing.id === row.id)) bucket.push(row);
  }
}

export type LinkedQuotePartner = {
  partnerId: number;
  email: string;
  phone: string;
};

/**
 * Find or create the company + contact for a Request Quote and return the
 * contact to store on crm.lead.partner_id.
 * Without partner_id, New Quotation defaults to "Create a new customer" and
 * the new record misses Tax ID / CR (those are not crm.lead columns).
 */
export async function linkQuotePartner(
  input: CrmLeadInput,
): Promise<LinkedQuotePartner | undefined> {
  if (input.channel === "talk-to-expert") return undefined;

  const isIndividual = input.customerType === "individual";
  const isCompany = input.customerType === "company";
  const contactName =
    (input.contactName ?? "").trim() ||
    [input.firstName, input.lastName]
      .map((part) => part.trim())
      .filter(Boolean)
      .join(" ");
  const companyName = isIndividual
    ? ""
    : input.company.trim() === "Individual"
      ? ""
      : input.company.trim();
  if (!companyName && !contactName) return undefined;

  const phone = input.phone.trim();
  const email = usableQuoteEmail(input.email);
  const vat = isCompany ? (input.vatId ?? "").trim() : "";
  const cr = isCompany ? (input.crNumber ?? "").trim() : "";
  const job = isIndividual ? (input.profession ?? "").trim() : "";
  const linkCompany = Boolean(companyName) && !isIndividual;

  return withAuthRetry(async (session) => {
    const found: QuotePartnerRow[] = [];
    if (input.partnerId && input.partnerId > 0) {
      rememberPartner(
        found,
        await searchPartners(session, [["id", "=", input.partnerId]]),
      );
    }
    if (email) {
      rememberPartner(
        found,
        await searchPartners(session, [["email", "=ilike", email]]),
      );
    }

    let company: QuotePartnerRow | undefined;
    if (linkCompany) {
      if (vat) {
        rememberPartner(
          found,
          await searchPartners(session, [["is_company", "=", true], ["vat", "ilike", normId(vat)]]),
        );
      }
      if (cr && companyRegistryField) {
        rememberPartner(
          found,
          await searchPartners(session, [
            ["is_company", "=", true],
            ["company_registry", "ilike", normId(cr)],
          ]),
        );
      }
      rememberPartner(
        found,
        await searchPartners(session, [
          ["is_company", "=", true],
          ["name", "=ilike", companyName],
        ]),
      );
      company = chooseCompanyPartner(found, {
        vat,
        cr,
        name: companyName,
        phone,
      });
      if (!company) {
        const id = await savePartner(session, {
          name: companyName,
          is_company: true,
          company_type: "company",
          // Shared contact: a Software customer can also buy ELV or Solar.
          // A company-locked partner cannot be linked to another company's lead.
          company_id: false,
          ...(phone ? { phone } : {}),
          ...(vat ? { vat } : {}),
          ...(cr && companyRegistryField ? { company_registry: cr } : {}),
        });
        company = {
          id,
          name: companyName,
          email: "",
          phone,
          vat,
          companyRegistry: cr,
          isCompany: true,
          job: "",
        };
      } else {
        const patch = partnerFieldPatch(company, {
          email: "",
          phone,
          vat,
          companyRegistry: cr,
          job: "",
        });
        await savePartner(session, patch, company.id);
        company = {
          ...company,
          phone: company.phone || phone,
          vat: company.vat || vat,
          companyRegistry: company.companyRegistry || cr,
        };
      }
    }

    if (!contactName) {
      if (!company) return undefined;
      return { partnerId: company.id, email: company.email, phone: company.phone || phone };
    }

    if (company) {
      rememberPartner(
        found,
        await searchPartners(session, [
          ["parent_id", "=", company.id],
          ["name", "=ilike", contactName],
        ]),
      );
    } else if (phone) {
      const tail = phone.replace(/\D/g, "").slice(-8);
      rememberPartner(
        found,
        await searchPartners(session, [
          ["is_company", "=", false],
          ["name", "=ilike", contactName],
          ...(tail.length >= 6 ? [["phone", "ilike", tail] as [string, string, string]] : []),
        ]),
      );
    }

    let person = choosePersonPartner(found, {
      name: contactName,
      email,
      phone,
      parentId: company?.id,
    });
    if (!person) {
      const id = await savePartner(session, {
        name: contactName,
        is_company: false,
        company_type: "person",
        type: "contact",
        company_id: false,
        ...(company ? { parent_id: company.id } : {}),
        ...(phone ? { phone } : {}),
        ...(email ? { email } : {}),
        ...(job ? { function: job } : {}),
      });
      person = {
        id,
        name: contactName,
        email,
        phone,
        vat: "",
        companyRegistry: "",
        isCompany: false,
        parentId: company?.id,
        job,
      };
    } else {
      const patch = partnerFieldPatch(person, {
        email,
        phone,
        vat: "",
        companyRegistry: "",
        job,
      });
      await savePartner(session, patch, person.id);
      person = {
        ...person,
        email: person.email || email,
        phone: person.phone || phone,
        job: person.job || job,
      };
    }

    // A matching person with no company yet should sit under the quote's company
    // so quotations show "Company, Contact" and share its Tax ID / CR.
    if (company && !person.parentId) {
      await savePartner(session, { parent_id: company.id }, person.id);
      person = { ...person, parentId: company.id };
    }

    console.info(
      `[crm] quote partner #${person.id}` +
        (company ? ` company #${company.id}` : ""),
    );
    return {
      partnerId: person.id,
      email: person.email,
      phone: person.phone || phone,
    };
  });
}

/** Find an existing portal/customer partner by email (for linking Request Quote leads). */
export async function findPartnerIdByEmail(email: string): Promise<number | undefined> {
  const trimmed = email.trim();
  if (!trimmed) return undefined;

  return withAuthRetry(async (session) => {
    const { searchRead } = await import("./rpc");
    const rows = await searchRead<{ id: number }>(
      session,
      "res.partner",
      [["email", "=ilike", trimmed]],
      { fields: ["id"], limit: 1 },
    );
    return rows[0]?.id;
  });
}

type CrmStagePlacement = {
  stageId: number;
  stageName: string;
  /** First sales team linked to the stage, if any. */
  teamId?: number;
};

/**
 * Resolve stage + matching sales team.
 * Aptus Odoo uses `team_ids` on crm.stage (not legacy `team_id`) — never
 * request `team_id` or search_read fails with Invalid field.
 */
async function searchCrmStagePlacement(
  domain: OdooDomain,
): Promise<CrmStagePlacement | undefined> {
  return withAuthRetry(async (session) => {
    const { searchRead } = await import("./rpc");
    const rows = await searchRead<{
      id: number;
      name: string;
      team_ids: number[] | false;
    }>(session, "crm.stage", domain, {
      fields: ["id", "name", "team_ids"],
      limit: 1,
    });
    const stage = rows[0];
    if (!stage) return undefined;
    const teamId =
      Array.isArray(stage.team_ids) && stage.team_ids.length > 0
        ? stage.team_ids[0]
        : undefined;
    return { stageId: stage.id, stageName: stage.name, teamId };
  });
}

/** Find crm.stage id by name (e.g. "Website cold calling leads"). */
export async function findCrmStageIdByName(
  name: string,
): Promise<number | undefined> {
  const placement = await findCrmStagePlacementByName(name);
  return placement?.stageId;
}

export async function findCrmStagePlacementByName(
  name: string,
): Promise<CrmStagePlacement | undefined> {
  const trimmed = name.trim();
  if (!trimmed) return undefined;
  return searchCrmStagePlacement([["name", "=ilike", trimmed]]);
}

export async function findCrmStagePlacementById(
  stageId: number,
): Promise<CrmStagePlacement | undefined> {
  if (!Number.isInteger(stageId) || stageId <= 0) return undefined;
  return searchCrmStagePlacement([["id", "=", stageId]]);
}

/**
 * Talk to Expert must land on the configured Pipeline stage (and its team).
 * Throws when the stage cannot be resolved — do not silently use "New".
 * If STAGE_ID points at a differently named stage, fall back to name lookup.
 */
export async function resolveTalkToExpertPlacement(): Promise<{
  stageId: number;
  stageName: string;
  teamId?: number;
}> {
  const { teamId: envTeamId, stageId: envStageId } = talkToExpertCrmConfig();
  const expectedName = talkToExpertStageName();

  let placement: CrmStagePlacement | undefined;
  if (envStageId) {
    placement = await findCrmStagePlacementById(envStageId);
    if (!placement) {
      throw new Error(
        `ODOO_CRM_TALK_TO_EXPERT_STAGE_ID=${envStageId} was not found in Odoo crm.stage. ` +
          `Open CRM → Configuration → Stages, confirm the id for "${expectedName}", and update the env var.`,
      );
    }
    const nameMatches =
      placement.stageName.trim().toLowerCase() ===
      expectedName.trim().toLowerCase();
    if (!nameMatches) {
      console.warn(
        `[crm] Talk to Expert STAGE_ID=${envStageId} is "${placement.stageName}", ` +
          `expected "${expectedName}" — resolving by name instead.`,
      );
      const byName = await findCrmStagePlacementByName(expectedName);
      if (!byName) {
        throw new Error(
          `ODOO_CRM_TALK_TO_EXPERT_STAGE_ID=${envStageId} is "${placement.stageName}", not "${expectedName}". ` +
            `Update the env var to the correct stage id on this Odoo database.`,
        );
      }
      placement = byName;
    }
  } else {
    placement = await findCrmStagePlacementByName(expectedName);
    if (!placement) {
      throw new Error(
        `CRM stage "${expectedName}" was not found. Create it under CRM → Configuration → Stages ` +
          `(or on the Sales Team pipeline), then set ODOO_CRM_TALK_TO_EXPERT_STAGE_ID to its id.`,
      );
    }
  }

  return {
    stageId: placement.stageId,
    stageName: placement.stageName,
    teamId: placement.teamId ?? envTeamId,
  };
}

/** Deep-link to open a crm.lead / opportunity form in Odoo. */
export function crmLeadFormUrl(leadId: number): string {
  const base = normalizeOdooBaseUrl(process.env.ODOO_URL ?? "");
  return `${base}/web#id=${leadId}&model=crm.lead&view_type=form`;
}

/**
 * Create a crm.lead. Returns the lead id.
 * Throws on Odoo errors — caller decides how to degrade.
 * Reuses a worker-cached JSON-RPC session (no login per quote).
 */
export async function createCrmLead(input: CrmLeadInput): Promise<number> {
  const {
    getOdooServiceSession,
    invalidateOdooServiceSession,
    isOdooConfigured,
  } = await import("./client");
  const { OdooRpcError } = await import("./rpc");

  if (!isOdooConfigured()) {
    throw new Error("Odoo is not configured");
  }

  const attempt = async (
    session: OdooRpcSession,
    values: Record<string, unknown>,
  ) => {
    const { executeKw } = await import("./rpc");
    const companyId = values.company_id;
    const context =
      typeof companyId === "number"
        ? { allowed_company_ids: [companyId] }
        : undefined;
    const leadId = await executeKw<number>(
      session,
      "crm.lead",
      "create",
      [values],
      context ? { context } : {},
    );
    if (!leadId) throw new Error("Odoo returned no crm.lead id after create");
    return leadId;
  };

  const run = async (values: Record<string, unknown>) => {
    try {
      return await attempt(await getOdooServiceSession(), values);
    } catch (err) {
      const unauthorized =
        err instanceof OdooRpcError &&
        (err.httpStatus === 401 || /access|denied|auth/i.test(err.message));
      if (!unauthorized) throw err;
      invalidateOdooServiceSession();
      return attempt(await getOdooServiceSession(), values);
    }
  };

  // Link the existing company/contact first. An empty partner_id makes
  // New Quotation ask to create a new customer, which drops Tax ID and CR.
  let leadInput = input;
  if (input.channel !== "talk-to-expert") {
    try {
      const linked = await linkQuotePartner(input);
      if (linked) {
        leadInput = {
          ...input,
          partnerId: linked.partnerId,
          email: input.email.trim() || linked.email,
          phone: input.phone.trim() || linked.phone,
        };
      }
    } catch (err) {
      console.warn(
        "[crm] quote partner link failed:",
        err instanceof Error ? err.message : err,
      );
    }
  }

  const values = buildCrmLeadValues(leadInput);

  // Team company must match the product-type company, or Odoo recomputes
  // company_id onto the partner (ELV quotes were sticking to SGI).
  const quoteCompany = values.company_id;
  if (
    input.channel !== "talk-to-expert" &&
    input.category &&
    typeof quoteCompany === "number"
  ) {
    const preferred = typeof values.team_id === "number" ? values.team_id : undefined;
    values.team_id = await teamOnCompany(input.category, quoteCompany, preferred);
  }

  // Talk to Expert: always bind Pipeline stage + matching sales team.
  if (input.channel === "talk-to-expert") {
    const placement = await resolveTalkToExpertPlacement();
    values.stage_id = placement.stageId;
    if (placement.teamId) values.team_id = placement.teamId;
    console.info(
      `[crm] Talk to Expert placement stage=#${placement.stageId} ` +
        `name="${placement.stageName}" team=${placement.teamId ?? "none"}`,
    );
  }

  const pin = async (leadId: number) => {
    if (
      input.channel === "talk-to-expert" ||
      !input.category ||
      typeof values.company_id !== "number" ||
      typeof values.team_id !== "number"
    ) {
      return;
    }
    await pinLeadCompany(leadId, values.company_id, values.team_id);
  };

  let leadId: number;
  try {
    leadId = await run(values);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    let payload = values;
    if (
      "partner_id" in values &&
      /company inconsistenc|company crossover|belongs to another company|res\.partner/i.test(
        message,
      )
    ) {
      // Contact is locked to a different company. The lead still has the
      // contact fields; Odoo will not accept that partner on this company.
      console.warn(
        "[crm] partner company does not match this product type; lead created without partner_id",
      );
      const { partner_id: _partner, ...rest } = values;
      payload = rest;
    }
    try {
      if (payload === values) {
        // Some DBs reject user_id: false — retry without it.
        if (!("user_id" in values)) throw err;
        const { user_id: _uid, ...rest } = values;
        leadId = await run(rest);
      } else {
        leadId = await run(payload);
      }
    } catch (err2) {
      if (!("user_id" in payload)) throw err2;
      const { user_id: _uid, ...rest } = payload;
      leadId = await run(rest);
    }
  }

  await pin(leadId);
  // Odoo may recompute stage on create — force the intended column.
  if (input.channel === "talk-to-expert" && values.stage_id) {
    try {
      await withAuthRetry(async (session) => {
        const { executeKw } = await import("./rpc");
        const patch: Record<string, unknown> = {
          stage_id: values.stage_id,
        };
        if (values.team_id) patch.team_id = values.team_id;
        const companyId = values.company_id;
        const context =
          typeof companyId === "number"
            ? { allowed_company_ids: [companyId] }
            : undefined;
        await executeKw(
          session,
          "crm.lead",
          "write",
          [[leadId], patch],
          context ? { context } : {},
        );
      });
    } catch (err) {
      console.warn(
        "[crm] Talk to Expert stage re-write failed:",
        err instanceof Error ? err.message : err,
      );
    }
  }
  return leadId;
}

export type CrmLeadAttachment = {
  filename: string;
  content: Buffer;
  contentType?: string;
};

/** Attach uploaded quote documents to an existing crm.lead (ir.attachment). */
export async function attachFilesToCrmLead(
  leadId: number,
  attachments: CrmLeadAttachment[],
  companyId?: number,
): Promise<void> {
  if (!attachments.length) return;

  const {
    getOdooServiceSession,
    invalidateOdooServiceSession,
    isOdooConfigured,
  } = await import("./client");
  const { executeKw, OdooRpcError } = await import("./rpc");

  if (!isOdooConfigured()) {
    throw new Error("Odoo is not configured");
  }

  const context =
    companyId && companyId > 0
      ? { allowed_company_ids: [companyId] }
      : undefined;

  const uploadOne = async (
    session: OdooRpcSession,
    file: CrmLeadAttachment,
  ) => {
    await executeKw(
      session,
      "ir.attachment",
      "create",
      [
        {
          name: file.filename,
          res_model: "crm.lead",
          res_id: leadId,
          type: "binary",
          datas: file.content.toString("base64"),
          mimetype: file.contentType ?? "application/octet-stream",
        },
      ],
      context ? { context } : {},
    );
  };

  for (const file of attachments) {
    try {
      await uploadOne(await getOdooServiceSession(), file);
    } catch (err) {
      const unauthorized =
        err instanceof OdooRpcError &&
        (err.httpStatus === 401 || /access|denied|auth/i.test(err.message));
      if (!unauthorized) throw err;
      invalidateOdooServiceSession();
      await uploadOne(await getOdooServiceSession(), file);
    }
  }
}
