/**
 * lib/odoo/crm.ts
 *
 * Creates crm.lead records from website Request Quote submissions.
 * Reuses the shared API-key JSON-RPC client (rpc.ts).
 *
 * Quote refs come from Odoo ir.sequence `request.quote` (e.g. RQ-2026-000001).
 * Callers treat CRM create as best-effort after the sales email is sent.
 */
import type { OdooRpcSession } from "./rpc";

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
  categoryLabel?: string;
  message?: string;
  /** Odoo sequence value (RQ-…) or JS fallback. */
  quoteRef?: string;
};

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
  const contactName = [input.firstName, input.lastName]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" ");
  const product = (input.product ?? "").trim();
  const quoteRef = (input.quoteRef ?? "").trim();
  const isQuoteProduct =
    Boolean(product) && product !== "Others" && product !== "Select Product";

  const description = [
    quoteRef ? `Quote Ref: ${quoteRef}` : null,
    `Client Message: ${input.message?.trim() || "—"}`,
    `Product: ${product || "—"}`,
    `QTY: ${input.qty?.trim() || "—"}`,
    `Category: ${input.categoryLabel?.trim() || "—"}`,
    `Source: Website – Request Quote`,
  ]
    .filter(Boolean)
    .join(", ");

  const values: Record<string, unknown> = {
    name: isQuoteProduct
      ? quoteRef
        ? `Request a Quote – ${product} (${quoteRef})`
        : `Request a Quote – ${product}`
      : `Website contact – ${contactName || input.company}`,
    contact_name: contactName,
    partner_name: input.company.trim(),
    email_from: input.email.trim(),
    phone: input.phone.trim(),
    description,
    // Opportunity shows in CRM Pipeline → New. type "lead" only appears under Leads.
    type: "opportunity",
  };

  const refField = quoteReferenceField();
  if (refField && quoteRef) {
    values[refField] = quoteRef;
  }

  // Optional pin (production teams/stages differ). Unset = Odoo defaults + unassigned.
  const teamId = Number(process.env.ODOO_CRM_TEAM_ID ?? "");
  const stageId = Number(process.env.ODOO_CRM_STAGE_ID ?? "");
  if (Number.isInteger(teamId) && teamId > 0) values.team_id = teamId;
  if (Number.isInteger(stageId) && stageId > 0) values.stage_id = stageId;

  // Omit user_id so Sales Team / New is visible; false breaks some Odoo DBs.
  const unassign = process.env.ODOO_CRM_UNASSIGN !== "0";
  if (unassign) values.user_id = false;

  return values;
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
  try {
    return await run(values);
  } catch (err) {
    // Some DBs reject user_id: false — retry without it.
    if (!("user_id" in values)) throw err;
    const { user_id: _uid, ...rest } = values;
    return run(rest);
  }
}
