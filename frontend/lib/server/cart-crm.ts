import { estimateOrderPricing } from "@/lib/order-pricing";
import { cartLineUnitPrice } from "@/lib/portal-cart-checkout";
import { writeAudit } from "./audit-log";
import { getOrderNotificationEmail, isDemoMode } from "./config";
import { logger } from "./logger";
import { sendPortalEmail } from "./mail-service";
import { closeCartCrmLead, upsertCartCrmLead } from "./odoo/leads";
import { formatCartAddedSalesEmail } from "./order-notification";
import {
  cartFingerprint,
  getStoredPortalCart,
  patchStoredPortalCartMeta,
  type StoredPortalCart,
} from "./portal-cart-store";
import type { ClientProfile } from "./types";

function buildCartDescription(input: {
  profile: ClientProfile;
  cart: StoredPortalCart;
  addedAt: string;
}): string {
  const linePrices = input.cart.items.map((item) => {
    const unitPrice = cartLineUnitPrice(item, input.cart.duration);
    return {
      productName: item.productName,
      unitPrice,
      lineTotal: unitPrice * item.quantity,
    };
  });
  const pricing = estimateOrderPricing({
    id: "",
    reference: "",
    actorId: "",
    partnerId: input.profile.partnerId ?? 0,
    status: "Submitted",
    duration: input.cart.duration,
    items: input.cart.items,
    createdAt: "",
    updatedAt: "",
  });

  return formatCartAddedSalesEmail({
    customer: {
      name: input.profile.name,
      company: input.profile.company,
      email: input.profile.email,
      phone: input.profile.phone,
      location: input.profile.location,
    },
    duration: input.cart.duration,
    items: input.cart.items,
    linePrices,
    estimatedTotal: pricing?.total ?? null,
    addedAt: input.addedAt,
    crmReference: input.cart.crmLeadId ? `LEAD-${input.cart.crmLeadId}` : undefined,
  }).body;
}

/**
 * After cart save: upsert one CRM "Added to Cart" opportunity and email sales when contents change.
 * Soft-fails so cart UX is never blocked by Odoo/mail.
 */
export async function syncCartCrmJourney(input: {
  actorId: string;
  profile: ClientProfile;
  cart: StoredPortalCart;
}): Promise<{ leadId?: number; salesNotified: boolean }> {
  if (!input.cart.items.length || !input.profile.partnerId) {
    return { salesNotified: false };
  }

  const fingerprint = cartFingerprint(input.cart);
  const addedAt = new Date(input.cart.updatedAt).toUTCString();
  const description = buildCartDescription({
    profile: input.profile,
    cart: input.cart,
    addedAt,
  });

  let leadId = input.cart.crmLeadId;
  if (!isDemoMode()) {
    try {
      leadId = await upsertCartCrmLead({
        partnerId: input.profile.partnerId,
        productNames: input.cart.items.map((item) => item.productName),
        description,
        existingLeadId: input.cart.crmLeadId,
      });
      if (leadId !== input.cart.crmLeadId) {
        await patchStoredPortalCartMeta(input.actorId, { crmLeadId: leadId });
      }
    } catch (error) {
      logger.warn("Cart CRM upsert failed", {
        action: "cart.crm_upsert",
        actorId: input.actorId,
        partnerId: input.profile.partnerId,
        error: error instanceof Error ? error.message : "unknown",
      });
    }
  }

  const shouldNotify = fingerprint !== input.cart.crmNotifiedFingerprint;
  if (!shouldNotify) {
    return { leadId, salesNotified: false };
  }

  const linePrices = input.cart.items.map((item) => {
    const unitPrice = cartLineUnitPrice(item, input.cart.duration);
    return {
      productName: item.productName,
      unitPrice,
      lineTotal: unitPrice * item.quantity,
    };
  });
  const pricing = estimateOrderPricing({
    id: "",
    reference: "",
    actorId: input.actorId,
    partnerId: input.profile.partnerId,
    status: "Submitted",
    duration: input.cart.duration,
    items: input.cart.items,
    createdAt: "",
    updatedAt: "",
  });

  const mail = formatCartAddedSalesEmail({
    customer: {
      name: input.profile.name,
      company: input.profile.company,
      email: input.profile.email,
      phone: input.profile.phone,
      location: input.profile.location,
    },
    duration: input.cart.duration,
    items: input.cart.items,
    linePrices,
    estimatedTotal: pricing?.total ?? null,
    addedAt,
    crmReference: leadId ? `LEAD-${leadId}` : undefined,
  });

  const notifyEmail = getOrderNotificationEmail();
  const result = await sendPortalEmail({
    to: notifyEmail,
    subject: mail.subject,
    body: mail.body,
    html: mail.html,
    replyTo: input.profile.email,
  });

  if (!result.sent) {
    logger.warn("Cart-added sales email not sent", {
      action: "cart.sales_notify",
      actorId: input.actorId,
      error: result.error,
    });
    return { leadId, salesNotified: false };
  }

  await patchStoredPortalCartMeta(input.actorId, {
    crmLeadId: leadId,
    crmNotifiedFingerprint: fingerprint,
  });

  writeAudit({
    action: "notification.email",
    actorId: input.actorId,
    metadata: {
      type: "cart_added",
      to: notifyEmail,
      subject: mail.subject,
      channel: result.channel,
      leadId: leadId ?? null,
      itemCount: input.cart.items.length,
    },
  });

  return { leadId, salesNotified: true };
}

/**
 * Cart emptied: close the "Added to Cart" opportunity so removed products stop showing in
 * the pipeline. Soft-fails so clearing a cart is never blocked by Odoo.
 */
export async function closeCartCrmJourney(input: {
  actorId: string;
  partnerId?: number;
  existingLeadId?: number;
}): Promise<void> {
  if (!input.partnerId || isDemoMode()) return;

  try {
    await closeCartCrmLead({
      partnerId: input.partnerId,
      existingLeadId: input.existingLeadId,
    });
  } catch (error) {
    logger.warn("Cart CRM close failed", {
      action: "cart.crm_close",
      actorId: input.actorId,
      partnerId: input.partnerId,
      error: error instanceof Error ? error.message : "unknown",
    });
  }
}

export async function readCartCrmLeadId(actorId: string): Promise<number | undefined> {
  const cart = await getStoredPortalCart(actorId);
  return cart?.crmLeadId;
}
