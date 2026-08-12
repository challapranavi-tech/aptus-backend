import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { PortalRefundRequest, RefundStatus } from "@/types/refunds";
import { writeJsonStore } from "./json-file-store";

const REFUNDS_FILE = path.join(process.cwd(), ".data", "portal-refunds.json");

type RefundsStore = {
  refunds: PortalRefundRequest[];
};

function readStore(): RefundsStore {
  if (!fs.existsSync(REFUNDS_FILE)) return { refunds: [] };
  try {
    const parsed = JSON.parse(fs.readFileSync(REFUNDS_FILE, "utf8")) as RefundsStore;
    return { refunds: Array.isArray(parsed.refunds) ? parsed.refunds : [] };
  } catch {
    return { refunds: [] };
  }
}

function writeStore(store: RefundsStore): void {
  writeJsonStore(REFUNDS_FILE, store);
}

function buildReference(): string {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `REF-${stamp}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

export function createRefundRequest(input: {
  partnerId: number;
  actorId: string;
  orderReference: string;
  productName: string;
  amount: string;
  reason?: string;
}): PortalRefundRequest {
  const now = new Date().toISOString();
  const refund: PortalRefundRequest = {
    id: randomUUID(),
    reference: buildReference(),
    partnerId: input.partnerId,
    actorId: input.actorId,
    orderReference: input.orderReference,
    productName: input.productName,
    amount: input.amount,
    reason: input.reason,
    status: "Requested",
    createdAt: now,
    updatedAt: now,
  };

  const store = readStore();
  store.refunds.unshift(refund);
  store.refunds = store.refunds.slice(0, 2000);
  writeStore(store);

  return refund;
}

export function listRefundsForPartner(partnerId: number): PortalRefundRequest[] {
  return readStore().refunds.filter((refund) => refund.partnerId === partnerId);
}

export function listAllRefunds(): PortalRefundRequest[] {
  return readStore().refunds;
}

export function getRefundById(id: string): PortalRefundRequest | null {
  return readStore().refunds.find((refund) => refund.id === id) ?? null;
}

export function updateRefundStatus(
  id: string,
  status: RefundStatus,
  extra?: { paymentMethod?: string; estimatedArrival?: string; rejectReason?: string },
): PortalRefundRequest | null {
  const store = readStore();
  const index = store.refunds.findIndex((refund) => refund.id === id);
  if (index === -1) return null;

  const now = new Date().toISOString();
  const updated: PortalRefundRequest = {
    ...store.refunds[index],
    status,
    paymentMethod: extra?.paymentMethod ?? store.refunds[index].paymentMethod,
    estimatedArrival: extra?.estimatedArrival ?? store.refunds[index].estimatedArrival,
    rejectReason: extra?.rejectReason ?? store.refunds[index].rejectReason,
    updatedAt: now,
    processedAt: status === "Processed" ? now : store.refunds[index].processedAt,
  };
  store.refunds[index] = updated;
  writeStore(store);
  return updated;
}
