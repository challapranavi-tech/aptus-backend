import { writeAudit } from "./audit-log";
import { getOrderNotificationEmail } from "./config";
import {
  formatLicenseAvailableEmail,
  formatOrderApprovedEmail,
  formatPaymentFailedEmail,
  formatPaymentFailedInternalEmail,
  formatPurchaseApprovedEmail,
  formatPurchaseDeclinedEmail,
} from "./order-notification";
import { sendPortalEmail } from "./mail-service";
import { logger } from "./logger";
import {
  claimNotificationSend,
  createPortalNotification,
  markNotificationSent,
} from "./portal-notifications";
import { resolveCustomerContact } from "./auth-service";
import type { PortalOrder } from "@/types/orders";
import type { PortalNotificationType } from "@/types/notifications";
import type { SubscriptionItem } from "@/types/subscriptions";

function getPortalBaseUrl(): string {
  return (process.env.PORTAL_BASE_URL?.trim() || "https://aptusinfotech.com").replace(/\/$/, "");
}

/**
 * Stable claim id so LEAD + linked SO for the same purchase share one email.
 * Prefer CRM lead id when present (portal orders start as leads).
 */
export function orderNotificationClaimRef(
  order: Pick<PortalOrder, "reference" | "leadId" | "saleOrderId">,
): string {
  if (order.leadId != null) return `LEAD-${order.leadId}`;
  if (order.saleOrderId != null) return `SO-${order.saleOrderId}`;
  return order.reference;
}

export function orderNotificationAliases(
  order: Pick<PortalOrder, "id" | "reference" | "leadId" | "saleOrderId">,
): string[] {
  const aliases = new Set<string>([orderNotificationClaimRef(order), order.reference]);
  if (order.leadId != null) {
    aliases.add(`LEAD-${order.leadId}`);
    aliases.add(`odoo-lead-${order.leadId}`);
  }
  if (order.saleOrderId != null) {
    aliases.add(`SO-${order.saleOrderId}`);
    aliases.add(`odoo-so-${order.saleOrderId}`);
  }
  if (order.id) aliases.add(order.id);
  return [...aliases];
}

/** Claim once before sending; marks LEAD/SO aliases so concurrent polls cannot double-email. */
async function claimOrderEmail(
  order: PortalOrder,
  type: PortalNotificationType,
): Promise<boolean> {
  const primary = orderNotificationClaimRef(order);
  const claimed = await claimNotificationSend(order.partnerId, primary, type);
  if (!claimed) return false;
  for (const alias of orderNotificationAliases(order)) {
    if (alias !== primary) {
      await markNotificationSent(order.partnerId, alias, type);
    }
  }
  return true;
}

async function resolveOrderCustomer(order: PortalOrder): Promise<{
  email: string;
  name: string;
  actorId: string;
} | null> {
  return resolveCustomerContact(order.partnerId, order.actorId);
}

/** Notify customer that their request was approved and payment is now required. */
export async function notifyOrderApprovedIfNeeded(
  order: PortalOrder,
  triggeredBy?: string,
  previousStatus?: PortalOrder["status"],
): Promise<{ notified: boolean; emailSent: boolean }> {
  if (order.status !== "Approved" || order.paymentStatus === "paid" || order.paymentStatus === "failed") {
    return { notified: false, emailSent: false };
  }

  const pendingStatuses: PortalOrder["status"][] = ["Submitted", "Under Review"];
  if (
    previousStatus &&
    !pendingStatuses.includes(previousStatus) &&
    previousStatus !== "Approved"
  ) {
    return { notified: false, emailSent: false };
  }

  if (previousStatus === "Approved" || previousStatus === "Completed") {
    return { notified: false, emailSent: false };
  }

  if (!(await claimOrderEmail(order, "order_approved"))) {
    return { notified: false, emailSent: false };
  }

  const customer = await resolveOrderCustomer(order);
  if (!customer) {
    logger.warn("Order approval notification skipped — no portal account for order", {
      action: "order.approve_notify",
      reference: order.reference,
      partnerId: order.partnerId,
      actorId: order.actorId,
    });
    return { notified: false, emailSent: false };
  }

  const products = order.items.map((item) => item.productName);
  const emailContent = formatOrderApprovedEmail({
    customerName: customer.name,
    reference: order.reference,
    products,
    duration: order.duration,
    portalUrl: getPortalBaseUrl(),
  });

  const emailResult = await sendPortalEmail({
    to: customer.email,
    subject: emailContent.subject,
    body: emailContent.body,
  });

  const notification = await createPortalNotification({
    partnerId: order.partnerId,
    actorId: customer.actorId,
    title: "Request approved — payment required",
    detail: `Your request ${order.reference} has been approved. Sign in to Purchases and click Make Payment to complete your order.`,
    status: "Approved",
    type: "order_approved",
    reference: order.reference,
  });

  writeAudit({
    action: "notification.platform",
    actorId: triggeredBy ?? customer.actorId,
    targetId: order.id,
    metadata: {
      reference: order.reference,
      notificationId: notification.id,
      partnerId: order.partnerId,
      type: "order_approved",
    },
  });

  if (emailResult.sent) {
    writeAudit({
      action: "notification.email",
      actorId: triggeredBy ?? customer.actorId,
      targetId: order.id,
      metadata: {
        subject: emailContent.subject,
        to: customer.email,
        channel: emailResult.channel,
        reference: order.reference,
        type: "order_approved",
      },
    });
  }

  return { notified: true, emailSent: emailResult.sent };
}

/**
 * Notify customer after Finance/CRM verifies payment (portal status → Purchased).
 * Deduped via KV so Odoo-driven fetch sync and admin verify-payment share one email.
 */
export async function notifyPurchaseApprovedIfNeeded(
  order: PortalOrder,
  triggeredBy?: string,
): Promise<{ notified: boolean; emailSent: boolean }> {
  if (order.paymentStatus !== "paid" && order.status !== "Completed") {
    return { notified: false, emailSent: false };
  }

  if (!(await claimOrderEmail(order, "purchase_approved"))) {
    return { notified: false, emailSent: false };
  }

  const customer = await resolveOrderCustomer(order);
  if (!customer) {
    return { notified: false, emailSent: false };
  }

  const products = order.items.map((item) => item.productName);
  const emailContent = formatPurchaseApprovedEmail({
    customerName: customer.name,
    reference: order.reference,
    products,
    duration: order.duration,
    portalUrl: getPortalBaseUrl(),
  });

  const emailResult = await sendPortalEmail({
    to: customer.email,
    subject: emailContent.subject,
    body: emailContent.body,
  });

  const notification = await createPortalNotification({
    partnerId: order.partnerId,
    actorId: customer.actorId,
    title: "Purchased",
    detail: `Your order ${order.reference} has been successfully processed. ${products.join(", ") || "Your products"} ${products.length === 1 ? "is" : "are"} now active.`,
    status: "Confirmed",
    type: "purchase_approved",
    reference: order.reference,
  });

  writeAudit({
    action: "notification.platform",
    actorId: triggeredBy ?? customer.actorId,
    targetId: order.id,
    metadata: {
      reference: order.reference,
      notificationId: notification.id,
      partnerId: order.partnerId,
      type: "purchase_approved",
    },
  });

  if (emailResult.sent) {
    writeAudit({
      action: "notification.email",
      actorId: triggeredBy ?? customer.actorId,
      targetId: order.id,
      metadata: {
        subject: emailContent.subject,
        to: customer.email,
        channel: emailResult.channel,
        reference: order.reference,
        type: "purchase_approved",
      },
    });
  }

  return { notified: true, emailSent: emailResult.sent };
}

/** @deprecated Prefer notifyPurchaseApprovedIfNeeded */
export async function notifySubscriptionConfirmedIfNeeded(
  order: PortalOrder,
  triggeredBy?: string,
): Promise<{ notified: boolean; emailSent: boolean }> {
  return notifyPurchaseApprovedIfNeeded(order, triggeredBy);
}

/** Notify customer when payment/request is declined (portal status → Rejected). */
export async function notifyOrderRejectedIfNeeded(
  order: PortalOrder,
  triggeredBy?: string,
): Promise<{ notified: boolean; emailSent: boolean }> {
  if (order.status !== "Rejected" && order.paymentStatus !== "failed") {
    return { notified: false, emailSent: false };
  }

  if (!(await claimOrderEmail(order, "order_rejected"))) {
    return { notified: false, emailSent: false };
  }

  const customer = await resolveOrderCustomer(order);
  if (!customer) {
    return { notified: false, emailSent: false };
  }

  const products = order.items.map((item) => item.productName);
  const emailContent = formatPurchaseDeclinedEmail({
    customerName: customer.name,
    reference: order.reference,
    products,
    reason: order.rejectReason,
    portalUrl: getPortalBaseUrl(),
  });

  const emailResult = await sendPortalEmail({
    to: customer.email,
    subject: emailContent.subject,
    body: emailContent.body,
  });

  const reasonSuffix = order.rejectReason?.trim()
    ? ` Reason: ${order.rejectReason.trim()}`
    : "";
  const notification = await createPortalNotification({
    partnerId: order.partnerId,
    actorId: customer.actorId,
    title: "Rejected",
    detail: `Your purchase request ${order.reference} was declined.${reasonSuffix}`,
    status: "Rejected",
    type: "order_rejected",
    reference: order.reference,
  });

  writeAudit({
    action: "notification.platform",
    actorId: triggeredBy ?? customer.actorId,
    targetId: order.id,
    metadata: {
      reference: order.reference,
      notificationId: notification.id,
      partnerId: order.partnerId,
      type: "order_rejected",
      reason: order.rejectReason,
    },
  });

  if (emailResult.sent) {
    writeAudit({
      action: "notification.email",
      actorId: triggeredBy ?? customer.actorId,
      targetId: order.id,
      metadata: {
        subject: emailContent.subject,
        to: customer.email,
        channel: emailResult.channel,
        reference: order.reference,
        type: "order_rejected",
      },
    });
  }

  return { notified: true, emailSent: emailResult.sent };
}

/**
 * Pull-sync notifier: when the portal reads latest Odoo state, fire any pending
 * customer emails/notifications (approved-for-payment, purchased, rejected).
 */
export async function maybeNotifyWorkflowFromOdoo(
  orders: PortalOrder[],
  triggeredBy?: string,
): Promise<void> {
  for (const order of orders) {
    if (order.status === "Approved" && order.paymentStatus !== "paid" && order.paymentStatus !== "failed") {
      await notifyOrderApprovedIfNeeded(order, triggeredBy);
    }
    if (order.paymentStatus === "paid" || order.status === "Completed") {
      await notifyPurchaseApprovedIfNeeded(order, triggeredBy);
    }
    if (order.status === "Rejected" || order.paymentStatus === "failed") {
      await notifyOrderRejectedIfNeeded(order, triggeredBy);
    }
  }
}

export async function maybeNotifyApprovedOrders(
  orders: PortalOrder[],
  previousByReference: Map<string, PortalOrder["status"]> | PortalOrder[],
  triggeredBy?: string,
): Promise<void> {
  const previousMap =
    previousByReference instanceof Map
      ? previousByReference
      : new Map(previousByReference.map((order) => [order.reference, order.status]));

  for (const order of orders) {
    if (order.status !== "Approved" || order.paymentStatus === "paid") continue;
    await notifyOrderApprovedIfNeeded(order, triggeredBy, previousMap.get(order.reference));
  }
}

/** @deprecated Use maybeNotifyWorkflowFromOdoo */
export async function maybeNotifyConfirmedOrders(
  orders: PortalOrder[],
  _localOrders: PortalOrder[],
  triggeredBy?: string,
): Promise<void> {
  await maybeNotifyWorkflowFromOdoo(orders, triggeredBy);
}

function licenseReference(item: SubscriptionItem): string {
  if (item.lineId != null) return `LIC-L${item.lineId}`;
  if (item.orderId != null) return `LIC-SO${item.orderId}`;
  return `LIC-${item.productName}`;
}

/**
 * When Odoo issues a license key on a sale order line, email the customer once
 * (deduped via KV) so they don't need to contact support.
 */
export async function maybeNotifyLicensesAvailable(
  subscriptions: SubscriptionItem[],
  partnerId: number,
  triggeredBy?: string,
): Promise<void> {
  const withKeys = subscriptions.filter((item) => item.licenseKey?.trim());
  if (!withKeys.length) return;

  const customer = await resolveCustomerContact(partnerId, triggeredBy);
  if (!customer) return;

  for (const item of withKeys) {
    const reference = licenseReference(item);
    if (!(await claimNotificationSend(partnerId, reference, "license_available"))) {
      continue;
    }

    const emailContent = formatLicenseAvailableEmail({
      customerName: customer.name,
      productName: item.productName,
      licenseKey: item.licenseKey,
      expiryDate:
        item.expiryDate && item.expiryDate !== "—"
          ? item.expiryDate
          : item.renewalDate && item.renewalDate !== "—"
            ? item.renewalDate
            : undefined,
      downloadUrl: item.downloadUrl,
      portalUrl: getPortalBaseUrl(),
    });

    const emailResult = await sendPortalEmail({
      to: customer.email,
      subject: emailContent.subject,
      body: emailContent.body,
    });

    const notification = await createPortalNotification({
      partnerId,
      actorId: customer.actorId,
      title: "License Available",
      detail: `Your ${item.productName} license is ready in Subscriptions.`,
      status: "Confirmed",
      type: "license_available",
      reference,
    });

    writeAudit({
      action: "notification.platform",
      actorId: triggeredBy ?? customer.actorId,
      targetId: String(item.lineId ?? item.orderId ?? ""),
      metadata: {
        reference,
        notificationId: notification.id,
        partnerId,
        type: "license_available",
        productName: item.productName,
      },
    });

    if (emailResult.sent) {
      writeAudit({
        action: "notification.email",
        actorId: triggeredBy ?? customer.actorId,
        targetId: String(item.lineId ?? item.orderId ?? ""),
        metadata: {
          subject: emailContent.subject,
          to: customer.email,
          channel: emailResult.channel,
          reference,
          type: "license_available",
        },
      });
    }

    logger.info("License available notification sent", {
      action: "license.available_notify",
      partnerId,
      reference,
      emailSent: emailResult.sent,
    });
  }
}

/**
 * Event 14 (customer) + Internal Alert D (Software Team) — Payment Failed.
 * Best-effort: never throws back to the webhook handler.
 */
export async function notifyPaymentFailed(input: {
  partnerId?: number;
  actorId?: string;
  reference: string;
  amount: string;
  reason?: string;
}): Promise<void> {
  try {
    // Claim before any send — webhook retries must not spam the customer.
    if (input.partnerId) {
      const claimed = await claimNotificationSend(
        input.partnerId,
        input.reference,
        "payment_failed",
      );
      if (!claimed) return;
    }

    const customer = await resolveCustomerContact(input.partnerId, input.actorId);

    if (customer?.email) {
      const customerMail = formatPaymentFailedEmail({
        customerName: customer.name,
        reference: input.reference,
        amount: input.amount,
        reason: input.reason,
        portalUrl: getPortalBaseUrl(),
      });

      const result = await sendPortalEmail({
        to: customer.email,
        subject: customerMail.subject,
        body: customerMail.body,
      });

      if (result.sent) {
        writeAudit({
          action: "notification.email",
          actorId: customer.actorId,
          metadata: {
            subject: customerMail.subject,
            to: customer.email,
            channel: result.channel,
            reference: input.reference,
            type: "payment_failed",
          },
        });
      } else {
        logger.warn("Payment failed email not sent", {
          action: "payment.failed_notify",
          reference: input.reference,
          error: result.error,
        });
      }

      if (input.partnerId) {
        await createPortalNotification({
          partnerId: input.partnerId,
          actorId: customer.actorId,
          title: "Payment failed",
          detail: `Your payment for order ${input.reference} was not successful. Please retry from Purchases.`,
          status: "Failed",
          type: "payment_failed",
          reference: input.reference,
        });
      }
    }

    const internalMail = formatPaymentFailedInternalEmail({
      customerName: customer?.name ?? "Unknown customer",
      customerEmail: customer?.email ?? "—",
      reference: input.reference,
      amount: input.amount,
      reason: input.reason,
    });

    const internalResult = await sendPortalEmail({
      to: getOrderNotificationEmail(),
      subject: internalMail.subject,
      body: internalMail.body,
      replyTo: customer?.email,
    });

    if (internalResult.sent) {
      writeAudit({
        action: "notification.email",
        actorId: customer?.actorId,
        metadata: {
          subject: internalMail.subject,
          to: getOrderNotificationEmail(),
          channel: internalResult.channel,
          reference: input.reference,
          type: "payment_failed_internal",
        },
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn("Payment failed notification failed", {
      action: "payment.failed_notify",
      error: message,
      reference: input.reference,
    });
  }
}
