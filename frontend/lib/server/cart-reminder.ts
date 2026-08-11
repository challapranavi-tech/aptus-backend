import { resolveCustomerContact } from "./auth-service";
import { writeAudit } from "./audit-log";
import { logger } from "./logger";
import { sendPortalEmail } from "./mail-service";
import { formatCartReminderEmail } from "./order-notification";
import { isCartCrmLeadInAddedToCartStage } from "./odoo/leads";
import {
  CART_REMINDER_MAX_COUNT,
  getStoredPortalCart,
  listStoredPortalCartActorIds,
  markCartReminderSent,
  type StoredPortalCart,
} from "./portal-cart-store";

function getPortalBaseUrl(): string {
  return (process.env.PORTAL_BASE_URL?.trim() || "https://aptusinfotech.com").replace(/\/$/, "");
}

function isReminderDue(cart: StoredPortalCart): boolean {
  if (!cart.nextReminderAt) return false;
  if ((cart.reminderCount ?? 0) >= CART_REMINDER_MAX_COUNT) return false;
  return Date.now() >= new Date(cart.nextReminderAt).getTime();
}

export async function maybeSendCartReminderForActor(
  actorId: string,
  partnerId?: number,
): Promise<boolean> {
  const cart = await getStoredPortalCart(actorId);
  if (!cart?.items.length || !isReminderDue(cart)) return false;

  // Stop immediately once the CRM opportunity leaves Added to Cart (purchase progressed,
  // cancelled/lost, or otherwise closed).
  if (cart.crmLeadId) {
    const stillInCart = await isCartCrmLeadInAddedToCartStage(cart.crmLeadId).catch(() => false);
    if (!stillInCart) {
      logger.info("Cart reminder skipped — CRM left Added to Cart", {
        action: "cart.reminder",
        actorId,
        leadId: cart.crmLeadId,
      });
      return false;
    }
  }

  const customer = await resolveCustomerContact(partnerId ?? cart.partnerId, actorId);
  if (!customer?.email) return false;

  const portalUrl = getPortalBaseUrl();
  const mail = formatCartReminderEmail({
    customerName: customer.name,
    products: cart.items.map(
      (item) => `${item.productName} (${item.category}) × ${item.quantity}`,
    ),
    duration: cart.duration,
    continueUrl: `${portalUrl}/portal/products#cart`,
  });

  const result = await sendPortalEmail({
    to: customer.email,
    subject: mail.subject,
    body: mail.body,
  });

  if (!result.sent) {
    logger.warn("Cart reminder email not sent", {
      action: "cart.reminder",
      actorId,
      error: result.error,
    });
    return false;
  }

  await markCartReminderSent(actorId);
  writeAudit({
    action: "notification.email",
    actorId,
    metadata: {
      type: "cart_reminder",
      to: customer.email,
      subject: mail.subject,
      channel: result.channel,
      itemCount: cart.items.length,
      reminderCount: (cart.reminderCount ?? 0) + 1,
    },
  });
  return true;
}

export async function processAllCartReminders(): Promise<{ sent: number; checked: number }> {
  const actorIds = await listStoredPortalCartActorIds();
  let sent = 0;
  for (const actorId of actorIds) {
    const cart = await getStoredPortalCart(actorId);
    if (await maybeSendCartReminderForActor(actorId, cart?.partnerId)) {
      sent += 1;
    }
  }
  return { sent, checked: actorIds.length };
}
