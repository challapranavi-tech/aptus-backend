/**
 * lib/odoo/crm.ts
 *
 * Request Quote → crm.lead. Payload building is pure (crm.check.ts);
 * create / sequence / attachments talk to Odoo.
 */
import type { ContactCategory } from "@shared/lib/contact-request";
import { getOdooServiceSession, invalidateOdooServiceSession, odooConfigFromEnv } from "./client";
import {
  create,
  executeKw,
  OdooRpcError,
  searchRead,
  type OdooRpcSession,
} from "./rpc";

export type { ContactCategory };

/** Odoo ir.sequence code for Request Quote (already provisioned). */
export const REQUEST_QUOTE_SEQUENCE = "request.quote";

export type CrmLeadInput = {
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  phone: string;
  product: string;
  qty?: string;
  category?: ContactCategory;
  categoryLabel?: string;
  message?: string;
  quoteRef?: string;
  customerType?: "individual" | "company";
  profession?: string;
  vatId?: string;
  crNumber?: string;
  countryCode?: string;
  phoneLocal?: string;
  contactName?: string;
  attachmentName?: string;
};

export type CrmLeadAttachment = {
  filename: string;
  content: Buffer;
  contentType?: string;
};

function envPositiveInt(name: string): number | undefined {
  const n = Number(process.env[name]?.trim());
  return Number.isInteger(n) && n > 0 ? n : undefined;
}

function fullName(input: CrmLeadInput): string {
  return [input.firstName, input.lastName].filter(Boolean).join(" ").trim();
}

/** Studio field on crm.lead for the quote reference. Empty if unset. */
export function quoteReferenceField(): string {
  return process.env.ODOO_QUOTE_REF_FIELD?.trim() ?? "";
}

/**
 * Sales team / stage for a quote category.
 * Unset env → Odoo defaults (does not throw).
 */
export function crmTeamConfig(category?: ContactCategory): {
  teamId?: number;
  stageId?: number;
} {
  const cat = category ?? "software";
  const prefix = cat === "elv" ? "ELV" : "SOFTWARE";
  return {
    teamId:
      envPositiveInt(`ODOO_CRM_${prefix}_TEAM_ID`) ??
      envPositiveInt("ODOO_CRM_TEAM_ID"),
    stageId:
      envPositiveInt(`ODOO_CRM_${prefix}_STAGE_ID`) ??
      envPositiveInt("ODOO_CRM_STAGE_ID"),
  };
}

function companyIdForCategory(category?: ContactCategory): number | undefined {
  if (!category) return undefined;
  if (category !== "software" && category !== "elv") {
    throw new Error(`unrecognized category: ${String(category)}`);
  }
  const key =
    category === "software" ? "ODOO_SOFTWARE_COMPANY_ID" : "ODOO_ELV_COMPANY_ID";
  const id = envPositiveInt(key);
  if (!id) {
    // Unset routing → Odoo default company. Do not invent a company_id.
    console.warn(`[crm] ${key} unset — creating lead without company_id`);
    return undefined;
  }
  return id;
}

/** Pure crm.lead field map. */
export function buildCrmLeadValues(input: CrmLeadInput): Record<string, unknown> {
  const isIndividual = input.customerType === "individual";
  const person = (input.contactName?.trim() || fullName(input)).trim();
  const partnerName = isIndividual ? "" : (input.company ?? "").trim();
  const isQuote = Boolean(input.quoteRef?.trim()) && input.product !== "Others";

  const descParts: string[] = [];
  if (input.quoteRef?.trim()) descParts.push(`Quote Ref: ${input.quoteRef.trim()}`);
  if (input.message?.trim()) descParts.push(`Client Message: ${input.message.trim()}`);
  if (input.product) descParts.push(`Product: ${input.product}`);
  if (input.qty) descParts.push(`QTY: ${input.qty}`);
  if (input.categoryLabel) descParts.push(`Category: ${input.categoryLabel}`);
  if (input.customerType === "individual") {
    descParts.push("Customer Type: Individual");
    if (input.profession?.trim()) descParts.push(`Profession: ${input.profession.trim()}`);
  } else if (input.customerType === "company") {
    descParts.push("Customer Type: Company");
    if (input.vatId?.trim()) descParts.push(`Tax ID: ${input.vatId.trim()}`);
    if (input.crNumber?.trim()) descParts.push(`CR Number: ${input.crNumber.trim()}`);
  }
  descParts.push("Source: Website – Request Quote");

  const values: Record<string, unknown> = {
    name: isQuote
      ? `Request a Quote – ${input.product} (${input.quoteRef!.trim()})`
      : `Website contact – ${person}`,
    contact_name: person,
    partner_name: partnerName,
    email_from: input.email,
    phone: input.phone,
    type: "opportunity",
    user_id: false,
    description: descParts.join(", "),
  };

  const companyId = companyIdForCategory(input.category);
  if (companyId) values.company_id = companyId;

  const team = crmTeamConfig(input.category);
  if (team.teamId) values.team_id = team.teamId;
  if (team.stageId) values.stage_id = team.stageId;

  const refField = quoteReferenceField();
  if (refField && input.quoteRef?.trim()) {
    values[refField] = input.quoteRef.trim();
  }

  const typeField = process.env.ODOO_CRM_CUSTOMER_TYPE_FIELD?.trim();
  if (typeField && input.customerType) {
    values[typeField] = input.customerType;
  }

  return values;
}

async function withAuthRetry<T>(fn: (session: OdooRpcSession) => Promise<T>): Promise<T> {
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

export function crmLeadFormUrl(leadId: number): string {
  const base = odooConfigFromEnv().url.replace(/\/$/, "");
  return `${base}/web#id=${leadId}&model=crm.lead&view_type=form`;
}

/** Create the ir.sequence if missing. Idempotent. */
export async function ensureRequestQuoteSequence(): Promise<void> {
  await withAuthRetry(async (session) => {
    const existing = await searchRead<{ id: number }>(
      session,
      "ir.sequence",
      [["code", "=", REQUEST_QUOTE_SEQUENCE]],
      { fields: ["id"], limit: 1 },
    );
    if (existing[0]?.id) return;
    await create(session, "ir.sequence", {
      name: "Request Quote",
      code: REQUEST_QUOTE_SEQUENCE,
      prefix: "RQ-%(year)s-",
      padding: 6,
      implementation: "standard",
    });
  });
}

/** Next value from ir.sequence `request.quote`. Throws if Odoo returns empty. */
export async function nextRequestQuoteRef(): Promise<string> {
  await ensureRequestQuoteSequence();
  return withAuthRetry(async (session) => {
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

export async function createCrmLead(input: CrmLeadInput): Promise<number> {
  return withAuthRetry(async (session) => {
    const id = await create(session, "crm.lead", buildCrmLeadValues(input));
    if (!id) throw new Error("Odoo returned no crm.lead id after create");
    return id;
  });
}

export async function attachFilesToCrmLead(
  leadId: number,
  files: CrmLeadAttachment[],
): Promise<void> {
  if (!files.length) return;
  await withAuthRetry(async (session) => {
    for (const file of files) {
      await create(session, "ir.attachment", {
        name: file.filename,
        res_model: "crm.lead",
        res_id: leadId,
        type: "binary",
        datas: file.content.toString("base64"),
        mimetype: file.contentType ?? "application/octet-stream",
      });
    }
  });
}
