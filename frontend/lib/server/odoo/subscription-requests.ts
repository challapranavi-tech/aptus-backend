import { logger } from "../logger";
import { getOdooClient } from "./client";
import { persistCrmLeadNotes } from "./crm-lead-notes";
import {
  getPartnerOdooContextForCrm,
  resolveFirstPipelineStageId,
  type CrmRoutingKind,
} from "./partner-context";

export type SubscriptionRequestType = "renew" | "upgrade" | "downgrade" | "cancel";

export function subscriptionRequestLeadName(
  requestType: SubscriptionRequestType,
  productName: string,
): string {
  const labels: Record<SubscriptionRequestType, string> = {
    renew: "Renewal request",
    upgrade: "Upgrade request",
    downgrade: "Downgrade request",
    cancel: "Cancellation request",
  };
  return `Portal ${labels[requestType]}: ${productName.trim()}`;
}

async function createPortalCrmLead(
  input: {
    partnerId: number;
    name: string;
    description: string;
    routing?: CrmRoutingKind;
  },
): Promise<number> {
  const client = getOdooClient();
  if (!client) throw new Error("Odoo is not configured");

  const ctx = await getPartnerOdooContextForCrm(input.partnerId, input.routing ?? "software");
  const stageId = ctx.teamId ? await resolveFirstPipelineStageId(client, ctx.teamId) : null;

  const values: Record<string, unknown> = {
    partner_id: input.partnerId,
    name: input.name,
    description: input.description,
    type: "opportunity",
    probability: 10,
  };
  if (ctx.email) values.email_from = ctx.email;
  if (ctx.name) values.contact_name = ctx.name;
  if (ctx.companyId) values.company_id = ctx.companyId;
  if (ctx.teamId) values.team_id = ctx.teamId;
  if (stageId) values.stage_id = stageId;

  logger.info("Creating subscription request CRM opportunity", {
    action: "subscription.request",
    partnerId: input.partnerId,
    name: input.name,
  });

  const leadId = await client.create("crm.lead", values);

  if (input.description.trim()) {
    await persistCrmLeadNotes(client, leadId, input.description, "subscription.request.create");
  }

  return leadId;
}

export async function createSubscriptionRequestLead(input: {
  partnerId: number;
  productName: string;
  requestType: SubscriptionRequestType;
  notes?: string;
  orderId?: number;
}): Promise<number> {
  const description = [
    `Subscription ${input.requestType} request from the Aptus Customer Portal`,
    "",
    `Product: ${input.productName}`,
    input.orderId ? `Sale order ID: ${input.orderId}` : "",
    input.notes ? `Notes: ${input.notes}` : "",
    "",
    "Action required: Review and process this subscription request within 48 hours.",
  ]
    .filter(Boolean)
    .join("\n");

  return createPortalCrmLead({
    partnerId: input.partnerId,
    name: subscriptionRequestLeadName(input.requestType, input.productName),
    description,
    routing: "software",
  });
}
