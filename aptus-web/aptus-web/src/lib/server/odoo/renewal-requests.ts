import { getOdooClient } from "./client";
import { logger } from "../logger";
import type { RenewalRequestStatus } from "@/types/renewals";
import {
  listRenewalRequestsForPartner,
  mergeRenewalStatus,
} from "../portal-renewal-requests";
import type { PortalRenewalRequest } from "@/types/renewals";

type OdooCrmLeadRow = {
  id: number;
  name: string;
  stage_id: [number, string] | false;
  active: boolean;
  create_date: string;
};

function mapLeadToRenewalStatus(lead: OdooCrmLeadRow): RenewalRequestStatus {
  const stageName = Array.isArray(lead.stage_id) ? lead.stage_id[1].toLowerCase() : "";
  if (!lead.active || stageName.includes("lost")) return "Rejected";
  if (stageName.includes("won")) return "Approved";
  return "Submitted";
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

  return [...new Set([partnerId, commercialId, ...related.map((row) => row.id)])];
}

/** Merge local renewal requests with Odoo CRM renewal opportunities. */
export async function fetchPartnerRenewalRequests(
  partnerId: number,
): Promise<PortalRenewalRequest[]> {
  const localRequests = listRenewalRequestsForPartner(partnerId);
  const client = getOdooClient();
  if (!client) return localRequests;

  const partnerIds = await getRelatedPartnerIds(partnerId);
  const merged = new Map<string, PortalRenewalRequest>();

  for (const request of localRequests) {
    merged.set(request.reference, request);
  }

  try {
    const leads = await client.searchRead<OdooCrmLeadRow>(
      "crm.lead",
      [
        ["partner_id", "in", partnerIds],
        ["name", "ilike", "Portal Renewal request"],
        ["active", "in", [true, false]],
      ],
      ["name", "stage_id", "active", "create_date"],
      50,
    );

    for (const lead of leads) {
      const reference = `REQ-RENEW-${lead.id}`;
      const existing = [...merged.values()].find((request) => request.leadId === lead.id);
      const odooStatus = mapLeadToRenewalStatus(lead);
      const productName = lead.name.replace(/^Portal Renewal request:\s*/i, "").trim() || "Subscription";

      if (existing) {
        merged.set(existing.reference, {
          ...existing,
          status: mergeRenewalStatus(existing, odooStatus),
          leadId: lead.id,
        });
        continue;
      }

      merged.set(reference, {
        id: `odoo-renew-${lead.id}`,
        reference,
        actorId: "",
        partnerId,
        productName,
        leadId: lead.id,
        status: odooStatus,
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

  return [...merged.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}
