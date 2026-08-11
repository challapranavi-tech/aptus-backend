import { randomUUID } from "crypto";
import { writeAudit } from "./audit-log";
import { sendPortalEmail } from "./mail-service";
import { logger } from "./logger";
import { kvGet, kvSet, kvSetNx } from "./kv-store";
import {
  formatLicenseExpiredEmail,
  formatRenewalConfirmationEmail,
  formatRenewalReminderEmail,
} from "./order-notification";
import {
  createPortalNotification,
  claimNotificationSend,
} from "./portal-notifications";
import { resolveCustomerContact } from "./auth-service";
import type { PortalRenewalRequest } from "@/types/renewals";
import type { SubscriptionItem } from "@/types/subscriptions";

/** Keep claims through the full reminder window (90d) plus buffer. */
const REMINDER_CLAIM_TTL_SEC = 120 * 24 * 60 * 60;
// Reminder records stored in KV: TTL slightly longer than the window so they
// survive long enough to deduplicate the full reminder cycle.
const REMINDER_RECORD_TTL_SEC = REMINDER_CLAIM_TTL_SEC + 7 * 24 * 60 * 60;

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

function remindersStoreKey(partnerId: number): string {
  return `aptus:renewal-reminders:${partnerId}`;
}

async function readRemindersStore(partnerId: number): Promise<RemindersStore> {
  try {
    const stored = await kvGet<RemindersStore>(remindersStoreKey(partnerId));
    if (stored && Array.isArray(stored.records)) return stored;
  } catch {
    // fall through to empty store
  }
  return { records: [] };
}

/**
 * Best-effort persistence — this runs as a side effect of GET /api/subscriptions,
 * so a transient KV outage must degrade to "reminder not recorded" rather than
 * failing the whole subscriptions request.
 */
async function writeRemindersStore(partnerId: number, store: RemindersStore): Promise<void> {
  // Trim to last 2000 records to keep KV value small
  const trimmed = { records: store.records.slice(-2000) };
  try {
    await kvSet(remindersStoreKey(partnerId), trimmed, REMINDER_RECORD_TTL_SEC);
  } catch (err) {
    logger.warn("Failed to persist renewal reminder records", {
      action: "renewal.reminder_store",
      partnerId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

function subscriptionKey(subscription: SubscriptionItem): string {
  const base =
    subscription.lineId != null
      ? `line-${subscription.lineId}`
      : subscription.orderId != null
        ? `order-${subscription.orderId}`
        : `product-${subscription.productName.toLowerCase()}`;
  const term = subscription.renewalDateIso?.trim();
  return term ? `${base}:${term}` : base;
}

/** Calendar days from local today to the renewal date (YYYY-MM-DD). */
export function daysUntilExpiry(renewalDateIso: string, now = Date.now()): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(renewalDateIso.trim());
  if (!match) return null;
  const endUtc = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  const nowDate = new Date(now);
  const startUtc = Date.UTC(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate());
  return Math.round((endUtc - startUtc) / 86_400_000);
}

/**
 * Pick the single schedule slot to fire for this poll.
 * Exact day match only — never catch up earlier buckets (that caused 5-minute spam).
 */
export function reminderDayDue(
  daysLeft: number,
  sentDays: ReadonlySet<number>,
): (typeof RENEWAL_REMINDER_DAYS)[number] | null {
  for (const reminderDay of RENEWAL_REMINDER_DAYS) {
    if (daysLeft === reminderDay && !sentDays.has(reminderDay)) {
      return reminderDay;
    }
  }
  return null;
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

function sentReminderDays(
  partnerId: number,
  key: string,
  records: ReminderRecord[],
): Set<number> {
  const sent = new Set<number>();
  for (const record of records) {
    if (record.partnerId === partnerId && record.subscriptionKey === key) {
      sent.add(record.reminderDay);
    }
  }
  return sent;
}

function reminderClaimKey(partnerId: number, key: string, reminderDay: number): string {
  return `aptus:renewal-reminder:${partnerId}:${key}:${reminderDay}`;
}

async function resolveCustomer(partnerId: number, actorId?: string): Promise<{
  email: string;
  name: string;
  actorId: string;
} | null> {
  return resolveCustomerContact(partnerId, actorId);
}

/** Send scheduled renewal reminder emails (90→1 days before expiry). Email only — no platform alert. */
export async function maybeSendRenewalReminders(
  subscriptions: SubscriptionItem[],
  partnerId: number,
): Promise<void> {
  const customer = await resolveCustomer(partnerId);
  if (!customer) return;

  const store = await readRemindersStore(partnerId);
  const portalUrl = getPortalBaseUrl();
  let dirty = false;

  for (const subscription of subscriptions) {
    if (subscription.status !== "Active" && subscription.status !== "Expiring Soon") continue;

    const renewalIso = subscription.renewalDateIso ?? "";
    const daysLeft = daysUntilExpiry(renewalIso);
    if (daysLeft == null || daysLeft <= 0) continue;

    const key = subscriptionKey(subscription);
    const sentDays = sentReminderDays(partnerId, key, store.records);
    const reminderDay = reminderDayDue(daysLeft, sentDays);
    if (reminderDay == null) continue;

    const claimed = await kvSetNx(
      reminderClaimKey(partnerId, key, reminderDay),
      new Date().toISOString(),
      REMINDER_CLAIM_TTL_SEC,
    );
    if (!claimed) continue;

    const emailContent = formatRenewalReminderEmail({
      customerName: customer.name,
      productName: subscription.productName,
      renewalDate: subscription.renewalDate,
      daysRemaining: reminderDay,
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
    dirty = true;

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
  }

  if (dirty) {
    await writeRemindersStore(partnerId, store);
  }
}

/** Sentinel reminderDay used to dedupe the single post-expiry email (Event 10) in the same store. */
const EXPIRED_SENTINEL_DAY = -1;

/**
 * Event 10 — License Expired. Sent exactly once per license term, after the license
 * has passed its expiry date and renewal reminders (Event 8) have stopped.
 */
export async function maybeSendLicenseExpiredEmails(
  subscriptions: SubscriptionItem[],
  partnerId: number,
): Promise<void> {
  const customer = await resolveCustomer(partnerId);
  if (!customer) return;

  const store = await readRemindersStore(partnerId);
  const portalUrl = getPortalBaseUrl();

  for (const subscription of subscriptions) {
    if (subscription.status !== "Expired") continue;

    const renewalIso = subscription.renewalDateIso ?? "";
    const daysLeft = daysUntilExpiry(renewalIso);
    if (daysLeft != null && daysLeft >= 0) continue;

    const key = subscriptionKey(subscription);
    if (wasReminderSent(partnerId, key, EXPIRED_SENTINEL_DAY, store.records)) continue;

    const emailContent = formatLicenseExpiredEmail({
      customerName: customer.name,
      productName: subscription.productName,
      expiryDate: subscription.expiryDate ?? subscription.renewalDate,
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
      reminderDay: EXPIRED_SENTINEL_DAY,
      sentAt: new Date().toISOString(),
    });

    if (result.sent) {
      writeAudit({
        action: "notification.email",
        actorId: customer.actorId,
        metadata: {
          type: "license_expired",
          productName: subscription.productName,
          to: customer.email,
          channel: result.channel,
        },
      });
      await createPortalNotification({
        partnerId,
        actorId: customer.actorId,
        title: "License expired",
        detail: `Your ${subscription.productName} license expired on ${
          subscription.expiryDate ?? subscription.renewalDate
        }. Renew to restore access.`,
        status: "Expired",
        type: "license_expired",
        reference: key,
      });
    } else {
      logger.warn("License expired email not sent", {
        action: "license.expired_notify",
        partnerId,
        productName: subscription.productName,
        error: result.error,
      });
    }
  }

  await writeRemindersStore(partnerId, store);
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

  if (!(await claimNotificationSend(request.partnerId, request.reference, "renewal"))) {
    return { notified: false, emailSent: false };
  }

  const customer = await resolveCustomer(request.partnerId, request.actorId);
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

  await createPortalNotification({
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
  previousByReference: Map<string, PortalRenewalRequest["status"]> | PortalRenewalRequest[],
  triggeredBy?: string,
): Promise<void> {
  const previousMap =
    previousByReference instanceof Map
      ? previousByReference
      : new Map(previousByReference.map((request) => [request.reference, request.status]));

  for (const request of requests) {
    if (request.status !== "Approved") continue;
    await notifyRenewalConfirmedIfNeeded(
      request,
      triggeredBy,
      previousMap.get(request.reference),
    );
  }
}

export const RENEWAL_SUBMITTED_MESSAGE =
  "Your renewal request has been submitted. Your subscription will be renewed within 48 hours.";
