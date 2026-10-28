import { writeAudit } from "./audit-log";
import { resolveCustomerContact } from "./auth-service";
import { getPortalBaseUrl } from "./config";
import { logger } from "./logger";
import { sendPortalEmail } from "./mail-service";
import { formatRefundProcessedEmail, formatRefundRequestedEmail } from "./order-notification";
import { claimNotificationSend, createPortalNotification } from "./portal-notifications";
import type { PortalRefundRequest } from "@/types/refunds";

/** Event 15 — Refund Requested (customer confirmation, sent right after submission). */
export async function notifyRefundRequested(refund: PortalRefundRequest): Promise<void> {
  try {
    const customer = await resolveCustomerContact(refund.partnerId, refund.actorId);
    if (!customer?.email) return;

    if (!(await claimNotificationSend(refund.partnerId, refund.reference, "refund_requested"))) {
      return;
    }

    const mail = formatRefundRequestedEmail({
      customerName: customer.name,
      refundReference: refund.reference,
      orderReference: refund.orderReference,
      productName: refund.productName,
      portalUrl: getPortalBaseUrl(),
    });

    const result = await sendPortalEmail({ to: customer.email, subject: mail.subject, body: mail.body });

    await createPortalNotification({
      partnerId: refund.partnerId,
      actorId: customer.actorId,
      title: "Refund request received",
      detail: `We've received your refund request ${refund.reference} for ${refund.productName}.`,
      status: "Submitted",
      type: "refund_requested",
      reference: refund.reference,
    });

    if (result.sent) {
      writeAudit({
        action: "notification.email",
        actorId: customer.actorId,
        metadata: {
          subject: mail.subject,
          to: customer.email,
          channel: result.channel,
          reference: refund.reference,
          type: "refund_requested",
        },
      });
    } else {
      logger.warn("Refund requested email not sent", {
        action: "refund.requested_notify",
        reference: refund.reference,
        error: result.error,
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn("Refund requested notification failed", { action: "refund.requested_notify", error: message });
  }
}

/** Event 16 — Refund Processed (sent when an admin approves/processes the refund). */
export async function notifyRefundProcessed(
  refund: PortalRefundRequest,
  triggeredBy?: string,
): Promise<void> {
  try {
    const customer = await resolveCustomerContact(refund.partnerId, refund.actorId);
    if (!customer?.email) return;

    const processedRef = `${refund.reference}-processed`;
    if (!(await claimNotificationSend(refund.partnerId, processedRef, "refund_processed"))) {
      return;
    }

    const mail = formatRefundProcessedEmail({
      customerName: customer.name,
      refundReference: refund.reference,
      orderReference: refund.orderReference,
      productName: refund.productName,
      amount: refund.amount,
      paymentMethod: refund.paymentMethod || "Original payment method",
      estimatedArrival: refund.estimatedArrival || "5-7 business days",
    });

    const result = await sendPortalEmail({ to: customer.email, subject: mail.subject, body: mail.body });

    await createPortalNotification({
      partnerId: refund.partnerId,
      actorId: customer.actorId,
      title: "Refund processed",
      detail: `Your refund ${refund.reference} for ${refund.productName} has been processed.`,
      status: "Processed",
      type: "refund_processed",
      reference: `${refund.reference}-processed`,
    });

    if (result.sent) {
      writeAudit({
        action: "notification.email",
        actorId: triggeredBy ?? customer.actorId,
        metadata: {
          subject: mail.subject,
          to: customer.email,
          channel: result.channel,
          reference: refund.reference,
          type: "refund_processed",
        },
      });
    } else {
      logger.warn("Refund processed email not sent", {
        action: "refund.processed_notify",
        reference: refund.reference,
        error: result.error,
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn("Refund processed notification failed", { action: "refund.processed_notify", error: message });
  }
}
