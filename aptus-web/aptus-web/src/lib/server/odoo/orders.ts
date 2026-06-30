import { getOdooClient } from "./client";
import { logger } from "../logger";
import type { OrderLineItem, PortalOrder, PortalOrderStatus } from "@/types/orders";
import {
  getPortalOrderById,
  listPortalOrdersForPartner,
  mergeOrderPaymentFields,
  mergeOrderStatus,
} from "../portal-orders";

type OdooSaleOrderRow = {
  id: number;
  name: string;
  state: string;
  date_order: string | false;
  end_date: string | false;
  subscription_state: string | false;
  order_line: number[];
};

type OdooCrmLeadRow = {
  id: number;
  name: string;
  stage_id: [number, string] | false;
  probability: number;
  active: boolean;
  create_date: string;
};

type OdooSaleOrderLineRow = {
  id: number;
  name: string | false;
  product_uom_qty: number;
};

function getActiveSubscriptionStates(): string[] {
  const raw = process.env.ODOO_SUBSCRIPTION_ACTIVE_STATES?.trim();
  if (raw) {
    return raw.split(",").map((value) => value.trim()).filter(Boolean);
  }
  return ["progress", "3_progress"];
}

function isInactiveSubscriptionState(state: string | false | null | undefined): boolean {
  if (!state || typeof state !== "string") return true;
  const inactive = ["6_churn", "4_paused", "1_draft", "churn", "paused", "draft"];
  return inactive.some((token) => state === token || state.endsWith(`_${token}`) || state.includes("churn"));
}

function isActiveSubscriptionState(state: string | false | null | undefined): boolean {
  if (isInactiveSubscriptionState(state)) return false;
  if (!state || typeof state !== "string") return false;
  if (getActiveSubscriptionStates().includes(state)) return true;
  return state.endsWith("_progress") || state === "progress";
}

function odooDateToIso(value: string | false | null | undefined): string {
  if (!value || typeof value !== "string") return "";
  return value.split(" ")[0] ?? "";
}

function isPastEndDate(endDateIso: string): boolean {
  if (!endDateIso) return false;
  const end = new Date(`${endDateIso}T23:59:59`);
  if (Number.isNaN(end.getTime())) return false;
  return end.getTime() < Date.now();
}

/** Won + active subscription → Approved; expired/churn → Completed. */
function mapSaleOrderToStatus(order: OdooSaleOrderRow): PortalOrderStatus {
  if (order.state === "cancel") return "Rejected";

  const endIso = odooDateToIso(order.end_date);
  const subscriptionState = order.subscription_state;

  if (isActiveSubscriptionState(subscriptionState)) return "Approved";
  if (
    isInactiveSubscriptionState(subscriptionState) &&
    (String(subscriptionState).includes("churn") || isPastEndDate(endIso))
  ) {
    return "Completed";
  }
  if (isPastEndDate(endIso) && (order.state === "sale" || order.state === "done")) {
    return "Completed";
  }

  if (order.state === "draft" || order.state === "sent") return "Submitted";
  if (order.state === "sale" || order.state === "done") return "Approved";

  return "Submitted";
}

function mapLeadToStatus(lead: OdooCrmLeadRow): PortalOrderStatus {
  const stageName = Array.isArray(lead.stage_id) ? lead.stage_id[1].toLowerCase() : "";
  if (!lead.active || stageName.includes("lost")) return "Rejected";
  if (stageName.includes("won")) return "Approved";
  if (stageName.includes("approved")) return "Approved";
  return "Submitted";
}

function normalizeOrderStatus(status: PortalOrderStatus): PortalOrderStatus {
  if (status === "Under Review") return "Submitted";
  return status;
}

function parseLineItem(lineName: string): OrderLineItem {
  const categoryMatch = lineName.match(/^([^—]+)—/);
  const category = categoryMatch?.[1]?.trim() ?? "Software";
  const productName = lineName
    .replace(/^[^—]+—\s*/, "")
    .replace(/\s*\(\d+\s*Year[s]?\)\s*$/i, "")
    .trim();
  return {
    category,
    productName: productName || lineName.trim(),
    quantity: 1,
  };
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

/** Merge persisted portal orders with live Odoo sale orders and CRM leads. */
export async function fetchPartnerOrders(partnerId: number): Promise<PortalOrder[]> {
  const localOrders = listPortalOrdersForPartner(partnerId);
  const client = getOdooClient();
  if (!client) return localOrders;

  const partnerIds = await getRelatedPartnerIds(partnerId);
  const merged = new Map<string, PortalOrder>();

  for (const order of localOrders) {
    merged.set(order.reference, order);
  }

  try {
    const leads = await client.searchRead<OdooCrmLeadRow>(
      "crm.lead",
      [
        ["partner_id", "in", partnerIds],
        ["name", "ilike", "Portal software order"],
        ["active", "in", [true, false]],
      ],
      ["name", "stage_id", "probability", "active", "create_date"],
      50,
    );

    for (const lead of leads) {
      const reference = `LEAD-${lead.id}`;
      const existing = [...merged.values()].find((order) => order.leadId === lead.id);
      const odooStatus = mapLeadToStatus(lead);

      if (existing) {
        merged.set(existing.reference, mergeOrderPaymentFields(existing, {
          ...existing,
          status: mergeOrderStatus(existing, odooStatus),
          leadId: lead.id,
        }));
        continue;
      }

      merged.set(reference, mergeOrderPaymentFields(undefined, {
        id: `odoo-lead-${lead.id}`,
        reference,
        actorId: "",
        partnerId,
        status: odooStatus,
        duration: "1year",
        items: [{ category: "Software", productName: lead.name.replace(/^Portal software order:\s*/i, ""), quantity: 1 }],
        leadId: lead.id,
        createdAt: lead.create_date,
        updatedAt: lead.create_date,
      }));
    }
  } catch (error) {
    logger.warn("Failed to fetch CRM leads for orders", {
      action: "orders.fetch",
      partnerId,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  try {
    const saleOrders = await client.searchRead<OdooSaleOrderRow>(
      "sale.order",
      [
        ["partner_id", "in", partnerIds],
        ["origin", "ilike", "Aptus Customer Portal"],
      ],
      ["name", "state", "date_order", "end_date", "subscription_state", "order_line"],
      50,
    );

    for (const saleOrder of saleOrders) {
      const reference = `SO-${saleOrder.id}`;
      const existing = [...merged.values()].find((order) => order.saleOrderId === saleOrder.id);
      const odooStatus = mapSaleOrderToStatus(saleOrder);

      let items: OrderLineItem[] = [{ category: "Software", productName: saleOrder.name, quantity: 1 }];
      if (saleOrder.order_line?.length) {
        try {
          const lines = await client.read<OdooSaleOrderLineRow>(
            "sale.order.line",
            saleOrder.order_line,
            ["name", "product_uom_qty"],
          );
          items = lines.map((line) => ({
            ...parseLineItem(typeof line.name === "string" ? line.name : saleOrder.name),
            quantity: line.product_uom_qty || 1,
          }));
        } catch {
          /* keep default item */
        }
      }

      if (existing) {
        merged.set(existing.reference, mergeOrderPaymentFields(existing, {
          ...existing,
          status: mergeOrderStatus(existing, odooStatus),
          saleOrderId: saleOrder.id,
          items: existing.items.length ? existing.items : items,
        }));
        continue;
      }

      const createdAt =
        typeof saleOrder.date_order === "string" ? saleOrder.date_order : new Date().toISOString();

      merged.set(reference, mergeOrderPaymentFields(undefined, {
        id: `odoo-so-${saleOrder.id}`,
        reference,
        actorId: "",
        partnerId,
        status: odooStatus,
        duration: "1year",
        items,
        saleOrderId: saleOrder.id,
        createdAt,
        updatedAt: createdAt,
      }));
    }
  } catch (error) {
    logger.warn("Failed to fetch sale orders for portal orders", {
      action: "orders.fetch",
      partnerId,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return [...merged.values()]
    .map((order) => ({
      ...order,
      status: normalizeOrderStatus(order.status),
    }))
    .sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

export function resolveStoredOrder(orderId: string): PortalOrder | null {
  return getPortalOrderById(orderId);
}
