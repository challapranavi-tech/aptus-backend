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

  return {
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
    // Unassigned so the whole Sales team sees it (not only the API user).
    user_id: false,
  };
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

  const attempt = async (session: OdooRpcSession) => {
    const leadId = await create(session, "crm.lead", buildCrmLeadValues(input));
    if (!leadId) throw new Error("Odoo returned no crm.lead id after create");
    return leadId;
  };

  try {
    return await attempt(await getOdooServiceSession());
  } catch (err) {
    // Stale uid after key rotate — drop cache and retry once.
    const unauthorized =
      err instanceof OdooRpcError &&
      (err.httpStatus === 401 || /access|denied|auth/i.test(err.message));
    if (!unauthorized) throw err;
    invalidateOdooServiceSession();
    return attempt(await getOdooServiceSession());
  }
}
