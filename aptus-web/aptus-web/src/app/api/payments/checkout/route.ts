import { NextRequest, NextResponse } from "next/server";
import { writeAudit } from "@/lib/server/audit-log";
import { resolveProfile } from "@/lib/server/auth-service";
import { CircuitOpenError, createStripePaymentIntent } from "@/lib/server/stripe";
import { getSessionFromRequestOrRefresh, jsonError, jsonOk } from "@/lib/server/http";
import { getClientIp, logger } from "@/lib/server/logger";
import {
  resolvePortalOrderForPartner,
  upsertPortalOrderSnapshot,
} from "@/lib/server/portal-orders";
import { orderPaymentCheckoutSchema, validationErrorResponse } from "@/lib/server/validation";
import { estimateOrderPricing, orderTotalToBaisa } from "@/lib/order-pricing";
import { isOrderEligibleForPayment } from "@/lib/order-status";

/**
 * Creates a Stripe PaymentIntent for an approved order — never accepts raw card data.
 */
export async function POST(request: NextRequest) {
  const claims = await getSessionFromRequestOrRefresh(request);
  if (!claims) {
    return jsonError("Not authenticated", 401);
  }

  const profile = await resolveProfile(claims);
  if (!profile?.partnerId) {
    return jsonError("No linked partner for this account", 400);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body", 400);
  }

  const parsed = orderPaymentCheckoutSchema.safeParse(body);
  if (!parsed.success) {
    const validation = validationErrorResponse(parsed.error);
    return NextResponse.json(
      { error: validation.error, code: "VALIDATION_ERROR", issues: validation.issues },
      { status: 400 },
    );
  }

  let order =
    resolvePortalOrderForPartner(parsed.data.orderId, profile.partnerId) ??
    null;

  if (!order && parsed.data.orderSnapshot) {
    const now = new Date().toISOString();
    order = upsertPortalOrderSnapshot({
      ...parsed.data.orderSnapshot,
      actorId: parsed.data.orderSnapshot.actorId ?? claims.sub,
      partnerId: profile.partnerId,
      paymentStatus: parsed.data.orderSnapshot.paymentStatus ?? "pending",
      createdAt: parsed.data.orderSnapshot.createdAt ?? now,
      updatedAt: parsed.data.orderSnapshot.updatedAt ?? now,
    });
  }

  if (!order) {
    return jsonError("Order not found", 404);
  }

  if (!isOrderEligibleForPayment(order, parsed.data.orderSnapshot)) {
    return jsonError("This order is not ready for payment yet", 400, "PAYMENT_NOT_ALLOWED");
  }

  const pricing = estimateOrderPricing(order);
  const amountDue = order.amountDue ?? pricing?.total;
  if (!amountDue || amountDue <= 0) {
    return jsonError("Unable to determine payment amount for this order", 400);
  }

  const amount = orderTotalToBaisa(amountDue);
  const currency = (parsed.data.currency ?? "omr").toLowerCase();
  const idempotencyKey = parsed.data.idempotencyKey ?? `order-pay-${order.id}`;

  try {
    const payment = await createStripePaymentIntent({
      amount,
      currency,
      idempotencyKey,
      userId: claims.sub,
      metadata: {
        orderId: order.id,
        orderReference: order.reference,
        partnerId: String(profile.partnerId),
      },
    });

    writeAudit({
      action: "payment.checkout",
      actorId: claims.sub,
      traceId: claims.traceId,
      ip: getClientIp(request),
      metadata: {
        paymentIntentId: payment.paymentIntentId,
        amount,
        currency,
        orderId: order.id,
        orderReference: order.reference,
      },
    });

    return jsonOk({
      paymentIntentId: payment.paymentIntentId,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      orderId: order.id,
    });
  } catch (error) {
    if (error instanceof CircuitOpenError) {
      logger.warn("Stripe circuit breaker open", { userId: claims.sub, orderId: order.id });
      return jsonError("Payment service temporarily unavailable", 503, "PAYMENT_UNAVAILABLE");
    }
    return jsonError("Payment initialization failed", 500);
  }
}
