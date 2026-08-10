import fs from "fs";
import path from "path";
import { createHash, randomUUID } from "crypto";
import type {
  OrderLineItem,
  OrderPaymentStatus,
  PortalOrder,
  PortalOrderStatus,
} from "@/types/orders";
import { kvDel, kvGet, kvSet, kvSetNx } from "./kv-store";

const DATA_DIR = path.join(process.cwd(), ".data");
// Demo-mode only. Live portal orders are read/written via Odoo (crm.lead / sale.order).
const ORDERS_FILE = path.join(DATA_DIR, "portal-orders.json");
const DUPLICATE_WINDOW_SEC = 5 * 60;

type IdempotencyRecord = {
  reference: string | null;
  status: "pending" | "done";
};

type OrdersStore = {
  orders: PortalOrder[];
};

function readStore(): OrdersStore {
  if (!fs.existsSync(ORDERS_FILE)) return { orders: [] };
  try {
    const parsed = JSON.parse(fs.readFileSync(ORDERS_FILE, "utf8")) as OrdersStore;
    return { orders: Array.isArray(parsed.orders) ? parsed.orders : [] };
  } catch {
    return { orders: [] };
  }
}

function writeStore(store: OrdersStore): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(store, null, 2), "utf8");
}

export function buildOrderIdempotencyKey(input: {
  partnerId: number;
  duration: "1year" | "3year";
  items: OrderLineItem[];
}): string {
  const payload = JSON.stringify({
    partnerId: input.partnerId,
    duration: input.duration,
    items: input.items
      .map((item) => ({
        category: item.category.trim().toLowerCase(),
        productName: item.productName.trim().toLowerCase(),
        quantity: item.quantity,
        duration: item.duration ?? input.duration,
        purchaseType: item.purchaseType ?? "new",
        packageId: item.packageId ?? "",
        levelId: item.levelId ?? "",
      }))
      .sort((a, b) => `${a.category}:${a.productName}`.localeCompare(`${b.category}:${b.productName}`)),
  });
  return createHash("sha256").update(payload).digest("hex");
}

function idempotencyRedisKey(partnerId: number, idempotencyKey: string): string {
  return `aptus:order-idempotency:${partnerId}:${idempotencyKey}`;
}

export async function findRecentDuplicateOrder(
  partnerId: number,
  idempotencyKey: string,
): Promise<{ reference: string } | null> {
  const existing = await kvGet<IdempotencyRecord | { reference: string }>(
    idempotencyRedisKey(partnerId, idempotencyKey),
  );
  if (!existing) return null;
  if ("status" in existing) {
    return existing.reference ? { reference: existing.reference } : null;
  }
  return existing.reference ? { reference: existing.reference } : null;
}

export type OrderIdempotencyClaim =
  | { outcome: "claimed" }
  | { outcome: "duplicate"; reference: string }
  | { outcome: "in_progress" };

/** Claim the place-order slot before any Odoo write (SET NX). */
export async function claimOrderIdempotency(
  partnerId: number,
  idempotencyKey: string,
): Promise<OrderIdempotencyClaim> {
  const key = idempotencyRedisKey(partnerId, idempotencyKey);
  const claimed = await kvSetNx(
    key,
    { reference: null, status: "pending" } satisfies IdempotencyRecord,
    DUPLICATE_WINDOW_SEC,
  );
  if (claimed) return { outcome: "claimed" };

  const existing = await kvGet<IdempotencyRecord | { reference: string }>(key);
  if (!existing) {
    // Race with expiry — retry once.
    const retry = await kvSetNx(
      key,
      { reference: null, status: "pending" } satisfies IdempotencyRecord,
      DUPLICATE_WINDOW_SEC,
    );
    return retry ? { outcome: "claimed" } : { outcome: "in_progress" };
  }
  const reference = "status" in existing ? existing.reference : existing.reference;
  if (reference) return { outcome: "duplicate", reference };
  return { outcome: "in_progress" };
}

export async function rememberOrderIdempotency(
  partnerId: number,
  idempotencyKey: string,
  reference: string,
): Promise<void> {
  await kvSet(
    idempotencyRedisKey(partnerId, idempotencyKey),
    { reference, status: "done" } satisfies IdempotencyRecord,
    DUPLICATE_WINDOW_SEC,
  );
}

export async function releaseOrderIdempotency(
  partnerId: number,
  idempotencyKey: string,
): Promise<void> {
  await kvDel(idempotencyRedisKey(partnerId, idempotencyKey));
}

function requestIdempotencyRedisKey(partnerId: number, idempotencyKey: string): string {
  return `aptus:request-idempotency:${partnerId}:${idempotencyKey}`;
}

export function buildSubscriptionRequestIdempotencyKey(input: {
  partnerId: number;
  productName: string;
  requestType: string;
  orderId?: number;
  lineId?: number;
}): string {
  const payload = JSON.stringify({
    partnerId: input.partnerId,
    productName: input.productName.trim().toLowerCase(),
    requestType: input.requestType,
    orderId: input.orderId ?? null,
    lineId: input.lineId ?? null,
  });
  return createHash("sha256").update(payload).digest("hex");
}

export async function claimSubscriptionRequestIdempotency(
  partnerId: number,
  idempotencyKey: string,
): Promise<OrderIdempotencyClaim> {
  const key = requestIdempotencyRedisKey(partnerId, idempotencyKey);
  const claimed = await kvSetNx(
    key,
    { reference: null, status: "pending" } satisfies IdempotencyRecord,
    DUPLICATE_WINDOW_SEC,
  );
  if (claimed) return { outcome: "claimed" };

  const existing = await kvGet<IdempotencyRecord | { reference: string }>(key);
  const reference = existing && ("status" in existing ? existing.reference : existing.reference);
  if (reference) return { outcome: "duplicate", reference };
  return { outcome: "in_progress" };
}

export async function rememberSubscriptionRequestIdempotency(
  partnerId: number,
  idempotencyKey: string,
  reference: string,
): Promise<void> {
  await kvSet(
    requestIdempotencyRedisKey(partnerId, idempotencyKey),
    { reference, status: "done" } satisfies IdempotencyRecord,
    DUPLICATE_WINDOW_SEC,
  );
}

export async function releaseSubscriptionRequestIdempotency(
  partnerId: number,
  idempotencyKey: string,
): Promise<void> {
  await kvDel(requestIdempotencyRedisKey(partnerId, idempotencyKey));
}

export async function claimBankTransferSubmission(
  orderId: string,
): Promise<boolean> {
  return kvSetNx(`aptus:bank-transfer-lock:${orderId}`, true, 60);
}

/** Release the short submit lock so a failed attempt can be retried honestly. */
export async function releaseBankTransferSubmission(orderId: string): Promise<void> {
  await kvDel(`aptus:bank-transfer-lock:${orderId}`);
}

export function createPortalOrder(input: {
  actorId: string;
  partnerId: number;
  reference: string;
  duration: "1year" | "3year";
  items: OrderLineItem[];
  leadId?: number;
  saleOrderId?: number;
  idempotencyKey?: string;
  status?: PortalOrderStatus;
  amountDue?: number;
  paymentStatus?: OrderPaymentStatus;
  customerMessage?: string;
}): PortalOrder {
  const now = new Date().toISOString();
  const order: PortalOrder = {
    id: randomUUID(),
    reference: input.reference,
    actorId: input.actorId,
    partnerId: input.partnerId,
    status: input.status ?? "Submitted",
    duration: input.duration,
    items: input.items,
    leadId: input.leadId,
    saleOrderId: input.saleOrderId,
    idempotencyKey: input.idempotencyKey,
    paymentStatus: input.paymentStatus ?? "pending",
    amountDue: input.amountDue,
    customerMessage: input.customerMessage,
    createdAt: now,
    updatedAt: now,
  };

  const store = readStore();
  store.orders.unshift(order);
  writeStore(store);
  return order;
}

export function listPortalOrdersForPartner(partnerId: number, limit = 50): PortalOrder[] {
  return readStore()
    .orders.filter((order) => order.partnerId === partnerId)
    .slice(0, limit);
}

export function listAllPortalOrders(limit = 200): PortalOrder[] {
  return readStore().orders.slice(0, limit);
}

export function getPortalOrderById(orderId: string): PortalOrder | null {
  return readStore().orders.find((order) => order.id === orderId) ?? null;
}

export function getPortalOrderByReference(reference: string): PortalOrder | null {
  return readStore().orders.find((order) => order.reference === reference) ?? null;
}

export function resolvePortalOrderForPartner(
  orderId: string,
  partnerId: number,
): PortalOrder | null {
  const store = readStore();
  const byId = store.orders.find((order) => order.id === orderId && order.partnerId === partnerId);
  if (byId) return byId;

  if (orderId.startsWith("odoo-lead-")) {
    const leadId = Number(orderId.replace("odoo-lead-", ""));
    if (!Number.isNaN(leadId)) {
      return (
        store.orders.find((order) => order.leadId === leadId && order.partnerId === partnerId) ??
        null
      );
    }
  }

  if (orderId.startsWith("odoo-so-")) {
    const saleOrderId = Number(orderId.replace("odoo-so-", ""));
    if (!Number.isNaN(saleOrderId)) {
      return (
        store.orders.find(
          (order) => order.saleOrderId === saleOrderId && order.partnerId === partnerId,
        ) ?? null
      );
    }
  }

  return null;
}

export function upsertPortalOrderSnapshot(order: PortalOrder): PortalOrder {
  const store = readStore();
  const existing =
    store.orders.find((item) => item.id === order.id && item.partnerId === order.partnerId) ??
    store.orders.find((item) => item.reference === order.reference) ??
    (order.leadId != null
      ? store.orders.find((item) => item.leadId === order.leadId && item.partnerId === order.partnerId)
      : null);

  if (existing) {
    const index = store.orders.findIndex((item) => item.id === existing.id);
    const updated: PortalOrder = {
      ...existing,
      status: order.status ?? existing.status,
      paymentStatus: order.paymentStatus ?? existing.paymentStatus,
      amountDue: order.amountDue ?? existing.amountDue,
      duration: order.duration ?? existing.duration,
      items: order.items?.length ? order.items : existing.items,
      leadId: order.leadId ?? existing.leadId,
      saleOrderId: order.saleOrderId ?? existing.saleOrderId,
      paymentMethod: order.paymentMethod ?? existing.paymentMethod,
      bankTransferReference: order.bankTransferReference ?? existing.bankTransferReference,
      paymentProofFileName: order.paymentProofFileName ?? existing.paymentProofFileName,
      paymentProofUrl: order.paymentProofUrl ?? existing.paymentProofUrl,
      paymentProofUploadedAt: order.paymentProofUploadedAt ?? existing.paymentProofUploadedAt,
      paymentProofOdooAttachmentId:
        order.paymentProofOdooAttachmentId ?? existing.paymentProofOdooAttachmentId,
      updatedAt: new Date().toISOString(),
    };
    if (index >= 0) {
      store.orders[index] = updated;
      writeStore(store);
    }
    return updated;
  }

  const snapshot: PortalOrder = {
    ...order,
    paymentStatus: order.paymentStatus ?? "pending",
    createdAt: order.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  store.orders.unshift(snapshot);
  writeStore(store);
  return snapshot;
}

export function recordPortalOrderPayment(
  orderId: string,
  partnerId: number,
  input: {
    paymentIntentId: string;
    amountPaid: number;
    paymentMethod?: string;
  },
): PortalOrder | null {
  const store = readStore();
  let index = store.orders.findIndex((order) => order.id === orderId && order.partnerId === partnerId);

  if (index < 0) {
    const resolved = resolvePortalOrderForPartner(orderId, partnerId);
    if (!resolved) return null;
    index = store.orders.findIndex((order) => order.id === resolved.id);
  }

  if (index < 0) return null;

  const existing = store.orders[index];
  store.orders[index] = {
    ...existing,
    paymentStatus: "paid",
    paymentIntentId: input.paymentIntentId,
    amountPaid: input.amountPaid,
    paymentMethod: input.paymentMethod,
    paidAt: new Date().toISOString(),
    status: "Completed",
    updatedAt: new Date().toISOString(),
  };

  writeStore(store);
  return store.orders[index];
}

export function recordPortalOrderPaymentFailed(
  orderId: string,
  partnerId: number,
  input?: { paymentIntentId?: string; reason?: string },
): PortalOrder | null {
  const store = readStore();
  let index = store.orders.findIndex((order) => order.id === orderId && order.partnerId === partnerId);

  if (index < 0) {
    const resolved = resolvePortalOrderForPartner(orderId, partnerId);
    if (!resolved) return null;
    index = store.orders.findIndex((order) => order.id === resolved.id);
  }

  if (index < 0) return null;

  const existing = store.orders[index];
  store.orders[index] = {
    ...existing,
    paymentStatus: "failed",
    paymentIntentId: input?.paymentIntentId ?? existing.paymentIntentId,
    rejectReason: input?.reason ?? existing.rejectReason,
    updatedAt: new Date().toISOString(),
  };

  writeStore(store);
  return store.orders[index];
}

export function updatePortalOrderStatus(
  orderId: string,
  status: PortalOrderStatus,
  metadata?: { assignedStaff?: string },
): PortalOrder | null {
  const store = readStore();
  const index = store.orders.findIndex((order) => order.id === orderId);
  if (index < 0) return null;

  store.orders[index] = {
    ...store.orders[index],
    status,
    updatedAt: new Date().toISOString(),
    ...(metadata?.assignedStaff ? { assignedStaff: metadata.assignedStaff } : {}),
  } as PortalOrder & { assignedStaff?: string };

  writeStore(store);
  return store.orders[index];
}

export function mergeOrderStatus(
  local: PortalOrder | undefined,
  odooHint: PortalOrderStatus | null,
): PortalOrderStatus {
  if (local?.paymentStatus === "paid" || local?.status === "Completed") {
    return "Completed";
  }

  const hint = odooHint === "Under Review" ? "Submitted" : odooHint;

  if (hint === "Approved" || hint === "Completed" || hint === "Rejected") {
    return hint;
  }

  const localStatus = local?.status === "Under Review" ? "Submitted" : local?.status;

  if (localStatus && localStatus !== "Submitted") return localStatus;
  return hint ?? localStatus ?? "Submitted";
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

export function mergeOrderPaymentFields(
  local: PortalOrder | undefined,
  merged: PortalOrder,
): PortalOrder {
  return {
    ...merged,
    paymentStatus: local?.paymentStatus ?? merged.paymentStatus ?? "pending",
    paymentIntentId: local?.paymentIntentId ?? merged.paymentIntentId,
    amountDue: local?.amountDue ?? merged.amountDue,
    amountPaid: local?.amountPaid ?? merged.amountPaid,
    paymentMethod: local?.paymentMethod ?? merged.paymentMethod,
    paidAt: local?.paidAt ?? merged.paidAt,
  };
}
