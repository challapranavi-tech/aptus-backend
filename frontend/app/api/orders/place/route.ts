import { NextRequest, NextResponse } from "next/server";
import { estimateOrderPricing } from "@/lib/order-pricing";
import { writeAudit } from "@/lib/server/audit-log";
import { resolveProfile } from "@/lib/server/auth-service";
import { isDemoMode } from "@/lib/server/config";
import { getSessionFromRequestOrRefresh, jsonError, jsonOk } from "@/lib/server/http";
import { logger } from "@/lib/server/logger";
import { upsertCartCrmLead } from "@/lib/server/odoo/leads";
import {
  formatOrderNotificationEmail,
  type ProductOrderPayload,
} from "@/lib/server/order-notification";
import { createPortalOrder } from "@/lib/server/portal-orders";
import { getStoredPortalCart, saveStoredPortalCart } from "@/lib/server/portal-cart-store";
import { placeOrderSchema, validationErrorResponse } from "@/lib/server/validation";
import type { PortalOrder } from "@/types/orders";

/**
 * Checkout step — prepares the order the customer is about to pay for.
 *
 * Deliberately writes NO purchase state: no sale order, no promotion of the CRM
 * record to a software order, no notification to the sales inbox, and the cart
 * is left intact. Those side effects belong to the payment step
 * (POST /api/orders/[id]/bank-transfer) and only run once payment proof is
 * accepted, so a failed payment leaves nothing behind to clean up.
 */
export async function POST(request: NextRequest) {
  const claims = await getSessionFromRequestOrRefresh(request);
  if (!claims) {
    return jsonError("Not authenticated", 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body", 400);
  }

  const parsed = placeOrderSchema.safeParse(body);
  if (!parsed.success) {
    const validation = validationErrorResponse(parsed.error);
    return NextResponse.json(
      { error: validation.error, code: "VALIDATION_ERROR", issues: validation.issues },
      { status: 400 },
    );
  }

  const profile = await resolveProfile(claims);
  if (!profile) {
    return jsonError("Profile not found", 404);
  }

  const orderPayload: ProductOrderPayload = {
    duration: parsed.data.duration,
    items: parsed.data.items,
    contact: {
      name: parsed.data.contactName || profile.name,
      email: parsed.data.contactEmail || profile.email,
      phone: parsed.data.contactPhone || profile.phone,
      company: profile.company,
    },
    customerMessage: parsed.data.customerMessage,
  };

  const now = new Date().toISOString();
  const pendingOrder: Omit<PortalOrder, "id" | "reference"> = {
    actorId: claims.sub,
    partnerId: profile.partnerId ?? 0,
    status: "Submitted",
    duration: parsed.data.duration,
    items: parsed.data.items,
    paymentStatus: "pending",
    customerMessage: parsed.data.customerMessage,
    createdAt: now,
    updatedAt: now,
  };
  const amountDue = estimateOrderPricing({
    ...pendingOrder,
    id: "",
    reference: "",
  })?.total;

  // Checkout details (contact, message, product lines) are recorded on the cart
  // journey now so sales keep them even if the customer never pays.
  const checkoutNotes = formatOrderNotificationEmail(profile, orderPayload, "Pending payment").body;

  if (isDemoMode()) {
    const order = createPortalOrder({
      actorId: claims.sub,
      partnerId: profile.partnerId ?? 0,
      reference: `ORD-${Date.now()}`,
      duration: orderPayload.duration,
      items: orderPayload.items,
      status: "Submitted",
      amountDue,
      paymentStatus: "pending",
      customerMessage: orderPayload.customerMessage,
    });
    return jsonOk({ ok: true, mode: "demo", reference: order.reference, order });
  }

  if (!profile.partnerId) {
    return jsonError("No linked Odoo partner for this account", 400);
  }

  try {
    const cart = await getStoredPortalCart(claims.sub);

    // Refreshes the existing "Added to Cart" opportunity (or opens one) — still a
    // cart record, not a purchase. Promotion happens after payment.
    const leadId = await upsertCartCrmLead({
      partnerId: profile.partnerId,
      productNames: orderPayload.items.map((item) => item.productName),
      description: checkoutNotes,
      existingLeadId: cart?.crmLeadId,
    });
    // Keep the server cart in step with what is being paid for and tie it to this
    // lead: the payment step reads these lines (quantities included) when it
    // finally records the purchase.
    // Preserve crmNotifiedFingerprint so syncCartCrmJourney does not re-send the
    // cart-added email when the browser syncs the cart after checkout.
    await saveStoredPortalCart(claims.sub, {
      duration: orderPayload.duration,
      items: orderPayload.items,
      partnerId: profile.partnerId,
      crmLeadId: leadId,
      crmNotifiedFingerprint: cart?.crmNotifiedFingerprint,
    });

    const order: PortalOrder = {
      ...pendingOrder,
      id: `odoo-lead-${leadId}`,
      reference: `LEAD-${leadId}`,
      leadId,
      amountDue,
    };

    logger.info("Checkout prepared — awaiting payment", {
      action: "order.place",
      actorId: claims.sub,
      partnerId: profile.partnerId,
      leadId,
      itemCount: orderPayload.items.length,
    });

    writeAudit({
      action: "order.place",
      actorId: claims.sub,
      targetId: String(leadId),
      metadata: {
        mode: "live",
        stage: "awaiting_payment",
        reference: order.reference,
        leadId,
        duration: orderPayload.duration,
        itemCount: orderPayload.items.length,
      },
    });

    return jsonOk({ ok: true, mode: "live", reference: order.reference, leadId, order });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to prepare checkout";
    logger.error("Checkout preparation failed", {
      action: "order.place",
      actorId: claims.sub,
      partnerId: profile.partnerId,
      error: message,
    });
    return jsonError(message, 500);
  }
}
