import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { PortalRenewalRequest, RenewalRequestStatus } from "@/types/renewals";
import { writeJsonStore } from "./json-file-store";

const RENEWALS_FILE = path.join(process.cwd(), ".data", "portal-renewal-requests.json");

type RenewalsStore = {
  requests: PortalRenewalRequest[];
};

function readStore(): RenewalsStore {
  if (!fs.existsSync(RENEWALS_FILE)) return { requests: [] };
  try {
    const parsed = JSON.parse(fs.readFileSync(RENEWALS_FILE, "utf8")) as RenewalsStore;
    return { requests: Array.isArray(parsed.requests) ? parsed.requests : [] };
  } catch {
    return { requests: [] };
  }
}

function writeStore(store: RenewalsStore): void {
  writeJsonStore(RENEWALS_FILE, store);
}

export function createRenewalRequest(input: {
  actorId: string;
  partnerId: number;
  productName: string;
  orderId?: number;
  lineId?: number;
  renewalDateIso?: string;
  leadId?: number;
  reference: string;
  status?: RenewalRequestStatus;
}): PortalRenewalRequest {
  const now = new Date().toISOString();
  const request: PortalRenewalRequest = {
    id: randomUUID(),
    reference: input.reference,
    actorId: input.actorId,
    partnerId: input.partnerId,
    productName: input.productName,
    orderId: input.orderId,
    lineId: input.lineId,
    renewalDateIso: input.renewalDateIso,
    leadId: input.leadId,
    status: input.status ?? "Submitted",
    createdAt: now,
    updatedAt: now,
  };

  const store = readStore();
  store.requests.unshift(request);
  writeStore(store);
  return request;
}

export function listRenewalRequestsForPartner(partnerId: number, limit = 50): PortalRenewalRequest[] {
  return readStore()
    .requests.filter((request) => request.partnerId === partnerId)
    .slice(0, limit);
}

export function listAllRenewalRequests(limit = 200): PortalRenewalRequest[] {
  return readStore().requests.slice(0, limit);
}

export function getRenewalRequestById(requestId: string): PortalRenewalRequest | null {
  return readStore().requests.find((request) => request.id === requestId) ?? null;
}

export function updateRenewalRequestStatus(
  requestId: string,
  status: RenewalRequestStatus,
): PortalRenewalRequest | null {
  const store = readStore();
  const index = store.requests.findIndex((request) => request.id === requestId);
  if (index < 0) return null;

  store.requests[index] = {
    ...store.requests[index],
    status,
    updatedAt: new Date().toISOString(),
  };
  writeStore(store);
  return store.requests[index];
}

export function mergeRenewalStatus(
  local: PortalRenewalRequest | undefined,
  odooHint: RenewalRequestStatus | null,
): RenewalRequestStatus {
  if (odooHint === "Approved" || odooHint === "Rejected") return odooHint;
  return local?.status ?? odooHint ?? "Submitted";
}
