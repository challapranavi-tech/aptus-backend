import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

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

const DATA_DIR = path.join(process.cwd(), ".data");
const AUDIT_FILE = path.join(DATA_DIR, "audit-log.jsonl");

type GlobalStore = typeof globalThis & {
  __aptusAuditBuffer?: AuditEntry[];
};

const globalStore = globalThis as GlobalStore;

function appendToDisk(entry: AuditEntry): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.appendFileSync(AUDIT_FILE, `${JSON.stringify(entry)}\n`, "utf8");
}

export function writeAudit(entry: Omit<AuditEntry, "id" | "createdAt">): AuditEntry {
  const full: AuditEntry = {
    ...entry,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
  };

  if (!globalStore.__aptusAuditBuffer) {
    globalStore.__aptusAuditBuffer = [];
  }
  globalStore.__aptusAuditBuffer.push(full);
  if (globalStore.__aptusAuditBuffer.length > 500) {
    globalStore.__aptusAuditBuffer.shift();
  }

  try {
    appendToDisk(full);
  } catch (err) {
    console.error("[AUDIT LOG FAILURE]", err);
  }

  return full;
}

export function readAuditForUser(userId: string, limit = 100): AuditEntry[] {
  if (!fs.existsSync(AUDIT_FILE)) return [];
  try {
    const lines = fs.readFileSync(AUDIT_FILE, "utf8").trim().split("\n").filter(Boolean);
    const entries: AuditEntry[] = [];
    for (let i = lines.length - 1; i >= 0 && entries.length < limit; i--) {
      const entry = JSON.parse(lines[i]) as AuditEntry;
      if (entry.actorId === userId || entry.targetId === userId) {
        entries.push(entry);
      }
    }
    return entries;
  } catch {
    return [];
  }
}
