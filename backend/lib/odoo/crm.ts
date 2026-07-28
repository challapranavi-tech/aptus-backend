/**
 * lib/odoo/crm.ts
 *
 * Creates crm.lead records from website quote / contact submissions.
 * Reuses the shared API-key JSON-RPC client (rpc.ts).
 *
 * Callers treat this as best-effort: on failure the contact route logs and
 * still returns success if the sales email was sent.
 */
import type { OdooRpcSession } from "./rpc";

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
};

/** Pure crm.lead field map — unit-tested in crm.check.ts. */
export function buildCrmLeadValues(
  input: CrmLeadInput,
): Record<string, unknown> {
  const contactName = [input.firstName, input.lastName]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" ");
  const product = (input.product ?? "").trim();
  const isQuoteProduct =
    Boolean(product) && product !== "Others" && product !== "Select Product";

  const description = [
    `Client Message: ${input.message?.trim() || "—"}`,
    `Product: ${product || "—"}`,
    `QTY: ${input.qty?.trim() || "—"}`,
    `Category: ${input.categoryLabel?.trim() || "—"}`,
    `Source: Website – Request Quote`,
  ].join(", ");

  const values: Record<string, unknown> = {
    name: isQuoteProduct
      ? `Request a Quote – ${product}`
      : `Website contact – ${contactName || input.company}`,
    contact_name: contactName,
    partner_name: input.company.trim(),
    email_from: input.email.trim(),
    phone: input.phone.trim(),
    description,
    // Opportunity shows in CRM Pipeline → New. type "lead" only appears under Leads.
    type: "opportunity",
  };

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
