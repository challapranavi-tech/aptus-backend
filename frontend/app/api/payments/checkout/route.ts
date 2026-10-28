import { NextRequest, NextResponse } from "next/server";
import { writeAudit } from "@/lib/server/audit-log";
import { resolveProfile } from "@/lib/server/auth-service";
import {
  CircuitOpenError,
  PaymentProviderUnavailableError,
  startCheckout,
} from "@/lib/server/payment-providers";
import { getSessionFromRequestOrRefresh, jsonError, jsonOk } from "@/lib/server/http";
import { getClientIp, logger } from "@/lib/server/logger";
import { resolveOrderForPartner } from "@/lib/server/resolve-order";
import { orderPaymentCheckoutSchema, validationErrorResponse } from "@/lib/server/validation";
import { estimateOrderPricing, orderTotalToBaisa } from "@/lib/order-pricing";
import { isOrderEligibleForPayment } from "@/lib/order-status";

/**
 * Starts provider checkout for an approved order — never accepts raw card data.
 * Provider dispatch lives in payment-providers.ts (Stripe today; PayPal later).
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

  const order = await resolveOrderForPartner({
    orderId: parsed.data.orderId,
    partnerId: profile.partnerId,
    actorId: claims.sub,
    snapshot: parsed.data.orderSnapshot as Parameters<
      typeof resolveOrderForPartner
    >[0]["snapshot"],
  });

  if (!order) {
    return jsonError("Order not found", 404);
  }

  if (!isOrderEligibleForPayment(order)) {
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
  const paymentMethod = parsed.data.paymentMethod ?? "stripe";

  try {
    const payment = await startCheckout({
      method: paymentMethod,
      amount,
      currency,
      idempotencyKey,
      userId: claims.sub,
      metadata: {
        orderId: order.id,
        orderReference: order.reference,
        partnerId: String(profile.partnerId),
        saleOrderId: order.saleOrderId != null ? String(order.saleOrderId) : "",
      },
    });

    writeAudit({
      action: "payment.checkout",
      actorId: claims.sub,
      traceId: claims.traceId,
      ip: getClientIp(request),
      metadata: {
        provider: payment.provider,
        paymentIntentId: payment.paymentIntentId,
        amount,
        currency,
        orderId: order.id,
        orderReference: order.reference,
      },
    });

    return jsonOk({
      provider: payment.provider,
      paymentIntentId: payment.paymentIntentId,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      orderId: order.id,
      clientPayload: payment.clientPayload,
    });
  } catch (error) {
    if (error instanceof PaymentProviderUnavailableError) {
      return jsonError(error.message, 400, "PAYMENT_METHOD_UNAVAILABLE");
    }
    if (error instanceof CircuitOpenError) {
      logger.warn("Payment provider circuit breaker open", {
        userId: claims.sub,
        orderId: order.id,
        method: paymentMethod,
      });
      return jsonError("Payment service temporarily unavailable", 503, "PAYMENT_UNAVAILABLE");
    }
    return jsonError("Payment initialization failed", 500);
  }
}
