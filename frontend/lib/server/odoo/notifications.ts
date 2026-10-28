import { kvGet, kvSet, kvSetNx } from "../kv-store";
import { fetchPartnerOrders } from "./orders";
import { fetchPartnerQuotes } from "./quotes";
import { fetchPartnerRenewalRequests } from "./renewal-requests";
import { fetchPartnerSubscriptions } from "./subscriptions";
import type {
  PortalNotification,
  PortalNotificationStatus,
  PortalNotificationType,
} from "@/types/notifications";
import type { QuoteLifecycleStatus } from "@/types/quotes";

const SENT_TTL_SEC = 90 * 24 * 60 * 60;

function sentKey(partnerId: number, reference: string, type: PortalNotificationType): string {
  return `aptus:notif-sent:${partnerId}:${type}:${reference}`;
}

/** Email/platform send dedupe — KV only, not a portal content store. */
export async function hasNotificationForReference(
  partnerId: number,
  reference: string,
  type: PortalNotificationType,
): Promise<boolean> {
  return Boolean(await kvGet<boolean>(sentKey(partnerId, reference, type)));
}

export async function markNotificationSent(
  partnerId: number,
  reference: string,
  type: PortalNotificationType,
): Promise<void> {
  await kvSet(sentKey(partnerId, reference, type), true, SENT_TTL_SEC);
}

/**
 * Atomically claim the right to send this notification.
 * Returns false when another caller already claimed or sent — call before emailing.
 */
export async function claimNotificationSend(
  partnerId: number,
  reference: string,
  type: PortalNotificationType,
): Promise<boolean> {
  return kvSetNx(sentKey(partnerId, reference, type), true, SENT_TTL_SEC);
}

/**
 * Build in-app notifications from live Odoo order / quote / renewal state.
 * No local notification JSON — Odoo records are the source of truth.
 */
export async function fetchPartnerNotifications(
  partnerId: number,
  limit = 100,
  partnerEmail?: string,
): Promise<PortalNotification[]> {
  const [orders, renewals, subscriptions, quotes] = await Promise.all([
    fetchPartnerOrders(partnerId),
    fetchPartnerRenewalRequests(partnerId),
    fetchPartnerSubscriptions(partnerId, { includeInactive: true }),
    fetchPartnerQuotes(partnerId, partnerEmail),
  ]);

  const notifications: PortalNotification[] = [];

  for (const quote of quotes) {
    notifications.push(...notificationsForQuote(partnerId, quote));
  }

  for (const order of orders) {
    if (order.status === "Approved" && order.paymentStatus !== "paid") {
      notifications.push({
        id: `odoo-notif-order-approved-${order.reference}`,
        partnerId,
        title: "Request approved — payment required",
        detail: `Your request ${order.reference} has been approved. Sign in to Purchases and click Make Payment to complete your order.`,
        status: "Approved",
        type: "order_approved",
        reference: order.reference,
        read: false,
        createdAt: order.updatedAt || order.createdAt,
      });
    }

    if (order.paymentStatus === "pending_verification") {
      notifications.push({
        id: `odoo-notif-order-verify-${order.reference}`,
        partnerId,
        title: "Payment Verification Pending",
        detail: `We received your payment proof for ${order.reference}. Finance will confirm within 2–3 business days.`,
        status: "Payment Verification Pending",
        type: "order",
        reference: order.reference,
        read: false,
        createdAt: order.updatedAt || order.createdAt,
      });
    }

    if (order.paymentStatus === "paid" || order.status === "Completed") {
      if (order.licenseIssued) {
        notifications.push({
          id: `odoo-notif-order-licensed-${order.reference}`,
          partnerId,
          title: "License Issued",
          detail:
            "Your software license has been issued successfully. You can now view your license details in your customer portal.",
          status: "License Issued",
          type: "license_available",
          reference: order.reference,
          read: false,
          createdAt: order.updatedAt || order.createdAt,
        });
      } else {
        notifications.push({
          id: `odoo-notif-order-paid-${order.reference}`,
          partnerId,
          title: "Payment Verified",
          detail:
            "Your payment has been verified successfully. Your software license will be issued within 2–3 business days.",
          status: "Payment Verified",
          type: "purchase_approved",
          reference: order.reference,
          read: false,
          createdAt: order.updatedAt || order.createdAt,
        });
      }
    }

    // Only show "submitted" notification after the customer has uploaded payment proof.
    // Before that (paymentStatus === "pending"), the order is awaiting payment — not yet
    // submitted for review, so no notification should appear yet.
    if (
      order.status === "Submitted" &&
      order.paymentStatus !== "pending"
    ) {
      notifications.push({
        id: `odoo-notif-order-submitted-${order.reference}`,
        partnerId,
        title: "Purchase request submitted",
        detail: `Your request ${order.reference} is under review. We typically respond within 48 hours.`,
        status: "Submitted",
        type: "order",
        reference: order.reference,
        read: false,
        createdAt: order.createdAt,
      });
    }

    if (order.status === "Rejected") {
      const reason = order.rejectReason?.trim();
      notifications.push({
        id: `odoo-notif-order-rejected-${order.reference}`,
        partnerId,
        title: "Rejected",
        detail: reason
          ? `Your purchase request ${order.reference} was declined. Reason: ${reason}`
          : `Your purchase request ${order.reference} was declined. Please contact support if you need help.`,
        status: "Rejected",
        type: "order_rejected",
        reference: order.reference,
        read: false,
        createdAt: order.updatedAt || order.createdAt,
      });
    } else if (order.paymentStatus === "failed") {
      notifications.push({
        id: `odoo-notif-order-payment-failed-${order.reference}`,
        partnerId,
        title: "Payment failed",
        detail: `Your payment for order ${order.reference} was not successful. Please retry from Purchases.`,
        status: "Failed",
        type: "payment_failed",
        reference: order.reference,
        read: false,
        createdAt: order.updatedAt || order.createdAt,
      });
    }
  }

  for (const renewal of renewals) {
    const status: PortalNotificationStatus =
      renewal.status === "Approved"
        ? "License Issued"
        : renewal.status === "Rejected"
          ? "Rejected"
          : "Submitted";
    notifications.push({
      id: `odoo-notif-renewal-${renewal.reference}`,
      partnerId,
      title:
        renewal.status === "Approved"
          ? "Renewal confirmed"
          : renewal.status === "Rejected"
            ? "Renewal not approved"
            : "Renewal request submitted",
      detail: `${renewal.productName} — ${renewal.reference}`,
      status,
      type: "renewal",
      reference: renewal.reference,
      read: false,
      createdAt: renewal.updatedAt || renewal.createdAt,
    });
  }

  for (const item of subscriptions) {
    if (!item.licenseKey?.trim()) continue;
    const reference =
      item.lineId != null
        ? `LIC-L${item.lineId}`
        : item.orderId != null
          ? `LIC-SO${item.orderId}`
          : `LIC-${item.productName}`;
    notifications.push({
      id: `odoo-notif-license-${reference}`,
      partnerId,
      title: "License Issued",
      detail:
        "Your software license has been issued successfully. You can now view your license details in your customer portal.",
      status: "License Issued",
      type: "license_available",
      reference,
      read: false,
      createdAt: new Date().toISOString(),
    });
  }

  return notifications
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

function quoteNotifStatus(status: QuoteLifecycleStatus): PortalNotificationStatus {
  switch (status) {
    case "Quotation Sent":
      return "Quotation Sent";
    case "Payment Pending":
      return "Approved";
    case "Payment Received":
      return "Payment Received";
    case "Won":
      return "License Issued";
    case "Lost":
      return "Rejected";
    default:
      return "Submitted";
  }
}

function notificationsForQuote(
  partnerId: number,
  quote: {
    reference: string;
    productName: string;
    status: QuoteLifecycleStatus;
    updatedAt: string;
    createdAt: string;
  },
): PortalNotification[] {
  const createdAt = quote.updatedAt || quote.createdAt;
  const base = {
    partnerId,
    reference: quote.reference,
    read: false as const,
    createdAt,
  };

  switch (quote.status) {
    case "Quotation Sent":
      return [
        {
          ...base,
          id: `odoo-notif-quote-sent-${quote.reference}`,
          title: "Quotation sent",
          detail: `Our sales team sent a quotation for ${quote.productName} (${quote.reference}). Check Quote status for details.`,
          status: quoteNotifStatus(quote.status),
          type: "quote_sent",
        },
      ];
    case "Payment Pending":
      return [
        {
          ...base,
          id: `odoo-notif-quote-pay-${quote.reference}`,
          title: "Quotation ready — payment pending",
          detail: `Your quotation ${quote.reference} for ${quote.productName} is ready. Complete payment to proceed.`,
          status: quoteNotifStatus(quote.status),
          type: "quote_payment",
        },
      ];
    case "Payment Received":
      return [
        {
          ...base,
          id: `odoo-notif-quote-paid-${quote.reference}`,
          title: "Payment received for quotation",
          detail: `Payment for quotation ${quote.reference} (${quote.productName}) has been recorded.`,
          status: quoteNotifStatus(quote.status),
          type: "quote_payment",
        },
      ];
    case "Won":
      return [
        {
          ...base,
          id: `odoo-notif-quote-won-${quote.reference}`,
          title: "Quote won",
          detail: `Your quote request ${quote.reference} for ${quote.productName} was marked as won.`,
          status: quoteNotifStatus(quote.status),
          type: "quote",
        },
      ];
    case "Lost":
      return [
        {
          ...base,
          id: `odoo-notif-quote-lost-${quote.reference}`,
          title: "Quote closed",
          detail: `Your quote request ${quote.reference} for ${quote.productName} was closed.`,
          status: quoteNotifStatus(quote.status),
          type: "quote",
        },
      ];
    default:
      return [
        {
          ...base,
          id: `odoo-notif-quote-submitted-${quote.reference}`,
          title: "Quote request received",
          detail: `We received your Request Quote ${quote.reference} for ${quote.productName}. Sales will send a quotation soon.`,
          status: "Submitted",
          type: "quote",
        },
      ];
  }
}
