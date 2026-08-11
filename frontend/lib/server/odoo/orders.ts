import { getOdooClient } from "./client";
import { logger } from "../logger";
import type { OrderLineItem, OrderPaymentStatus, PortalOrder, PortalOrderStatus } from "@/types/orders";
import {
  formatPaymentFailedNote,
  formatPaymentPaidNote,
  formatPaymentPendingNote,
  formatPaymentRejectedNote,
  parseSaleOrderPaymentMeta,
} from "./payment-meta";
import { getRelatedPartnerIds } from "./partner-context";
import { parseProductOrderLeadItems } from "./leads";
import { fetchPartnerSubscriptions, saleOrderHasIssuedLicense } from "./subscriptions";

type OdooSaleOrderRow = {
  id: number;
  name: string;
  state: string;
  date_order: string | false;
  end_date: string | false;
  subscription_state: string | false;
  order_line: number[];
  note: string | false;
  amount_total: number;
  invoice_status: string | false;
  origin: string | false;
};

type OdooCrmLeadRow = {
  id: number;
  name: string;
  stage_id: [number, string] | false;
  probability: number;
  active: boolean;
  create_date: string;
  description: string | false;
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

function parseDuration(lineName: string): "1year" | "3year" {
  return /\(3\s*Year/i.test(lineName) ? "3year" : "1year";
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

function applyPaymentMeta(
  order: PortalOrder,
  meta: ReturnType<typeof parseSaleOrderPaymentMeta>,
  amountTotal?: number,
): PortalOrder {
  let status = normalizeOrderStatus(order.status);
  if (meta.paymentStatus === "paid") status = "Completed";
  if (meta.paymentStatus === "failed") status = "Rejected";

  return {
    ...order,
    paymentStatus: meta.paymentStatus,
    bankTransferReference: meta.bankTransferReference,
    paymentMethod: meta.paymentMethod,
    paymentProofFileName: meta.paymentProofFileName,
    paymentProofOdooAttachmentId: meta.paymentProofOdooAttachmentId,
    paymentIntentId: meta.paymentIntentId,
    amountPaid: meta.amountPaid,
    paidAt: meta.paidAt,
    rejectReason: meta.rejectReason,
    amountDue: amountTotal != null && amountTotal > 0 ? amountTotal : order.amountDue,
    paymentProofUrl:
      meta.paymentProofOdooAttachmentId != null || meta.paymentProofFileName
        ? `/api/orders/${encodeURIComponent(order.id)}/payment-proof`
        : undefined,
    status,
  };
}

async function mapSaleOrderRow(
  saleOrder: OdooSaleOrderRow,
  partnerId: number,
): Promise<PortalOrder> {
  const client = getOdooClient();
  let items: OrderLineItem[] = [{ category: "Software", productName: saleOrder.name, quantity: 1 }];
  let duration: "1year" | "3year" = "1year";

  if (saleOrder.order_line?.length && client) {
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
      const firstName = typeof lines[0]?.name === "string" ? lines[0].name : "";
      duration = parseDuration(firstName);
    } catch {
      /* keep defaults */
    }
  }

  const createdAt =
    typeof saleOrder.date_order === "string" ? saleOrder.date_order : new Date().toISOString();
  const hasLicense = await saleOrderHasIssuedLicense(saleOrder.order_line ?? []);
  const paymentMeta = parseSaleOrderPaymentMeta(saleOrder.note, {
    invoiceStatus: saleOrder.invoice_status,
    subscriptionState: saleOrder.subscription_state,
    orderState: saleOrder.state,
    hasLicense,
  });

  const base: PortalOrder = {
    id: `odoo-so-${saleOrder.id}`,
    reference: `SO-${saleOrder.id}`,
    actorId: "",
    partnerId,
    status: mapSaleOrderToStatus(saleOrder),
    duration,
    items,
    saleOrderId: saleOrder.id,
    amountDue: typeof saleOrder.amount_total === "number" ? saleOrder.amount_total : undefined,
    createdAt,
    updatedAt: createdAt,
  };

  return applyPaymentMeta(base, paymentMeta, saleOrder.amount_total);
}

function mapLeadRow(lead: OdooCrmLeadRow, partnerId: number): PortalOrder {
  const paymentMeta = parseSaleOrderPaymentMeta(lead.description);
  const parsedItems = parseProductOrderLeadItems(lead.name);
  const items: OrderLineItem[] = parsedItems.length
    ? parsedItems.map((item) => ({
        category: "Software",
        productName: item.productName,
        quantity: item.quantity,
      }))
    : [
        {
          category: "Software",
          productName: lead.name.replace(/^Portal software order:\s*/i, ""),
          quantity: 1,
        },
      ];

  const base: PortalOrder = {
    id: `odoo-lead-${lead.id}`,
    reference: `LEAD-${lead.id}`,
    actorId: "",
    partnerId,
    status: normalizeOrderStatus(mapLeadToStatus(lead)),
    duration: "1year",
    items,
    leadId: lead.id,
    paymentStatus: paymentMeta.paymentStatus,
    createdAt: lead.create_date,
    updatedAt: lead.create_date,
  };

  return applyPaymentMeta(base, paymentMeta);
}

/** Read portal orders from Odoo CRM leads + sale orders only (no local JSON overlay). */
export async function fetchPartnerOrders(partnerId: number): Promise<PortalOrder[]> {
  const client = getOdooClient();
  if (!client) return [];

  const partnerIds = await getRelatedPartnerIds(partnerId);
  const merged = new Map<string, PortalOrder>();

  try {
    const leads = await client.searchRead<OdooCrmLeadRow>(
      "crm.lead",
      [
        ["partner_id", "in", partnerIds],
        ["name", "ilike", "Portal software order"],
        ["active", "in", [true, false]],
      ],
      ["name", "stage_id", "probability", "active", "create_date", "description"],
      50,
    );

    for (const lead of leads) {
      merged.set(`LEAD-${lead.id}`, mapLeadRow(lead, partnerId));
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
      [
        "name",
        "state",
        "date_order",
        "end_date",
        "subscription_state",
        "order_line",
        "note",
        "amount_total",
        "invoice_status",
        "origin",
      ],
      50,
    );

    for (const saleOrder of saleOrders) {
      const mapped = await mapSaleOrderRow(saleOrder, partnerId);
      merged.set(mapped.reference, mapped);
    }
  } catch (error) {
    logger.warn("Failed to fetch sale orders for portal orders", {
      action: "orders.fetch",
      partnerId,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return markLicensedOrdersCompleted(
    dedupePortalOrders([...merged.values()])
      .map((order) => ({
        ...order,
        status: normalizeOrderStatus(order.status),
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    partnerId,
  );
}

/** Drop CRM lead rows when a matching portal sale order already covers the request. */
function dedupePortalOrders(orders: PortalOrder[]): PortalOrder[] {
  const saleOrders = orders.filter((order) => order.saleOrderId != null);
  if (!saleOrders.length) return orders;

  const kept: PortalOrder[] = [];
  for (const order of orders) {
    if (order.saleOrderId != null || order.leadId == null) {
      kept.push(order);
      continue;
    }

    const leadProducts = order.items.map((item) => item.productName.toLowerCase().trim());
    const match = saleOrders.find((saleOrder) => {
      const soProducts = saleOrder.items.map((item) => item.productName.toLowerCase().trim());
      const overlap = leadProducts.some((product) =>
        soProducts.some((soProduct) => soProduct.includes(product) || product.includes(soProduct)),
      );
      if (!overlap) return false;
      const leadTime = new Date(order.createdAt).getTime();
      const soTime = new Date(saleOrder.createdAt).getTime();
      if (Number.isNaN(leadTime) || Number.isNaN(soTime)) return true;
      return Math.abs(leadTime - soTime) <= 7 * 24 * 60 * 60 * 1000;
    });

    if (match) {
      if (match.leadId == null) match.leadId = order.leadId;
      continue;
    }
    kept.push(order);
  }
  return kept;
}

/**
 * If finance issued a license on a related subscription but the order note still
 * looks unpaid, surface the order as completed (dashboard was stuck on Processing).
 */
async function markLicensedOrdersCompleted(
  orders: PortalOrder[],
  partnerId: number,
): Promise<PortalOrder[]> {
  const open = orders.filter(
    (order) =>
      order.status !== "Completed" &&
      order.status !== "Rejected" &&
      order.paymentStatus !== "paid" &&
      order.paymentStatus !== "failed",
  );
  if (!open.length) return orders;

  let subscriptions: Awaited<ReturnType<typeof fetchPartnerSubscriptions>> = [];
  try {
    subscriptions = await fetchPartnerSubscriptions(partnerId);
  } catch {
    return orders;
  }

  const licensedOrderIds = new Set(
    subscriptions
      .filter((item) => Boolean(item.licenseKey?.trim()))
      .map((item) => item.orderId)
      .filter((id): id is number => id != null),
  );
  const licensedProducts = subscriptions
    .filter((item) => Boolean(item.licenseKey?.trim()))
    .map((item) => item.productName.toLowerCase().trim());

  if (!licensedOrderIds.size && !licensedProducts.length) return orders;

  return orders.map((order) => {
    if (
      order.status === "Completed" ||
      order.status === "Rejected" ||
      order.paymentStatus === "paid" ||
      order.paymentStatus === "failed"
    ) {
      return order;
    }

    const byOrderId =
      order.saleOrderId != null && licensedOrderIds.has(order.saleOrderId);
    // Lead-only rows (no SO in portal list) — match by product when a license exists.
    const byProduct =
      order.saleOrderId == null &&
      order.items.some((item) => {
        const name = item.productName.toLowerCase().trim();
        return licensedProducts.some(
          (licensed) => licensed.includes(name) || name.includes(licensed),
        );
      });

    if (!byOrderId && !byProduct) return order;
    return applyPaymentMeta(order, {
      paymentStatus: "paid",
      paymentMethod: order.paymentMethod ?? "License issued",
    });
  });
}

function parseOrderIdParts(orderId: string): {
  leadId?: number;
  saleOrderId?: number;
} {
  if (orderId.startsWith("odoo-lead-")) {
    const leadId = Number(orderId.replace("odoo-lead-", ""));
    return Number.isFinite(leadId) ? { leadId } : {};
  }
  if (orderId.startsWith("odoo-so-")) {
    const saleOrderId = Number(orderId.replace("odoo-so-", ""));
    return Number.isFinite(saleOrderId) ? { saleOrderId } : {};
  }
  if (orderId.startsWith("LEAD-")) {
    const leadId = Number(orderId.replace("LEAD-", ""));
    return Number.isFinite(leadId) ? { leadId } : {};
  }
  if (orderId.startsWith("SO-")) {
    const saleOrderId = Number(orderId.replace("SO-", ""));
    return Number.isFinite(saleOrderId) ? { saleOrderId } : {};
  }
  return {};
}

/** Resolve a single portal order from Odoo by portal id / LEAD-n / SO-n. */
export async function resolvePartnerOrder(
  partnerId: number,
  orderId: string,
): Promise<PortalOrder | null> {
  const client = getOdooClient();
  if (!client) return null;

  const partnerIds = await getRelatedPartnerIds(partnerId);
  const parts = parseOrderIdParts(orderId);

  if (parts.saleOrderId != null) {
    const rows = await client.read<OdooSaleOrderRow>(
      "sale.order",
      [parts.saleOrderId],
      [
        "name",
        "state",
        "date_order",
        "end_date",
        "subscription_state",
        "order_line",
        "note",
        "amount_total",
        "invoice_status",
        "origin",
        "partner_id",
      ],
    );
    const row = rows[0] as OdooSaleOrderRow & { partner_id?: [number, string] | number };
    if (!row) return null;
    const soPartner = Array.isArray(row.partner_id)
      ? row.partner_id[0]
      : typeof row.partner_id === "number"
        ? row.partner_id
        : null;
    if (soPartner != null && !partnerIds.includes(soPartner)) return null;
    return mapSaleOrderRow(row, partnerId);
  }

  if (parts.leadId != null) {
    const rows = await client.read<OdooCrmLeadRow & { partner_id?: [number, string] | false }>(
      "crm.lead",
      [parts.leadId],
      ["name", "stage_id", "probability", "active", "create_date", "description", "partner_id"],
    );
    const lead = rows[0];
    if (!lead) return null;
    const leadPartner = Array.isArray(lead.partner_id) ? lead.partner_id[0] : null;
    if (leadPartner != null && !partnerIds.includes(leadPartner)) return null;
    return mapLeadRow(lead, partnerId);
  }

  const all = await fetchPartnerOrders(partnerId);
  return all.find((order) => order.id === orderId || order.reference === orderId) ?? null;
}

export async function markPartnerOrderPaymentPending(input: {
  saleOrderId: number;
  bankTransferReference: string;
  attachmentId?: number;
  fileName?: string;
}): Promise<void> {
  const client = getOdooClient();
  if (!client) throw new Error("Odoo is not configured");

  const note = formatPaymentPendingNote({
    bankTransferReference: input.bankTransferReference,
    attachmentId: input.attachmentId,
    fileName: input.fileName,
  });
  await client.write("sale.order", [input.saleOrderId], { note });
}

export async function markPartnerOrderPaymentPaid(input: {
  saleOrderId: number;
  paymentMethod?: string;
  paymentIntentId?: string;
  amountPaid?: number;
  bankTransferReference?: string;
  attachmentId?: number;
  fileName?: string;
}): Promise<PortalOrder | null> {
  const client = getOdooClient();
  if (!client) throw new Error("Odoo is not configured");

  const note = formatPaymentPaidNote({
    paymentMethod: input.paymentMethod,
    paymentIntentId: input.paymentIntentId,
    amountPaid: input.amountPaid,
    bankTransferReference: input.bankTransferReference,
    attachmentId: input.attachmentId,
    fileName: input.fileName,
  });
  await client.write("sale.order", [input.saleOrderId], { note });

  try {
    await client.call(
      "sale.order",
      "message_post",
      [[input.saleOrderId]],
      {
        body: `Payment recorded via Aptus Customer Portal. Method: ${input.paymentMethod ?? "unknown"}. Status: Paid.`,
        message_type: "comment",
        subtype_xmlid: "mail.mt_comment",
      },
    );
  } catch {
    /* chatter is best-effort */
  }

  const rows = await client.read<{ partner_id: [number, string] | false }>(
    "sale.order",
    [input.saleOrderId],
    ["partner_id"],
  );
  const partnerId = Array.isArray(rows[0]?.partner_id) ? rows[0].partner_id[0] : null;
  if (!partnerId) return null;
  return resolvePartnerOrder(partnerId, `odoo-so-${input.saleOrderId}`);
}

export async function markPartnerOrderPaymentRejected(input: {
  saleOrderId: number;
  bankTransferReference?: string;
  reason?: string;
}): Promise<PortalOrder | null> {
  const client = getOdooClient();
  if (!client) throw new Error("Odoo is not configured");

  const note = formatPaymentRejectedNote({
    bankTransferReference: input.bankTransferReference,
    reason: input.reason,
  });
  await client.write("sale.order", [input.saleOrderId], { note });

  try {
    await client.call(
      "sale.order",
      "action_cancel",
      [[input.saleOrderId]],
    );
  } catch {
    try {
      await client.write("sale.order", [input.saleOrderId], { state: "cancel" });
    } catch {
      /* best-effort cancel */
    }
  }

  try {
    await client.call(
      "sale.order",
      "message_post",
      [[input.saleOrderId]],
      {
        body: `Payment rejected via Aptus Customer Portal.${input.reason ? ` Reason: ${input.reason}` : ""}`,
        message_type: "comment",
        subtype_xmlid: "mail.mt_comment",
      },
    );
  } catch {
    /* chatter is best-effort */
  }

  const rows = await client.read<{ partner_id: [number, string] | false }>(
    "sale.order",
    [input.saleOrderId],
    ["partner_id"],
  );
  const partnerId = Array.isArray(rows[0]?.partner_id) ? rows[0].partner_id[0] : null;
  if (!partnerId) return null;
  return resolvePartnerOrder(partnerId, `odoo-so-${input.saleOrderId}`);
}

/** Card/gateway decline — marks payment failed without cancelling the sale order. */
export async function markPartnerOrderPaymentFailed(input: {
  saleOrderId: number;
  paymentIntentId?: string;
  reason?: string;
}): Promise<PortalOrder | null> {
  const client = getOdooClient();
  if (!client) throw new Error("Odoo is not configured");

  const note = formatPaymentFailedNote({
    paymentIntentId: input.paymentIntentId,
    reason: input.reason,
    paymentMethod: "Stripe",
  });
  await client.write("sale.order", [input.saleOrderId], { note });

  try {
    await client.call(
      "sale.order",
      "message_post",
      [[input.saleOrderId]],
      {
        body: `Payment failed via Aptus Customer Portal.${input.reason ? ` Reason: ${input.reason}` : ""}`,
        message_type: "comment",
        subtype_xmlid: "mail.mt_comment",
      },
    );
  } catch {
    /* chatter is best-effort */
  }

  const rows = await client.read<{ partner_id: [number, string] | false }>(
    "sale.order",
    [input.saleOrderId],
    ["partner_id"],
  );
  const partnerId = Array.isArray(rows[0]?.partner_id) ? rows[0].partner_id[0] : null;
  if (!partnerId) return null;
  return resolvePartnerOrder(partnerId, `odoo-so-${input.saleOrderId}`);
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

  const stages = await client.searchRead<{ id: number; name: string; is_won: boolean }>(
    "crm.stage",
    domain.length ? domain : [],
    ["id", "name", "is_won"],
    40,
  );

  for (const hint of hints) {
    const match = stages.find((stage) => stage.name.toLowerCase().includes(hint));
    if (match) return match.id;
  }
  return null;
}

/** Update CRM lead stage so admin status changes live in Odoo (not a local JSON file). */
export async function updatePartnerOrderStatusInOdoo(
  order: PortalOrder,
  status: PortalOrderStatus,
  options?: { reason?: string },
): Promise<PortalOrder | null> {
  const client = getOdooClient();
  if (!client) throw new Error("Odoo is not configured");

  const leadId = order.leadId ?? (order.id.startsWith("odoo-lead-")
    ? Number(order.id.replace("odoo-lead-", ""))
    : order.reference.startsWith("LEAD-")
      ? Number(order.reference.replace("LEAD-", ""))
      : null);

  if (leadId && Number.isFinite(leadId)) {
    const rows = await client.read<{ team_id: [number, string] | false }>(
      "crm.lead",
      [leadId],
      ["team_id"],
    );
    const teamId = Array.isArray(rows[0]?.team_id) ? rows[0].team_id[0] : undefined;

    if (status === "Approved" || status === "Completed") {
      const wonId =
        (await findStageIdByHint(teamId, ["won", "approved"])) ??
        (await findStageIdByHint(teamId, ["won"]));
      if (wonId) {
        await client.write("crm.lead", [leadId], {
          stage_id: wonId,
          probability: 100,
          active: true,
        });
      }
    } else if (status === "Rejected") {
      const lostId = await findStageIdByHint(teamId, ["lost"]);
      if (lostId) {
        await client.write("crm.lead", [leadId], {
          stage_id: lostId,
          probability: 0,
          active: true,
        });
      } else {
        await client.write("crm.lead", [leadId], { probability: 0, active: false });
      }
    } else {
      const newId = await findStageIdByHint(teamId, ["new", "qualified", "proposition"]);
      if (newId) {
        await client.write("crm.lead", [leadId], {
          stage_id: newId,
          probability: 10,
          active: true,
        });
      }
    }

    return resolvePartnerOrder(order.partnerId, `odoo-lead-${leadId}`);
  }

  if (order.saleOrderId) {
    if (status === "Rejected") {
      return markPartnerOrderPaymentRejected({
        saleOrderId: order.saleOrderId,
        bankTransferReference: order.bankTransferReference,
        reason: options?.reason,
      });
    } else if (status === "Approved" || status === "Completed") {
      try {
        await client.call("sale.order", "action_confirm", [[order.saleOrderId]]);
      } catch {
        /* already confirmed or confirmation blocked — status still derived from state on read */
      }
      if (status === "Completed") {
        await markPartnerOrderPaymentPaid({
          saleOrderId: order.saleOrderId,
          paymentMethod: order.paymentMethod,
          amountPaid: order.amountPaid ?? order.amountDue,
          bankTransferReference: order.bankTransferReference,
        });
      }
    }
    return resolvePartnerOrder(order.partnerId, `odoo-so-${order.saleOrderId}`);
  }

  return null;
}

/** Admin listing: all portal sale orders + software-order leads. */
export async function listAllPortalOrdersFromOdoo(limit = 200): Promise<PortalOrder[]> {
  const client = getOdooClient();
  if (!client) return [];

  const merged = new Map<string, PortalOrder>();

  try {
    const leads = await client.searchRead<OdooCrmLeadRow & { partner_id: [number, string] | false }>(
      "crm.lead",
      [
        ["name", "ilike", "Portal software order"],
        ["active", "in", [true, false]],
      ],
      ["name", "stage_id", "probability", "active", "create_date", "description", "partner_id"],
      limit,
    );
    for (const lead of leads) {
      const partnerId = Array.isArray(lead.partner_id) ? lead.partner_id[0] : 0;
      merged.set(`LEAD-${lead.id}`, mapLeadRow(lead, partnerId));
    }
  } catch (error) {
    logger.warn("Failed to list CRM leads for admin orders", {
      action: "orders.list_all",
      error: error instanceof Error ? error.message : String(error),
    });
  }

  try {
    const saleOrders = await client.searchRead<
      OdooSaleOrderRow & { partner_id: [number, string] | false }
    >(
      "sale.order",
      [["origin", "ilike", "Aptus Customer Portal"]],
      [
        "name",
        "state",
        "date_order",
        "end_date",
        "subscription_state",
        "order_line",
        "note",
        "amount_total",
        "invoice_status",
        "origin",
        "partner_id",
      ],
      limit,
    );
    for (const saleOrder of saleOrders) {
      const partnerId = Array.isArray(saleOrder.partner_id) ? saleOrder.partner_id[0] : 0;
      const mapped = await mapSaleOrderRow(saleOrder, partnerId);
      merged.set(mapped.reference, mapped);
    }
  } catch (error) {
    logger.warn("Failed to list sale orders for admin orders", {
      action: "orders.list_all",
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return [...merged.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function resolveOrderLeadId(order: Pick<PortalOrder, "id" | "reference" | "leadId">): number | null {
  if (order.leadId) return order.leadId;
  if (order.id.startsWith("odoo-lead-")) {
    const leadId = Number(order.id.replace("odoo-lead-", ""));
    return Number.isNaN(leadId) ? null : leadId;
  }
  const refMatch = order.reference.match(/^LEAD-(\d+)$/i);
  if (refMatch) {
    const leadId = Number(refMatch[1]);
    return Number.isNaN(leadId) ? null : leadId;
  }
  return null;
}

export type { OrderPaymentStatus };
