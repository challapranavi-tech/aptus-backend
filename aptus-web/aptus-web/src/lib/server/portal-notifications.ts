import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type {
  PortalNotification,
  PortalNotificationStatus,
  PortalNotificationType,
} from "@/types/notifications";

const DATA_DIR = path.join(process.cwd(), ".data");
const NOTIFICATIONS_FILE = path.join(DATA_DIR, "portal-notifications.json");

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

export function hasNotificationForReference(
  partnerId: number,
  reference: string,
  type: PortalNotificationType,
): boolean {
  return readStore().notifications.some(
    (notification) =>
      notification.partnerId === partnerId &&
      notification.reference === reference &&
      notification.type === type,
  );
}

export function createPortalNotification(input: {
  partnerId: number;
  actorId?: string;
  title: string;
  detail: string;
  status: PortalNotificationStatus;
  type: PortalNotificationType;
  reference?: string;
}): PortalNotification {
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

  const store = readStore();
  store.notifications.unshift(notification);
  store.notifications = store.notifications.slice(0, 200);
  writeStore(store);
  return notification;
}

export function listNotificationsForPartner(partnerId: number, limit = 20): PortalNotification[] {
  return readStore()
    .notifications.filter((notification) => notification.partnerId === partnerId)
    .slice(0, limit);
}
