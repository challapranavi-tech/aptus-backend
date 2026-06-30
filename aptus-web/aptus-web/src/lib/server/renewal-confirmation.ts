import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { writeAudit } from "./audit-log";
import { sendPortalEmail } from "./mail-service";
import { logger } from "./logger";
import {
  formatRenewalConfirmationEmail,
  formatRenewalReminderEmail,
} from "./order-notification";
import {
  createPortalNotification,
  hasNotificationForReference,
} from "./portal-notifications";
import { findPortalAccountByPartnerId, getPortalAccountById } from "./portal-accounts";
import type { PortalRenewalRequest } from "@/types/renewals";
import type { SubscriptionItem } from "@/types/subscriptions";

const DATA_DIR = path.join(process.cwd(), ".data");
const REMINDERS_FILE = path.join(DATA_DIR, "renewal-reminders-sent.json");

export const RENEWAL_REMINDER_DAYS = [90, 60, 30, 15, 7, 3, 1] as const;

type ReminderRecord = {
  id: string;
  partnerId: number;
  subscriptionKey: string;
  reminderDay: number;
  sentAt: string;
};

type RemindersStore = {
  records: ReminderRecord[];
};

function getPortalBaseUrl(): string {
  return (process.env.PORTAL_BASE_URL?.trim() || "https://aptusinfotech.com").replace(/\/$/, "");
}

function readRemindersStore(): RemindersStore {
  if (!fs.existsSync(REMINDERS_FILE)) return { records: [] };
  try {
    const parsed = JSON.parse(fs.readFileSync(REMINDERS_FILE, "utf8")) as RemindersStore;
    return { records: Array.isArray(parsed.records) ? parsed.records : [] };
  } catch {
    return { records: [] };
  }
}

function writeRemindersStore(store: RemindersStore): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(REMINDERS_FILE, JSON.stringify(store, null, 2), "utf8");
}

function subscriptionKey(subscription: SubscriptionItem): string {
  if (subscription.lineId != null) return `line-${subscription.lineId}`;
  if (subscription.orderId != null) return `order-${subscription.orderId}`;
  return `product-${subscription.productName.toLowerCase()}`;
}

function daysUntilExpiry(renewalDateIso: string): number | null {
  if (!renewalDateIso) return null;
  const end = new Date(`${renewalDateIso}T23:59:59`);
  if (Number.isNaN(end.getTime())) return null;
  const ms = end.getTime() - Date.now();
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

function wasReminderSent(
  partnerId: number,
  key: string,
  reminderDay: number,
  records: ReminderRecord[],
): boolean {
  return records.some(
    (record) =>
      record.partnerId === partnerId &&
      record.subscriptionKey === key &&
      record.reminderDay === reminderDay,
  );
}

function resolveCustomer(partnerId: number, actorId?: string): {
  email: string;
  name: string;
  actorId: string;
} | null {
  if (actorId) {
    const account = getPortalAccountById(actorId);
    if (account) {
      return { email: account.email, name: account.profile.name, actorId: account.id };
    }
  }
  const account = findPortalAccountByPartnerId(partnerId);
  if (!account) return null;
  return { email: account.email, name: account.profile.name, actorId: account.id };
}

/** Send scheduled renewal reminder emails (90→1 days before expiry). Email only — no platform alert. */
export async function maybeSendRenewalReminders(
  subscriptions: SubscriptionItem[],
  partnerId: number,
): Promise<void> {
  const customer = resolveCustomer(partnerId);
  if (!customer) return;

  const store = readRemindersStore();
  const portalUrl = getPortalBaseUrl();

  for (const subscription of subscriptions) {
    if (subscription.status !== "Active" && subscription.status !== "Expiring Soon") continue;

    const renewalIso = subscription.renewalDateIso ?? "";
    const daysLeft = daysUntilExpiry(renewalIso);
    if (daysLeft == null || daysLeft < 0) continue;

    const key = subscriptionKey(subscription);

    for (const reminderDay of RENEWAL_REMINDER_DAYS) {
      if (daysLeft > reminderDay) continue;
      if (wasReminderSent(partnerId, key, reminderDay, store.records)) continue;

      const emailContent = formatRenewalReminderEmail({
        customerName: customer.name,
        productName: subscription.productName,
        renewalDate: subscription.renewalDate,
        daysRemaining: Math.max(daysLeft, 1),
        portalUrl,
      });

      const result = await sendPortalEmail({
        to: customer.email,
        subject: emailContent.subject,
        body: emailContent.body,
      });

      store.records.push({
        id: randomUUID(),
        partnerId,
        subscriptionKey: key,
        reminderDay,
        sentAt: new Date().toISOString(),
      });

      if (result.sent) {
        writeAudit({
          action: "notification.email",
          actorId: customer.actorId,
          metadata: {
            type: "renewal_reminder",
            reminderDay,
            productName: subscription.productName,
            to: customer.email,
            channel: result.channel,
          },
        });
      } else {
        logger.warn("Renewal reminder email not sent", {
          action: "renewal.reminder",
          partnerId,
          productName: subscription.productName,
          reminderDay,
          error: result.error,
        });
      }

      break;
    }
  }

  store.records = store.records.slice(-2000);
  writeRemindersStore(store);
}

/** Notify customer after backend confirms a renewal request (not on submit). */
export async function notifyRenewalConfirmedIfNeeded(
  request: PortalRenewalRequest,
  triggeredBy?: string,
  previousStatus?: PortalRenewalRequest["status"],
): Promise<{ notified: boolean; emailSent: boolean }> {
  if (request.status !== "Approved") {
    return { notified: false, emailSent: false };
  }

  if (previousStatus === "Approved" || previousStatus === "Rejected") {
    return { notified: false, emailSent: false };
  }

  if (hasNotificationForReference(request.partnerId, request.reference, "renewal")) {
    return { notified: false, emailSent: false };
  }

  const customer = resolveCustomer(request.partnerId, request.actorId);
  if (!customer) {
    return { notified: false, emailSent: false };
  }

  const emailContent = formatRenewalConfirmationEmail({
    customerName: customer.name,
    productName: request.productName,
    reference: request.reference,
    portalUrl: getPortalBaseUrl(),
  });

  const emailResult = await sendPortalEmail({
    to: customer.email,
    subject: emailContent.subject,
    body: emailContent.body,
  });

  createPortalNotification({
    partnerId: request.partnerId,
    actorId: customer.actorId,
    title: "Renewal confirmed",
    detail: `Your renewal for ${request.productName} (${request.reference}) has been confirmed. Your subscription is now active.`,
    status: "Confirmed",
    type: "renewal",
    reference: request.reference,
  });

  writeAudit({
    action: "notification.platform",
    actorId: triggeredBy ?? customer.actorId,
    targetId: request.id,
    metadata: {
      reference: request.reference,
      type: "renewal_confirmed",
      productName: request.productName,
    },
  });

  if (emailResult.sent) {
    writeAudit({
      action: "notification.email",
      actorId: triggeredBy ?? customer.actorId,
      targetId: request.id,
      metadata: {
        subject: emailContent.subject,
        to: customer.email,
        channel: emailResult.channel,
        reference: request.reference,
        type: "renewal_confirmed",
      },
    });
  }

  return { notified: true, emailSent: emailResult.sent };
}

export async function maybeNotifyConfirmedRenewals(
  requests: PortalRenewalRequest[],
  localRequests: PortalRenewalRequest[],
  triggeredBy?: string,
): Promise<void> {
  const localByReference = new Map(localRequests.map((request) => [request.reference, request]));
  const localByLeadId = new Map(
    localRequests
      .filter((request) => request.leadId != null)
      .map((request) => [request.leadId as number, request]),
  );

  for (const request of requests) {
    if (request.status !== "Approved") continue;

    const local =
      localByReference.get(request.reference) ??
      (request.leadId != null ? localByLeadId.get(request.leadId) : undefined);

    await notifyRenewalConfirmedIfNeeded(request, triggeredBy, local?.status);
  }
}

export const RENEWAL_SUBMITTED_MESSAGE =
  "Your renewal request has been submitted. Your subscription will be renewed within 48 hours.";
