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
import { normalizeOdooBaseUrl, type OdooRpcSession } from "./rpc";

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
 * Multi-company routing: Software pages → SOFTWARE company, ELV/Infrastructure
 * pages → INFRA company. Page/category decides this server-side — never a
 * frontend field — so a lead can't be filed under the wrong company by mistake.
 *
 * Exhaustive + fail-loud on purpose: an unrecognized category (typo, a new
 * ContactCategory added without updating this map, env var not set) must
 * throw, not silently fall through to SOFTWARE. createCrmLead()'s caller
 * (app/api/contact/route.ts) already catches + alerts via
 * reportCrmLeadFailure on any throw here, so this can't misfile a lead
 * without anyone noticing — it just skips company_id and pages ops instead.
 */
function companyIdForCategory(category?: ContactCategory): number | undefined {
  if (category === undefined) return undefined;

  const envVar: Record<ContactCategory, string> = {
    software: "ODOO_SOFTWARE_COMPANY_ID",
    elv: "ODOO_ELV_COMPANY_ID",
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

/**
 * Resolve the Odoo sales-team ID and stage ID for a given category.
 * Separate from companyIdForCategory: company_id must be exact (fail loud),
 * but team/stage are just pipeline placement — safe to leave unset and let
 * Odoo assign its default team.
 *
 * Priority:
 *   1. Category-specific env  (ODOO_CRM_SOFTWARE_TEAM_ID / ODOO_CRM_ELV_TEAM_ID)
 *   2. Legacy catch-all env   (ODOO_CRM_TEAM_ID) — pre-category-routing deployments
 *   3. Unset → Odoo assigns the default team
 */
export function crmTeamConfig(category?: ContactCategory): {
  teamId: number | undefined;
  stageId: number | undefined;
} {
  function positiveInt(raw: string | undefined): number | undefined {
    const n = Number(raw?.trim() ?? "");
    return Number.isInteger(n) && n > 0 ? n : undefined;
  }

  if (category === "elv") {
    return {
      teamId:
        positiveInt(process.env.ODOO_CRM_ELV_TEAM_ID) ??
        positiveInt(process.env.ODOO_CRM_TEAM_ID),
      stageId:
        positiveInt(process.env.ODOO_CRM_ELV_STAGE_ID) ??
        positiveInt(process.env.ODOO_CRM_STAGE_ID),
    };
  }

  // "software" or undefined — default path
  return {
    teamId:
      positiveInt(process.env.ODOO_CRM_SOFTWARE_TEAM_ID) ??
      positiveInt(process.env.ODOO_CRM_TEAM_ID),
    stageId:
      positiveInt(process.env.ODOO_CRM_SOFTWARE_STAGE_ID) ??
      positiveInt(process.env.ODOO_CRM_STAGE_ID),
  };
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
    description,
    // Talk to Expert → CRM Leads (stage "Website cold calling leads").
    // Quotes stay as Pipeline opportunities.
    type: isTalkToExpert ? "lead" : "opportunity",
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

  // Software pages → SOFTWARE company; ELV/Infrastructure pages → INFRA company.
  // Talk to Expert → Software company + dedicated "Website cold calling leads" stage.
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

/** Find crm.stage id by name (e.g. "Website cold calling leads"). */
export async function findCrmStageIdByName(
  name: string,
): Promise<number | undefined> {
  const trimmed = name.trim();
  if (!trimmed) return undefined;

  return withAuthRetry(async (session) => {
    const { searchRead } = await import("./rpc");
    const rows = await searchRead<{ id: number }>(
      session,
      "crm.stage",
      [["name", "=ilike", trimmed]],
      { fields: ["id"], limit: 1 },
    );
    return rows[0]?.id;
  });
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
  const { create, OdooRpcError } = await import("./rpc");

  if (!isOdooConfigured()) {
    throw new Error("Odoo is not configured");
  }

  const attempt = async (
    session: OdooRpcSession,
    values: Record<string, unknown>,
  ) => {
    const leadId = await create(session, "crm.lead", values);
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

  const values = buildCrmLeadValues(input);

  // Talk to Expert: if no stage id in env, resolve "Website cold calling leads" by name.
  if (input.channel === "talk-to-expert" && !values.stage_id) {
    try {
      const stageId = await findCrmStageIdByName(talkToExpertStageName());
      if (stageId) values.stage_id = stageId;
      else {
        console.warn(
          `[crm] Talk to Expert stage not found (name="${talkToExpertStageName()}"). ` +
            `Set ODOO_CRM_TALK_TO_EXPERT_STAGE_ID or rename the Odoo stage.`,
        );
      }
    } catch (err) {
      console.warn(
        "[crm] Talk to Expert stage lookup failed:",
        err instanceof Error ? err.message : err,
      );
    }
  }

  try {
    return await run(values);
  } catch (err) {
    // Some DBs reject user_id: false — retry without it.
    if (!("user_id" in values)) throw err;
    const { user_id: _uid, ...rest } = values;
    return run(rest);
  }
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
): Promise<void> {
  if (!attachments.length) return;

  const {
    getOdooServiceSession,
    invalidateOdooServiceSession,
    isOdooConfigured,
  } = await import("./client");
  const { create, OdooRpcError } = await import("./rpc");

  if (!isOdooConfigured()) {
    throw new Error("Odoo is not configured");
  }

  const uploadOne = async (
    session: OdooRpcSession,
    file: CrmLeadAttachment,
  ) => {
    await create(session, "ir.attachment", {
      name: file.filename,
      res_model: "crm.lead",
      res_id: leadId,
      type: "binary",
      datas: file.content.toString("base64"),
      mimetype: file.contentType ?? "application/octet-stream",
    });
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
