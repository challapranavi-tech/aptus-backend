import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type {
  PortalNotification,
  PortalNotificationStatus,
  PortalNotificationType,
} from "@/types/notifications";
import {
  hasNotificationForReference as hasOdooNotificationSent,
  markNotificationSent as markOdooNotificationSent,
  claimNotificationSend as claimOdooNotificationSend,
} from "./odoo/notifications";
import { isDemoMode } from "./config";
import { kvGet, kvSet } from "./kv-store";

const DATA_DIR = path.join(process.cwd(), ".data");
/** Supplemental / event notifications (payment_failed, etc.) — used in demo and live. */
const NOTIFICATIONS_FILE = path.join(DATA_DIR, "portal-notifications.json");
const READ_TTL_SEC = 180 * 24 * 60 * 60;

type NotificationsStore = {
  notifications: PortalNotification[];
};

function readStore(): NotificationsStore {
  if (!fs.existsSync(NOTIFICATIONS_FILE)) return { notifications: [] };
  try {
    const parsed = JSON.parse(fs.readFileSync(NOTIFICATIONS_FILE, "utf8")) as NotificationsStore;
    return { notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [] };
  } catch {
    return { notifications: [] };
  }
}

function writeStore(store: NotificationsStore): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(store, null, 2), "utf8");
}

function readIdsKey(partnerId: number): string {
  return `aptus:notif-read:${partnerId}`;
}

export async function getReadNotificationIds(partnerId: number): Promise<Set<string>> {
  const ids = (await kvGet<string[]>(readIdsKey(partnerId))) ?? [];
  return new Set(ids);
}

export async function markNotificationsRead(
  partnerId: number,
  ids: string[],
): Promise<number> {
  if (!ids.length) return 0;

  const store = readStore();
  let fileUpdated = 0;
  for (const notification of store.notifications) {
    if (notification.partnerId === partnerId && ids.includes(notification.id) && !notification.read) {
      notification.read = true;
      fileUpdated += 1;
    }
  }
  if (fileUpdated) writeStore(store);

  const known = await getReadNotificationIds(partnerId);
  for (const id of ids) known.add(id);
  const next = Array.from(known).slice(-500);
  await kvSet(readIdsKey(partnerId), next, READ_TTL_SEC);
  return ids.length;
}

export function applyReadFlags(
  notifications: PortalNotification[],
  readIds: Set<string>,
): PortalNotification[] {
  return notifications.map((notification) =>
    readIds.has(notification.id) || notification.read
      ? { ...notification, read: true }
      : notification,
  );
}

export function mergeNotifications(
  primary: PortalNotification[],
  secondary: PortalNotification[],
): PortalNotification[] {
  const seen = new Set<string>();
  const out: PortalNotification[] = [];
  for (const notification of [...primary, ...secondary]) {
    const key = notification.reference
      ? `${notification.type}:${notification.reference}`
      : notification.id;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(notification);
  }
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function hasNotificationForReference(
  partnerId: number,
  reference: string,
  type: PortalNotificationType,
): Promise<boolean> {
  if (!isDemoMode()) {
    const sent = await hasOdooNotificationSent(partnerId, reference, type);
    if (sent) return true;
  }
  return readStore().notifications.some(
    (notification) =>
      notification.partnerId === partnerId &&
      notification.reference === reference &&
      notification.type === type,
  );
}

/** Claim send rights before emailing — prevents duplicate spam under concurrent polls. */
export async function claimNotificationSend(
  partnerId: number,
  reference: string,
  type: PortalNotificationType,
): Promise<boolean> {
  return claimOdooNotificationSend(partnerId, reference, type);
}

export async function markNotificationSent(
  partnerId: number,
  reference: string,
  type: PortalNotificationType,
): Promise<void> {
  await markOdooNotificationSent(partnerId, reference, type);
}

export async function createPortalNotification(input: {
  partnerId: number;
  actorId?: string;
  title: string;
  detail: string;
  status: PortalNotificationStatus;
  type: PortalNotificationType;
  reference?: string;
}): Promise<PortalNotification> {
  const now = new Date().toISOString();
  const notification: PortalNotification = {
    id: randomUUID(),
    partnerId: input.partnerId,
    actorId: input.actorId,
    title: input.title,
    detail: input.detail,
    status: input.status,
    type: input.type,
    reference: input.reference,
    read: false,
    createdAt: now,
  };

  if (input.reference) {
    await markNotificationSent(input.partnerId, input.reference, input.type);
  }

  const store = readStore();
  store.notifications.unshift(notification);
  store.notifications = store.notifications.slice(0, 500);
  writeStore(store);

  return notification;
}

export function listNotificationsForPartner(partnerId: number, limit = 20): PortalNotification[] {
  return readStore()
    .notifications.filter((notification) => notification.partnerId === partnerId)
    .slice(0, limit);
}
