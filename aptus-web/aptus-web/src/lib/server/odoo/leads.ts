import { logger } from "../logger";
import { getOdooClient, type OdooClient } from "./client";
import { persistCrmLeadNotes } from "./crm-lead-notes";
import { formatCustomerMessageForOdoo } from "@/lib/portal-customer-message";
import {
  getPartnerOdooContextForCrm,
  resolveNewPipelineStageId,
  type CrmRoutingKind,
} from "./partner-context";
import { subscriptionRequestLeadName } from "./subscription-requests";

export function subscriptionLeadName(productName: string): string {
  return `Portal subscription: ${productName.trim()}`;
}

export function productOrderLeadName(productNames: string[]): string {
  const preview = productNames.slice(0, 3).join(", ");
  const suffix = productNames.length > 3 ? ` +${productNames.length - 3} more` : "";
  return `Portal software order: ${preview}${suffix}`;
}

async function getRelatedPartnerIds(partnerId: number): Promise<number[]> {
  const client = getOdooClient();
  if (!client) return [partnerId];

  const rows = await client.read<{ commercial_partner_id: [number, string] | false }>(
    "res.partner",
    [partnerId],
    ["commercial_partner_id"],
  );
  const cp = rows[0]?.commercial_partner_id;
  const commercialId = Array.isArray(cp) ? cp[0] : partnerId;

  const related = await client.searchRead<{ id: number }>(
    "res.partner",
    [["commercial_partner_id", "=", commercialId]],
    ["id"],
    100,
  );

  const ids = new Set<number>([partnerId, commercialId, ...related.map((row) => row.id)]);
  return [...ids];
}

async function createPortalCrmLead(
  client: OdooClient,
  input: {
    partnerId: number;
    name: string;
    description: string;
    routing?: CrmRoutingKind;
  },
): Promise<number> {
  const ctx = await getPartnerOdooContextForCrm(input.partnerId, input.routing ?? "default");
  const stageId = ctx.teamId ? await resolveNewPipelineStageId(client, ctx.teamId) : null;

  const values: Record<string, unknown> = {
    partner_id: input.partnerId,
    name: input.name,
    description: input.description,
    // Opportunities appear in CRM → Pipeline (/odoo/crm) for the sales team.
    type: "opportunity",
    probability: 10,
  };
  if (ctx.email) values.email_from = ctx.email;
  if (ctx.name) values.contact_name = ctx.name;
  if (ctx.companyId) values.company_id = ctx.companyId;
  if (ctx.teamId) values.team_id = ctx.teamId;
  if (stageId) values.stage_id = stageId;

  logger.info("Creating Odoo CRM opportunity", {
    action: "crm.lead.create",
    partnerId: input.partnerId,
    name: input.name,
    type: values.type,
    companyId: ctx.companyId ?? null,
    teamId: ctx.teamId ?? null,
    stageId: stageId ?? null,
  });

  const leadId = await client.create("crm.lead", values);

  if (input.description.trim()) {
    await persistCrmLeadNotes(client, leadId, input.description, "crm.lead.create", "replace", {
      skipChatter: true,
    });
  }

  const created = await client.read<{
    id: number;
    type: string;
    active: boolean;
    stage_id: [number, string] | false;
    team_id: [number, string] | false;
    company_id: [number, string] | false;
  }>("crm.lead", [leadId], ["type", "active", "stage_id", "team_id", "company_id"]);

  logger.info("Odoo CRM opportunity created", {
    action: "crm.lead.create",
    leadId,
    partnerId: input.partnerId,
    type: created[0]?.type ?? values.type,
    active: created[0]?.active ?? true,
    stageId: Array.isArray(created[0]?.stage_id) ? created[0].stage_id[0] : stageId,
    stageName: Array.isArray(created[0]?.stage_id) ? created[0].stage_id[1] : null,
    teamId: Array.isArray(created[0]?.team_id) ? created[0].team_id[0] : ctx.teamId,
    companyId: Array.isArray(created[0]?.company_id) ? created[0].company_id[0] : ctx.companyId,
  });

  const actualStageId = Array.isArray(created[0]?.stage_id) ? created[0].stage_id[0] : null;
  const actualStageName = Array.isArray(created[0]?.stage_id)
    ? created[0].stage_id[1].toLowerCase()
    : "";
  if (stageId && actualStageId && actualStageId !== stageId && actualStageName.includes("won")) {
    logger.warn("CRM lead landed in Won instead of New — resetting to New stage", {
      action: "crm.lead.create",
      leadId,
      expectedStageId: stageId,
      actualStageId,
    });
    await client.write("crm.lead", [leadId], { stage_id: stageId, probability: 10, active: true });
  }

  return leadId;
}

export async function createProductOrderLead(input: {
  partnerId: number;
  productNames: string[];
  description: string;
}): Promise<number> {
  const client = getOdooClient();
  if (!client) throw new Error("Odoo is not configured");

  return createPortalCrmLead(client, {
    partnerId: input.partnerId,
    name: productOrderLeadName(input.productNames),
    description: input.description,
    routing: "software",
  });
}

export async function postOrderPaymentMessageToLead(input: {
  leadId: number;
  orderReference: string;
  message: string;
  paymentMethod?: string;
  amountPaid?: number;
}): Promise<void> {
  const trimmed = input.message.trim();
  if (!trimmed) return;

  const client = getOdooClient();
  if (!client) return;

  const plainLines = [
    "Customer payment message",
    `Order: ${input.orderReference}`,
    formatCustomerMessageForOdoo(trimmed),
  ];
  if (input.paymentMethod) {
    plainLines.push(`Payment method: ${input.paymentMethod}`);
  }
  if (input.amountPaid != null) {
    plainLines.push(`Amount paid: OMR ${input.amountPaid.toFixed(3)}`);
  }

  await persistCrmLeadNotes(
    client,
    input.leadId,
    plainLines.join("\n"),
    "crm.lead.payment_message",
    "append",
  );
}

export async function createSubscriptionLead(input: {
  partnerId: number;
  productName: string;
  notes?: string;
}): Promise<number> {
  const client = getOdooClient();
  if (!client) throw new Error("Odoo is not configured");

  return createPortalCrmLead(client, {
    partnerId: input.partnerId,
    name: subscriptionLeadName(input.productName),
    description: input.notes ?? "",
    routing: "elv",
  });
}

export async function findSubscriptionLeads(
  partnerId: number,
  productName: string,
): Promise<number[]> {
  const client = getOdooClient();
  if (!client) return [];

  const partnerIds = await getRelatedPartnerIds(partnerId);
  const leadName = subscriptionLeadName(productName);

  const rows = await client.searchRead<{ id: number }>(
    "crm.lead",
    [
      ["name", "ilike", leadName],
      ["partner_id", "in", partnerIds],
      ["active", "=", true],
    ],
    ["id"],
    20,
  );

  return rows.map((row) => row.id);
}

/** CRM opportunities tied to a portal subscription (initial + cancellation request leads). */
export async function findSubscriptionOpportunityLeads(
  partnerId: number,
  productName: string,
): Promise<number[]> {
  const client = getOdooClient();
  if (!client) return [];

  const partnerIds = await getRelatedPartnerIds(partnerId);
  const leadNames = [
    subscriptionLeadName(productName),
    subscriptionRequestLeadName("cancel", productName),
  ];

  const rows = await client.searchRead<{ id: number }>(
    "crm.lead",
    [
      ["name", "in", leadNames],
      ["partner_id", "in", partnerIds],
      ["active", "=", true],
    ],
    ["id"],
    20,
  );

  return rows.map((row) => row.id);
}

async function findLostStageId(client: OdooClient, teamId?: number): Promise<number | null> {
  const domain: unknown[] = [
    ["name", "ilike", "lost"],
    ["is_won", "=", false],
  ];
  if (teamId) {
    domain.unshift("|", ["team_ids", "=", false], ["team_ids", "in", [teamId]]);
  }

  const stages = await client.searchRead<{ id: number; name: string; sequence: number }>(
    "crm.stage",
    domain,
    ["id", "name", "sequence"],
    10,
  );
  if (!stages.length) return null;

  const exact = stages.find((stage) => stage.name.toLowerCase() === "lost");
  const picked = exact ?? stages.sort((a, b) => b.sequence - a.sequence)[0];
  return picked?.id ?? null;
}

async function markLeadLost(client: OdooClient, leadId: number): Promise<void> {
  const rows = await client.read<{
    team_id: [number, string] | false;
    active: boolean;
  }>("crm.lead", [leadId], ["team_id", "active"]);
  const lead = rows[0];
  if (!lead) throw new Error(`CRM lead ${leadId} not found`);

  const teamId = Array.isArray(lead.team_id) ? lead.team_id[0] : undefined;
  const lostStageId = await findLostStageId(client, teamId);

  // Prefer moving to the LOST pipeline stage so the card appears in CRM kanban.
  // Odoo's action_set_lost archives the record (active=false), which hides it from
  // stage columns like the LOST column in your pipeline.
  if (lostStageId) {
    await client.write("crm.lead", [leadId], {
      stage_id: lostStageId,
      probability: 0,
      active: true,
    });
    return;
  }

  try {
    await client.call("crm.lead", "action_set_lost", { ids: [leadId] });
    return;
  } catch {
    /* fall back to direct archive below */
  }

  await client.write("crm.lead", [leadId], { probability: 0, active: false });
}

export async function cancelSubscriptionLeads(leadIds: number[]): Promise<number> {
  if (!leadIds.length) return 0;

  const client = getOdooClient();
  if (!client) throw new Error("Odoo is not configured");

  let cancelled = 0;
  for (const leadId of leadIds) {
    await markLeadLost(client, leadId);
    cancelled += 1;
  }

  return cancelled;
}

const PRODUCT_LEAD_LABELS: Record<string, string> = {
  contact: "Contact inquiry",
  demo: "Demo request",
  quote: "Quote request",
  download: "Brochure download",
};

/** Public marketing lead from Autodesk product pages (no portal auth). */
export async function createAutodeskProductLead(input: {
  leadType: string;
  productName: string;
  productSlug: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message?: string;
}): Promise<number> {
  const client = getOdooClient();
  if (!client) throw new Error("Odoo is not configured");

  const { resolveCrmRouting, resolveNewPipelineStageId } = await import("./partner-context");
  const routing = resolveCrmRouting("software");
  const stageId = routing.teamId
    ? await resolveNewPipelineStageId(client, routing.teamId)
    : null;

  const leadKind = PRODUCT_LEAD_LABELS[input.leadType] ?? "Product inquiry";
  const description = [
    `Source: Autodesk product page`,
    `Product: ${input.productName} (/${input.productSlug})`,
    `Request type: ${leadKind}`,
    input.company ? `Company: ${input.company}` : null,
    input.phone ? `Phone: ${input.phone}` : null,
    input.message?.trim() ? `Message:\n${input.message.trim()}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const values: Record<string, unknown> = {
    name: `Autodesk ${leadKind}: ${input.productName}`,
    contact_name: input.name.trim(),
    email_from: input.email.trim(),
    description,
    type: "opportunity",
    probability: 10,
  };

  if (input.phone?.trim()) values.phone = input.phone.trim();
  if (routing.companyId) values.company_id = routing.companyId;
  if (routing.teamId) values.team_id = routing.teamId;
  if (stageId) values.stage_id = stageId;

  logger.info("Creating Autodesk product CRM lead", {
    action: "crm.lead.autodesk_product",
    productSlug: input.productSlug,
    leadType: input.leadType,
  });

  const leadId = await client.create("crm.lead", values);

  if (description.trim()) {
    await persistCrmLeadNotes(client, leadId, description, "crm.lead.autodesk_product", "replace", {
      skipChatter: true,
    });
  }

  return leadId;
}
