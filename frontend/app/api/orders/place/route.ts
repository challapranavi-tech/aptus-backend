import { NextRequest, NextResponse } from "next/server";
import { estimateOrderPricing } from "@/lib/order-pricing";
import { writeAudit } from "@/lib/server/audit-log";
import { resolveProfile } from "@/lib/server/auth-service";
import { getOrderNotificationEmail, isDemoMode } from "@/lib/server/config";
import { getSessionFromRequestOrRefresh, jsonError, jsonOk } from "@/lib/server/http";
import { logger } from "@/lib/server/logger";
import { sendPortalEmail } from "@/lib/server/mail-service";
import { promoteCartLeadToProductOrder } from "@/lib/server/odoo/leads";
import { createPortalSaleOrderWithLines } from "@/lib/server/odoo/sales";
import {
  formatOrderNotificationEmail,
  type ProductOrderPayload,
} from "@/lib/server/order-notification";
import {
  buildOrderIdempotencyKey,
  claimOrderIdempotency,
  createPortalOrder,
  rememberOrderIdempotency,
  releaseOrderIdempotency,
} from "@/lib/server/portal-orders";
import { clearStoredPortalCart, getStoredPortalCart } from "@/lib/server/portal-cart-store";
import { placeOrderSchema, validationErrorResponse } from "@/lib/server/validation";

const DUPLICATE_SUBMITTED_MESSAGE =
  "Your request has been submitted successfully. Our team will review your request and provide confirmation within 48 hours.";

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

  const estimatedPricing = estimateOrderPricing({
    id: "",
    reference: "",
    actorId: claims.sub,
    partnerId: profile.partnerId ?? 0,
    status: "Submitted",
    duration: parsed.data.duration,
    items: parsed.data.items,
    createdAt: "",
    updatedAt: "",
  });
  const amountDue = estimatedPricing?.total;

  const reference = `ORD-${Date.now()}`;
  const notification = formatOrderNotificationEmail(profile, orderPayload, reference);
  const notifyEmail = getOrderNotificationEmail();
  const actorId = claims.sub;
  const customerEmail = profile.email;

  async function clearCustomerCart(): Promise<void> {
    await clearStoredPortalCart(actorId);
  }

  const idempotencyKey = profile.partnerId
    ? buildOrderIdempotencyKey({
        partnerId: profile.partnerId,
        duration: orderPayload.duration,
        items: orderPayload.items,
      })
    : buildOrderIdempotencyKey({
        partnerId: 0,
        duration: orderPayload.duration,
        items: orderPayload.items,
      });

  let claimedIdempotency = false;
  if (profile.partnerId) {
    const claim = await claimOrderIdempotency(profile.partnerId, idempotencyKey);
    if (claim.outcome === "duplicate") {
      await clearCustomerCart();
      return jsonOk({
        ok: true,
        mode: isDemoMode() ? "demo" : "live",
        reference: claim.reference,
        duplicate: true,
        message: DUPLICATE_SUBMITTED_MESSAGE,
        notificationSent: false,
      });
    }
    if (claim.outcome === "in_progress") {
      return jsonOk({
        ok: true,
        mode: isDemoMode() ? "demo" : "live",
        reference: `ORD-PENDING`,
        duplicate: true,
        message: DUPLICATE_SUBMITTED_MESSAGE,
        notificationSent: false,
      });
    }
    claimedIdempotency = true;
  }

  async function dispatchNotification(): Promise<boolean> {
    const result = await sendPortalEmail({
      to: notifyEmail,
      subject: notification.subject,
      body: notification.body,
      replyTo: customerEmail,
    });
    if (result.sent) {
      writeAudit({
        action: "notification.email",
        actorId,
        metadata: {
          subject: notification.subject,
          to: notifyEmail,
          channel: result.channel,
          reference,
        },
      });
    }
    return result.sent;
  }

  if (isDemoMode()) {
    try {
      logger.info("Order placed in demo mode (no Odoo writes)", {
        action: "order.place",
        actorId: claims.sub,
        reference,
        itemCount: orderPayload.items.length,
      });

      writeAudit({
        action: "order.place",
        actorId: claims.sub,
        metadata: {
          mode: "demo",
          reference,
          notifyEmail,
          subject: notification.subject,
          body: notification.body,
          duration: orderPayload.duration,
          itemCount: orderPayload.items.length,
        },
      });

      const notificationSent = await dispatchNotification();
      await clearCustomerCart();

      if (profile.partnerId) {
        createPortalOrder({
          actorId: claims.sub,
          partnerId: profile.partnerId,
          reference,
          duration: orderPayload.duration,
          items: orderPayload.items,
          idempotencyKey,
          status: "Submitted",
          amountDue,
          paymentStatus: "pending",
          customerMessage: orderPayload.customerMessage,
        });
        await rememberOrderIdempotency(profile.partnerId, idempotencyKey, reference);
      }

      return jsonOk({
        ok: true,
        mode: "demo",
        reference,
        message: DUPLICATE_SUBMITTED_MESSAGE,
        notificationSent,
        notifyEmail,
      });
    } catch (error) {
      if (claimedIdempotency && profile.partnerId) {
        await releaseOrderIdempotency(profile.partnerId, idempotencyKey);
      }
      throw error;
    }
  }

  if (!profile.partnerId) {
    return jsonError("No linked Odoo partner for this account", 400);
  }

  try {
    const productNames = orderPayload.items.map((item) => item.productName);
    const existingCart = await getStoredPortalCart(claims.sub);
    const existingLeadId = existingCart?.crmLeadId;

    logger.info("Submitting portal order to Odoo", {
      action: "order.place",
      actorId: claims.sub,
      partnerId: profile.partnerId,
      reference,
      duration: orderPayload.duration,
      itemCount: orderPayload.items.length,
      products: productNames,
      existingLeadId: existingLeadId ?? null,
    });

    const leadId = await promoteCartLeadToProductOrder({
      partnerId: profile.partnerId,
      productNames,
      description: notification.body,
      existingLeadId,
    });

    let saleOrderId: number | undefined;
    try {
      saleOrderId = await createPortalSaleOrderWithLines({
        partnerId: profile.partnerId,
        duration: orderPayload.duration,
        lines: orderPayload.items.map((item) => ({
          productName: item.productName,
          quantity: item.quantity,
          category: item.category,
          duration: item.duration ?? orderPayload.duration,
          purchaseType: item.purchaseType ?? "new",
          packageId: item.packageId,
          levelId: item.levelId,
        })),
        notes: notification.body,
        orderReference: reference,
      });
      logger.info("Portal sale order created", {
        action: "order.place",
        actorId: claims.sub,
        leadId,
        saleOrderId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "sale order creation failed";
      logger.warn("Portal sale order creation failed (CRM opportunity still created)", {
        action: "order.place",
        actorId: claims.sub,
        leadId,
        error: message,
      });
    }

    writeAudit({
      action: "order.place",
      actorId: claims.sub,
      targetId: String(leadId),
      metadata: {
        mode: "live",
        reference,
        notifyEmail,
        subject: notification.subject,
        leadId,
        saleOrderId,
        duration: orderPayload.duration,
        itemCount: orderPayload.items.length,
      },
    });

    const finalReference = saleOrderId ? `SO-${saleOrderId}` : `LEAD-${leadId}`;
    const notificationSent = await dispatchNotification();
    await clearCustomerCart();

    await rememberOrderIdempotency(profile.partnerId, idempotencyKey, finalReference);

    return jsonOk({
      ok: true,
      mode: "live",
      reference: finalReference,
      leadId,
      saleOrderId,
      message: DUPLICATE_SUBMITTED_MESSAGE,
      notificationSent,
      notifyEmail,
    });
  } catch (error) {
    if (claimedIdempotency) {
      await releaseOrderIdempotency(profile.partnerId, idempotencyKey);
    }
    const message = error instanceof Error ? error.message : "Failed to place order";
    logger.error("Order placement failed", {
      action: "order.place",
      actorId: claims.sub,
      partnerId: profile.partnerId,
      reference,
      error: message,
    });
    return jsonError(message, 500);
  }
}
