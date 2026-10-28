import { randomUUID } from "crypto";
import { writeAudit } from "./audit-log";
import { resolveCustomerContact } from "./auth-service";
import { getOrderNotificationEmail, getPortalBaseUrl } from "./config";
import { fetchPartnerSubscriptions } from "./odoo/subscriptions";
import { logger } from "./logger";
import { kvDel, kvGet, kvSet, kvSetNx } from "./kv-store";
import {
  formatLicenseExpiredEmail,
  formatLicenseExpiredInternalEmail,
  formatRenewalConfirmationEmail,
  formatRenewalReminderEmail,
} from "./order-notification";
import {
  createPortalNotification,
} from "./portal-notifications";
import { sendPortalEmail } from "./mail-service";
import type { PortalRenewalRequest } from "@/types/renewals";
import type { SubscriptionItem } from "@/types/subscriptions";

/** Keep interval claims through the full reminder window (90d) plus buffer. */
const REMINDER_CLAIM_TTL_SEC = 120 * 24 * 60 * 60;
const REMINDER_RECORD_TTL_SEC = REMINDER_CLAIM_TTL_SEC + 7 * 24 * 60 * 60;
/** Expired is once-per-license-term — outlive any subscription term. */
const LICENSE_EXPIRED_CLAIM_TTL_SEC = 3 * 365 * 24 * 60 * 60;

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

async function writeRemindersStore(partnerId: number, store: RemindersStore): Promise<void> {
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

/**
 * Stable dedupe identity — lineId when Odoo provides it (never include renewal
 * date; end_date corrections must not reset sent flags).
 */
export function subscriptionDedupeKey(subscription: SubscriptionItem): string {
  if (subscription.lineId != null) return `line-${subscription.lineId}`;
  if (subscription.orderId != null) return `order-${subscription.orderId}`;
  return `product-${subscription.productName.toLowerCase()}`;
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

/** Exact day match only — never catch up earlier buckets. */
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

function licenseExpiredClaimKey(partnerId: number, key: string): string {
  return `aptus:license-expired:${partnerId}:${key}`;
}

function licenseExpiredInternalClaimKey(partnerId: number, key: string): string {
  return `aptus:license-expired-internal:${partnerId}:${key}`;
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
): Promise<number> {
  const customer = await resolveCustomer(partnerId);
  if (!customer) return 0;

  const store = await readRemindersStore(partnerId);
  const portalUrl = getPortalBaseUrl();
  let sentCount = 0;
  let dirty = false;

  for (const subscription of subscriptions) {
    if (subscription.status !== "Active" && subscription.status !== "Expiring Soon") continue;

    const renewalIso = subscription.renewalDateIso ?? "";
    const daysLeft = daysUntilExpiry(renewalIso);
    if (daysLeft == null || daysLeft <= 0) continue;

    const key = subscriptionDedupeKey(subscription);
    const sentDays = sentReminderDays(partnerId, key, store.records);
    const reminderDay = reminderDayDue(daysLeft, sentDays);
    if (reminderDay == null) continue;

    const claimKey = reminderClaimKey(partnerId, key, reminderDay);
    const claimed = await kvSetNx(claimKey, new Date().toISOString(), REMINDER_CLAIM_TTL_SEC);
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

    if (!result.sent) {
      await kvDel(claimKey);
      logger.warn("Renewal reminder email not sent", {
        action: "renewal.reminder",
        partnerId,
        productName: subscription.productName,
        reminderDay,
        error: result.error,
      });
      continue;
    }

    store.records.push({
      id: randomUUID(),
      partnerId,
      subscriptionKey: key,
      reminderDay,
      sentAt: new Date().toISOString(),
    });
    dirty = true;
    sentCount += 1;

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
  }

  if (dirty) {
    await writeRemindersStore(partnerId, store);
  }

  return sentCount;
}

const EXPIRED_SENTINEL_DAY = -1;

/**
 * License expired — sent exactly once per license when status first becomes Expired.
 * Atomic KV claim before send; unrelated email flows must not call this.
 */
export async function maybeSendLicenseExpiredEmails(
  subscriptions: SubscriptionItem[],
  partnerId: number,
): Promise<number> {
  const customer = await resolveCustomer(partnerId);
  if (!customer) return 0;

  const store = await readRemindersStore(partnerId);
  const portalUrl = getPortalBaseUrl();
  let sentCount = 0;
  let dirty = false;

  for (const subscription of subscriptions) {
    if (subscription.status !== "Expired") continue;

    const renewalIso = subscription.renewalDateIso ?? "";
    const daysLeft = daysUntilExpiry(renewalIso);
    if (daysLeft != null && daysLeft >= 0) continue;

    const key = subscriptionDedupeKey(subscription);
    if (wasReminderSent(partnerId, key, EXPIRED_SENTINEL_DAY, store.records)) continue;

    const claimKey = licenseExpiredClaimKey(partnerId, key);
    const claimed = await kvSetNx(claimKey, new Date().toISOString(), LICENSE_EXPIRED_CLAIM_TTL_SEC);
    if (!claimed) continue;

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

    if (!result.sent) {
      await kvDel(claimKey);
      logger.warn("License expired email not sent", {
        action: "license.expired_notify",
        partnerId,
        productName: subscription.productName,
        error: result.error,
      });
      continue;
    }

    store.records.push({
      id: randomUUID(),
      partnerId,
      subscriptionKey: key,
      reminderDay: EXPIRED_SENTINEL_DAY,
      sentAt: new Date().toISOString(),
    });
    dirty = true;
    sentCount += 1;

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

    const internalClaimKey = licenseExpiredInternalClaimKey(partnerId, key);
    if (await kvSetNx(internalClaimKey, new Date().toISOString(), LICENSE_EXPIRED_CLAIM_TTL_SEC)) {
      const internalMail = formatLicenseExpiredInternalEmail({
        customerName: customer.name,
        customerEmail: customer.email,
        productName: subscription.productName,
        expiryDate: subscription.expiryDate ?? subscription.renewalDate,
        subscriptionKey: key,
      });
      const internalResult = await sendPortalEmail({
        to: getOrderNotificationEmail(),
        subject: internalMail.subject,
        body: internalMail.body,
        replyTo: customer.email,
      });
      if (internalResult.sent) {
        writeAudit({
          action: "notification.email",
          actorId: customer.actorId,
          metadata: {
            type: "license_expired_internal",
            productName: subscription.productName,
            to: getOrderNotificationEmail(),
            channel: internalResult.channel,
          },
        });
      }
    }
  }

  if (dirty) {
    await writeRemindersStore(partnerId, store);
  }

  return sentCount;
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

  const { claimNotificationSend } = await import("./portal-notifications");
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
    status: "License Issued",
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

/** Daily cron entry — renewal reminders + expired alerts for all Odoo partners. */
export async function processAllSubscriptionReminders(): Promise<{
  partners: number;
  remindersSent: number;
  expiredSent: number;
}> {
  const { listPartnerIdsWithSubscriptions } = await import("./odoo/subscriptions");
  const { fetchPartnerOrders, listPartnerIdsWithPortalOrders } = await import("./odoo/orders");
  const { maybeNotifyLicensesAvailable, maybeNotifyWorkflowFromOdoo } = await import(
    "./subscription-confirmation"
  );

  const partnerIds = [
    ...new Set([
      ...(await listPartnerIdsWithSubscriptions()),
      ...(await listPartnerIdsWithPortalOrders()),
    ]),
  ];
  let remindersSent = 0;
  let expiredSent = 0;

  for (const partnerId of partnerIds) {
    try {
      const subscriptions = await fetchPartnerSubscriptions(partnerId, { includeInactive: true });
      remindersSent += await maybeSendRenewalReminders(subscriptions, partnerId);
      expiredSent += await maybeSendLicenseExpiredEmails(subscriptions, partnerId);
      await maybeNotifyLicensesAvailable(subscriptions, partnerId);
      const orders = await fetchPartnerOrders(partnerId);
      await maybeNotifyWorkflowFromOdoo(orders, "cron");
    } catch (error) {
      logger.warn("Subscription reminder cron failed for partner", {
        action: "cron.subscription_reminders",
        partnerId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { partners: partnerIds.length, remindersSent, expiredSent };
}

export const RENEWAL_SUBMITTED_MESSAGE =
  "Your renewal request has been submitted. Your subscription will be renewed within 48 hours.";
