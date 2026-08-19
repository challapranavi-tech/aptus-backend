import { resolveCustomerContact } from "./auth-service";
import { getOrderNotificationEmail, getPortalBaseUrl } from "./config";
import { writeAudit } from "./audit-log";
import { logger } from "./logger";
import { sendPortalEmail } from "./mail-service";
import { formatCartAddedSalesEmail, formatCartReminderEmail } from "./order-notification";
import { isCartCrmLeadInAddedToCartStage } from "./odoo/leads";
import { estimateOrderPricing } from "@/lib/order-pricing";
import { cartLineUnitPrice } from "@/lib/portal-cart-checkout";
import {
  CART_REMINDER_MAX_COUNT,
  getStoredPortalCart,
  listStoredPortalCartActorIds,
  markCartReminderSent,
  markSalesFollowUpSent,
  type StoredPortalCart,
} from "./portal-cart-store";

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

function isSalesFollowUpDue(cart: StoredPortalCart): boolean {
  if (cart.salesFollowUpSent) return false;
  if (!cart.salesFollowUpAt) return false;
  return Date.now() >= new Date(cart.salesFollowUpAt).getTime();
}

/**
 * Sends the internal sales-team follow-up email when a cart has been sitting
 * for 2 business days without a completed purchase.
 */
async function maybeSendSalesFollowUpForActor(actorId: string): Promise<boolean> {
  const cart = await getStoredPortalCart(actorId);
  if (!cart?.items.length || !isSalesFollowUpDue(cart)) return false;

  // Skip if the CRM opportunity has already moved past "Added to Cart"
  // (meaning a purchase was made or the lead was handled).
  if (cart.crmLeadId) {
    const stillInCart = await isCartCrmLeadInAddedToCartStage(cart.crmLeadId).catch(() => true);
    if (!stillInCart) {
      logger.info("Sales follow-up skipped — CRM left Added to Cart", {
        action: "cart.sales_followup",
        actorId,
        leadId: cart.crmLeadId,
      });
      await markSalesFollowUpSent(actorId);
      return false;
    }
  }

  const customer = await resolveCustomerContact(cart.partnerId, actorId);

  const linePrices = cart.items.map((item) => {
    const unitPrice = cartLineUnitPrice(item, cart.duration);
    return { productName: item.productName, unitPrice, lineTotal: unitPrice * item.quantity };
  });
  const pricing = estimateOrderPricing({
    id: "",
    reference: "",
    actorId,
    partnerId: cart.partnerId ?? 0,
    status: "Submitted",
    duration: cart.duration,
    items: cart.items,
    createdAt: "",
    updatedAt: "",
  });

  const addedAt = new Date(cart.updatedAt).toUTCString();
  const mail = formatCartAddedSalesEmail({
    customer: {
      name: customer?.name ?? `Customer (${actorId})`,
      company: customer?.company ?? "",
      email: customer?.email ?? "",
      phone: customer?.phone ?? "",
    },
    duration: cart.duration,
    items: cart.items,
    linePrices,
    estimatedTotal: pricing?.total ?? null,
    addedAt,
    crmReference: cart.crmLeadId ? `LEAD-${cart.crmLeadId}` : undefined,
  });

  const subject = `Sales Lead Follow-up: No Purchase After 2 Business Days – ${customer?.name ?? actorId}`;
  const prefixLine =
    "This customer added products to their cart 2 business days ago and has not yet completed a purchase. Please reach out.";
  const body = `${prefixLine}\n\n${mail.body}`;

  const notifyEmail = getOrderNotificationEmail();
  const result = await sendPortalEmail({
    to: notifyEmail,
    subject,
    body,
    html: mail.html
      ? mail.html.replace(
          ">Hello Sales Team,",
          `>${prefixLine}<br/><br/>Hello Sales Team,`,
        )
      : undefined,
  });

  if (!result.sent) {
    logger.warn("Sales follow-up email not sent", {
      action: "cart.sales_followup",
      actorId,
      error: result.error,
    });
    return false;
  }

  await markSalesFollowUpSent(actorId);
  writeAudit({
    action: "notification.email",
    actorId,
    metadata: {
      type: "cart_sales_followup",
      to: notifyEmail,
    subject,
    channel: result.channel,
    itemCount: cart.items.length,
    leadId: cart.crmLeadId ?? null,
    customerName: customer?.name ?? actorId,
    customerPhone: customer?.phone ?? "",
    },
  });
  return true;
}

export async function processAllCartReminders(): Promise<{ sent: number; checked: number; salesFollowUps: number }> {
  const actorIds = await listStoredPortalCartActorIds();
  let sent = 0;
  let salesFollowUps = 0;
  for (const actorId of actorIds) {
    const cart = await getStoredPortalCart(actorId);
    if (await maybeSendCartReminderForActor(actorId, cart?.partnerId)) {
      sent += 1;
    }
    if (await maybeSendSalesFollowUpForActor(actorId)) {
      salesFollowUps += 1;
    }
  }
  return { sent, checked: actorIds.length, salesFollowUps };
}
