import { writeAudit } from "./audit-log";
import { resolveCustomerContact } from "./auth-service";
import { formatCancellationEmail } from "./order-notification";
import { sendPortalEmail } from "./mail-service";
import { logger } from "./logger";
import { createPortalNotification } from "./portal-notifications";

export const CANCELLATION_SUCCESS_MESSAGE =
  "Your subscription has been cancelled. The related CRM opportunity has been marked as lost.";

function getPortalBaseUrl(): string {
  return (process.env.PORTAL_BASE_URL?.trim() || "https://aptusinfotech.com").replace(/\/$/, "");
}

/**
 * Event 9 — Subscription / License Cancelled. Best-effort, never blocks the
 * cancellation flow itself (caller already committed the cancellation in Odoo/demo store).
 */
export async function notifyCancellationEmail(input: {
  partnerId?: number;
  actorId: string;
  productName: string;
  reference?: string;
}): Promise<void> {
  try {
    const customer = await resolveCustomerContact(input.partnerId, input.actorId);
    if (!customer?.email) return;

    const mail = formatCancellationEmail({
      customerName: customer.name,
      productName: input.productName,
      reference: input.reference,
      effectiveDate: new Date().toISOString().slice(0, 10),
      portalUrl: getPortalBaseUrl(),
    });

    const result = await sendPortalEmail({
      to: customer.email,
      subject: mail.subject,
      body: mail.body,
    });

    if (input.partnerId) {
      await createPortalNotification({
        partnerId: input.partnerId,
        actorId: customer.actorId,
        title: "Subscription cancelled",
        detail: `Your ${input.productName} subscription has been cancelled.`,
        status: "Cancelled",
        type: "cancellation",
        reference: input.reference ?? input.productName,
      });
    }

    if (result.sent) {
      writeAudit({
        action: "notification.email",
        actorId: input.actorId,
        metadata: {
          subject: mail.subject,
          to: customer.email,
          channel: result.channel,
          type: "cancellation",
          productName: input.productName,
        },
      });
    } else {
      logger.warn("Cancellation email not sent", {
        action: "subscription.cancel_notify",
        error: result.error,
        productName: input.productName,
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn("Cancellation email failed", { action: "subscription.cancel_notify", error: message });
  }
}
