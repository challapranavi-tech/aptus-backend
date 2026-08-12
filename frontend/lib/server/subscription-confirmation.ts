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
import { advancePurchaseCrmLeadStage } from "./odoo/leads";
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
 * Notify customer after Finance/CRM verifies payment (portal status → Payment Verified).
 * Deduped via KV so Odoo-driven fetch sync and admin verify-payment share one email.
 */
export async function notifyPurchaseApprovedIfNeeded(
  order: PortalOrder,
  triggeredBy?: string,
): Promise<{ notified: boolean; emailSent: boolean }> {
  const stage = (order.crmStage ?? "").toLowerCase();
  const paymentVerified =
    order.paymentStatus === "paid" ||
    order.status === "Completed" ||
    stage.includes("payment confirmation") ||
    stage.includes("license issued") ||
    stage.includes("won");

  if (!paymentVerified) {
    return { notified: false, emailSent: false };
  }

  // If the license is already issued, the License Issued email covers this step —
  // do not also send Payment Verified for the same moment.
  if (order.licenseIssued || stage.includes("license issued") || stage.includes("won")) {
    await claimOrderEmail(order, "purchase_approved");
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
    title: "Payment Verified",
    detail:
      "Your payment has been verified successfully. Your software license will be issued within 2–3 business days.",
    status: "Payment Verified",
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
    const stage = (order.crmStage ?? "").toLowerCase();
    if (
      order.paymentStatus === "paid" ||
      order.status === "Completed" ||
      stage.includes("payment confirmation") ||
      stage.includes("license issued") ||
      stage.includes("won")
    ) {
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
 * (deduped via KV), advance CRM to License Issued, and create a portal notification.
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

  const advancedLeadIds = new Set<number>();
  let ordersBySaleId: Map<number, PortalOrder> | null = null;

  async function leadIdForSaleOrder(saleOrderId: number): Promise<number | null> {
    if (!ordersBySaleId) {
      try {
        const { fetchPartnerOrders } = await import("./odoo/orders");
        const orders = await fetchPartnerOrders(partnerId);
        ordersBySaleId = new Map(
          orders
            .filter((order) => order.saleOrderId != null)
            .map((order) => [order.saleOrderId!, order]),
        );
      } catch {
        ordersBySaleId = new Map();
      }
    }
    return ordersBySaleId.get(saleOrderId)?.leadId ?? null;
  }

  for (const item of withKeys) {
    const reference = licenseReference(item);
    if (!(await claimNotificationSend(partnerId, reference, "license_available"))) {
      continue;
    }

    if (item.orderId != null) {
      const leadId = await leadIdForSaleOrder(item.orderId);
      if (leadId != null && !advancedLeadIds.has(leadId)) {
        advancedLeadIds.add(leadId);
        await advancePurchaseCrmLeadStage({
          leadId,
          stage: "license_issued",
        }).catch((error: unknown) => {
          logger.warn("Failed to advance CRM to License Issued", {
            action: "crm.lead.advance_stage",
            partnerId,
            leadId,
            orderId: item.orderId,
            error: error instanceof Error ? error.message : String(error),
          });
        });
      }
    }

    const emailContent = formatLicenseAvailableEmail({
      customerName: customer.name,
      productName: item.productName,
      licenseKey: item.licenseKey!,
      expiryDate:
        item.expiryDate && item.expiryDate !== "—"
          ? item.expiryDate
          : item.renewalDate && item.renewalDate !== "—"
            ? item.renewalDate
            : undefined,
      activationDate:
        item.purchaseDate && item.purchaseDate !== "—" ? item.purchaseDate : undefined,
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
      title: "License Issued",
      detail:
        "Your software license has been issued successfully. You can now view your license details in your customer portal.",
      status: "License Issued",
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

    logger.info("License issued notification sent", {
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
