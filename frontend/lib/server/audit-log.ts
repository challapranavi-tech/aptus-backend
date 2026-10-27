import { randomUUID } from "crypto";
import { kvGet, kvSet } from "./kv-store";
import { logger } from "./logger";

export type AuditAction =
  | "auth.login"
  | "auth.login_failed"
  | "auth.register"
  | "auth.password_reset_otp"
  | "auth.password_reset"
  | "auth.logout"
  | "auth.refresh"
  | "auth.token_reuse"
  | "auth.email_verified"
  | "profile.update"
  | "profile.soft_delete"
  | "profile.export"
  | "subscription.create"
  | "subscription.cancel"
  | "order.place"
  | "order.status_update"
  | "subscription.request"
  | "notification.email"
  | "notification.platform"
  | "payment.checkout"
  | "payment.webhook"
  | "order.payment_complete"
  | "order.bank_transfer_submitted"
  | "refund.request"
  | "refund.process"
  | "refund.reject"
  | "cart.crm_synced"
  | "security.rate_limited";

export type AuditEntry = {
  id: string;
  action: AuditAction;
  actorId?: string;
  targetId?: string;
  traceId?: string;
  ip?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

const AUDIT_KEY_PREFIX = "aptus:audit:user:";
const AUDIT_TTL_SEC = 90 * 24 * 60 * 60; // 90 days
const AUDIT_MAX_ENTRIES = 500;

type GlobalStore = typeof globalThis & {
  __aptusAuditBuffer?: AuditEntry[];
};

const globalStore = globalThis as GlobalStore;

// Read-modify-write on a JSON blob races when two writeAudit() calls for the
// same user fire close together (common — e.g. order.place + notification.email
// in one request), since neither is awaited. Chain onto any in-flight write for
// the same key so this process appends in order instead of one clobbering the
// other.
// ponytail: this only serializes within one server instance — concurrent writes
// from different serverless instances can still race. Upgrade path: an atomic
// list append (e.g. Redis LPUSH/LTRIM) instead of a get+set blob.
const pendingWrites = new Map<string, Promise<void>>();

/** Fire-and-forget async KV write — never blocks the request. */
async function appendToKv(entry: AuditEntry): Promise<void> {
  const key = entry.actorId ? `${AUDIT_KEY_PREFIX}${entry.actorId}` : null;
  if (!key) return;

  const previous = pendingWrites.get(key) ?? Promise.resolve();
  const next = previous.catch(() => undefined).then(async () => {
    const existing = (await kvGet<AuditEntry[]>(key)) ?? [];
    const updated = [...existing, entry].slice(-AUDIT_MAX_ENTRIES);
    await kvSet(key, updated, AUDIT_TTL_SEC);
  });
  pendingWrites.set(key, next);

  try {
    await next;
  } catch (err) {
    logger.error("[AUDIT LOG KV FAILURE]", { error: String(err), action: entry.action });
  } finally {
    if (pendingWrites.get(key) === next) pendingWrites.delete(key);
  }
}

export function writeAudit(entry: Omit<AuditEntry, "id" | "createdAt">): AuditEntry {
  const full: AuditEntry = {
    ...entry,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
  };

  // In-memory buffer for same-request reads (e.g. admin panel)
  if (!globalStore.__aptusAuditBuffer) {
    globalStore.__aptusAuditBuffer = [];
  }
  globalStore.__aptusAuditBuffer.push(full);
  if (globalStore.__aptusAuditBuffer.length > AUDIT_MAX_ENTRIES) {
    globalStore.__aptusAuditBuffer.shift();
  }

  // Async KV write — do not await, never throws into caller
  void appendToKv(full);

  return full;
}

export async function readAuditForUser(userId: string, limit = 100): Promise<AuditEntry[]> {
  try {
    const entries = (await kvGet<AuditEntry[]>(`${AUDIT_KEY_PREFIX}${userId}`)) ?? [];
    return entries.slice(-limit).reverse();
  } catch {
    return [];
  }
}
