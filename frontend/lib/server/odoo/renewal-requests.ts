import { getOdooClient } from "./client";
import { logger } from "../logger";
import type { PortalRenewalRequest, RenewalRequestStatus } from "@/types/renewals";
import { getRelatedPartnerIds } from "./partner-context";

type OdooCrmLeadRow = {
  id: number;
  name: string;
  stage_id: [number, string] | false;
  active: boolean;
  create_date: string;
  team_id: [number, string] | false;
  partner_id: [number, string] | false;
};

function mapLeadToRenewalStatus(lead: OdooCrmLeadRow): RenewalRequestStatus {
  const stageName = Array.isArray(lead.stage_id) ? lead.stage_id[1].toLowerCase() : "";
  if (!lead.active || stageName.includes("lost")) return "Rejected";
  if (stageName.includes("won") || stageName.includes("approved")) return "Approved";
  return "Submitted";
}

/** Portal renewal requests from Odoo CRM leads only. */
export async function fetchPartnerRenewalRequests(
  partnerId: number,
): Promise<PortalRenewalRequest[]> {
  const client = getOdooClient();
  if (!client) return [];

  const partnerIds = await getRelatedPartnerIds(partnerId);
  const requests: PortalRenewalRequest[] = [];

  try {
    const leads = await client.searchRead<OdooCrmLeadRow>(
      "crm.lead",
      [
        ["partner_id", "in", partnerIds],
        ["name", "ilike", "Portal Renewal request"],
        ["active", "in", [true, false]],
      ],
      ["name", "stage_id", "active", "create_date", "team_id", "partner_id"],
      50,
    );

    for (const lead of leads) {
      const productName =
        lead.name.replace(/^Portal Renewal request:\s*/i, "").trim() || "Subscription";
      requests.push({
        id: `odoo-renew-${lead.id}`,
        reference: `REQ-RENEW-${lead.id}`,
        actorId: "",
        partnerId,
        productName,
        leadId: lead.id,
        status: mapLeadToRenewalStatus(lead),
        createdAt: lead.create_date,
        updatedAt: lead.create_date,
      });
    }
  } catch (error) {
    logger.warn("Failed to fetch CRM renewal leads", {
      action: "renewals.fetch",
      partnerId,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return requests.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function resolvePartnerRenewalRequest(
  requestId: string,
): Promise<PortalRenewalRequest | null> {
  const client = getOdooClient();
  if (!client) return null;

  let leadId: number | null = null;
  if (requestId.startsWith("odoo-renew-")) {
    leadId = Number(requestId.replace("odoo-renew-", ""));
  } else if (requestId.startsWith("REQ-RENEW-")) {
    leadId = Number(requestId.replace("REQ-RENEW-", ""));
  }
  if (leadId == null || Number.isNaN(leadId)) return null;

  const rows = await client.read<OdooCrmLeadRow>("crm.lead", [leadId], [
    "name",
    "stage_id",
    "active",
    "create_date",
    "team_id",
    "partner_id",
  ]);
  const lead = rows[0];
  if (!lead) return null;

  const partnerId = Array.isArray(lead.partner_id) ? lead.partner_id[0] : 0;
  const productName =
    lead.name.replace(/^Portal Renewal request:\s*/i, "").trim() || "Subscription";

  return {
    id: `odoo-renew-${lead.id}`,
    reference: `REQ-RENEW-${lead.id}`,
    actorId: "",
    partnerId,
    productName,
    leadId: lead.id,
    status: mapLeadToRenewalStatus(lead),
    createdAt: lead.create_date,
    updatedAt: lead.create_date,
  };
}

async function findStageIdByHint(
  teamId: number | undefined,
  hints: string[],
): Promise<number | null> {
  const client = getOdooClient();
  if (!client) return null;

  const domain: unknown[] = [];
  if (teamId) {
    domain.push("|", ["team_ids", "=", false], ["team_ids", "in", [teamId]]);
  }

  const stages = await client.searchRead<{ id: number; name: string }>(
    "crm.stage",
    domain.length ? domain : [],
    ["id", "name"],
    40,
  );

  for (const hint of hints) {
    const match = stages.find((stage) => stage.name.toLowerCase().includes(hint));
    if (match) return match.id;
  }
  return null;
}

export async function updatePartnerRenewalStatusInOdoo(
  request: PortalRenewalRequest,
  status: RenewalRequestStatus,
): Promise<PortalRenewalRequest | null> {
  const client = getOdooClient();
  if (!client) throw new Error("Odoo is not configured");
  if (!request.leadId) return null;

  const rows = await client.read<{ team_id: [number, string] | false }>(
    "crm.lead",
    [request.leadId],
    ["team_id"],
  );
  const teamId = Array.isArray(rows[0]?.team_id) ? rows[0].team_id[0] : undefined;

  if (status === "Approved") {
    const wonId = await findStageIdByHint(teamId, ["won", "approved"]);
    if (wonId) {
      await client.write("crm.lead", [request.leadId], {
        stage_id: wonId,
        probability: 100,
        active: true,
      });
    }
  } else if (status === "Rejected") {
    const lostId = await findStageIdByHint(teamId, ["lost"]);
    if (lostId) {
      await client.write("crm.lead", [request.leadId], {
        stage_id: lostId,
        probability: 0,
        active: true,
      });
    } else {
      await client.write("crm.lead", [request.leadId], { probability: 0, active: false });
    }
  }

  return resolvePartnerRenewalRequest(`odoo-renew-${request.leadId}`);
}

/** Admin listing: all portal renewal CRM leads. */
export async function listAllPortalRenewalRequests(limit = 200): Promise<PortalRenewalRequest[]> {
  const client = getOdooClient();
  if (!client) return [];

  try {
    const leads = await client.searchRead<OdooCrmLeadRow>(
      "crm.lead",
      [
        ["name", "ilike", "Portal Renewal request"],
        ["active", "in", [true, false]],
      ],
      ["name", "stage_id", "active", "create_date", "team_id", "partner_id"],
      limit,
    );

    return leads.map((lead) => {
      const partnerId = Array.isArray(lead.partner_id) ? lead.partner_id[0] : 0;
      return {
        id: `odoo-renew-${lead.id}`,
        reference: `REQ-RENEW-${lead.id}`,
        actorId: "",
        partnerId,
        productName:
          lead.name.replace(/^Portal Renewal request:\s*/i, "").trim() || "Subscription",
        leadId: lead.id,
        status: mapLeadToRenewalStatus(lead),
        createdAt: lead.create_date,
        updatedAt: lead.create_date,
      };
    });
  } catch (error) {
    logger.warn("Failed to list CRM renewal leads", {
      action: "renewals.list_all",
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}
