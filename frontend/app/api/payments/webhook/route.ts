import { NextRequest } from "next/server";
import { writeAudit } from "@/lib/server/audit-log";
import { getStripeConfig } from "@/lib/server/config";
import { logger } from "@/lib/server/logger";
import {
  enqueueWebhookFailure,
  findPaymentByPaymentIntentId,
  markStripeWebhookEventProcessed,
  savePayment,
  verifyStripeWebhookSignature,
  wasStripeWebhookEventProcessed,
  type PaymentRecord,
} from "@/lib/server/stripe";
import { jsonError, jsonOk } from "@/lib/server/http";
import { recordPortalOrderPayment, recordPortalOrderPaymentFailed } from "@/lib/server/portal-orders";
import { markPartnerOrderPaymentPaid, markPartnerOrderPaymentFailed, resolvePartnerOrder } from "@/lib/server/odoo/orders";
import { isDemoMode } from "@/lib/server/config";
import { notifySubscriptionConfirmedIfNeeded, notifyPaymentFailed } from "@/lib/server/subscription-confirmation";
import { randomUUID } from "crypto";

type StripeWebhookEvent = {
  id: string;
  type: string;
  data: {
    object: {
      id: string;
      status: string;
      amount: number;
      currency: string;
      metadata?: Record<string, string>;
    };
  };
};

export async function POST(request: NextRequest) {
  const config = getStripeConfig();
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature") ?? "";

  if (config?.webhookSecret) {
    if (!verifyStripeWebhookSignature(payload, signature, config.webhookSecret)) {
      logger.warn("Stripe webhook signature verification failed");
      return jsonError("Invalid webhook signature", 400, "INVALID_SIGNATURE");
    }
  } else if (process.env.NODE_ENV === "production") {
    return jsonError("Webhook secret not configured", 500);
  }

  let event: StripeWebhookEvent;

  try {
    event = JSON.parse(payload) as StripeWebhookEvent;
  } catch {
    return jsonError("Invalid payload", 400);
  }

  if (event.id && wasStripeWebhookEventProcessed(event.id)) {
    logger.info("Stripe webhook duplicate ignored", { eventId: event.id, type: event.type });
    return jsonOk({ received: true, duplicate: true });
  }

  try {
    if (event.type === "payment_intent.succeeded" || event.type === "payment_intent.payment_failed") {
      const intent = event.data.object;
      const existing = findPaymentByPaymentIntentId(intent.id);
      if (existing && existing.status === intent.status) {
        if (event.id) markStripeWebhookEventProcessed(event.id);
        return jsonOk({ received: true, duplicate: true });
      }

      const record: PaymentRecord = {
        id: existing?.id ?? randomUUID(),
        paymentIntentId: intent.id,
        status: intent.status,
        amount: intent.amount,
        currency: intent.currency,
        userId: intent.metadata?.userId ?? existing?.userId,
        idempotencyKey: intent.id,
        createdAt: existing?.createdAt ?? new Date().toISOString(),
      };
      savePayment(record);

      if (
        event.type === "payment_intent.succeeded" &&
        intent.metadata?.orderId &&
        intent.metadata?.partnerId
      ) {
        const partnerId = Number(intent.metadata.partnerId);
        const amountPaid = intent.amount / 1000;
        if (!Number.isNaN(partnerId)) {
          let updated = null;
          if (isDemoMode()) {
            updated = recordPortalOrderPayment(intent.metadata.orderId, partnerId, {
              paymentIntentId: intent.id,
              amountPaid: Number.isFinite(amountPaid) ? amountPaid : intent.amount,
              paymentMethod: "Stripe",
            });
          } else {
            const saleOrderId = intent.metadata.saleOrderId
              ? Number(intent.metadata.saleOrderId)
              : null;
            const order =
              saleOrderId && Number.isFinite(saleOrderId)
                ? await resolvePartnerOrder(partnerId, `odoo-so-${saleOrderId}`)
                : await resolvePartnerOrder(partnerId, intent.metadata.orderId);
            if (order?.saleOrderId) {
              updated = await markPartnerOrderPaymentPaid({
                saleOrderId: order.saleOrderId,
                paymentMethod: "Stripe",
                paymentIntentId: intent.id,
                amountPaid: Number.isFinite(amountPaid) ? amountPaid : intent.amount,
              });
            }
          }
          if (updated) {
            await notifySubscriptionConfirmedIfNeeded(updated, intent.metadata.userId);
          }
        }
      }

      if (event.type === "payment_intent.payment_failed") {
        const partnerIdRaw = intent.metadata?.partnerId;
        const partnerId = partnerIdRaw ? Number(partnerIdRaw) : undefined;
        const failureReason =
          (intent as unknown as { last_payment_error?: { message?: string } }).last_payment_error
            ?.message ?? undefined;
        const orderRef = intent.metadata?.orderId ?? intent.id;

        if (partnerId != null && Number.isFinite(partnerId) && intent.metadata?.orderId) {
          try {
            if (isDemoMode()) {
              recordPortalOrderPaymentFailed(intent.metadata.orderId, partnerId, {
                paymentIntentId: intent.id,
                reason: failureReason,
              });
            } else {
              const saleOrderId = intent.metadata.saleOrderId
                ? Number(intent.metadata.saleOrderId)
                : null;
              const order =
                saleOrderId && Number.isFinite(saleOrderId)
                  ? await resolvePartnerOrder(partnerId, `odoo-so-${saleOrderId}`)
                  : await resolvePartnerOrder(partnerId, intent.metadata.orderId);
              if (order?.saleOrderId) {
                await markPartnerOrderPaymentFailed({
                  saleOrderId: order.saleOrderId,
                  paymentIntentId: intent.id,
                  reason: failureReason,
                });
              }
            }
          } catch (error) {
            logger.warn("Failed to mark order payment failed", {
              orderId: intent.metadata.orderId,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }

        await notifyPaymentFailed({
          partnerId: partnerId != null && Number.isFinite(partnerId) ? partnerId : undefined,
          actorId: intent.metadata?.userId,
          reference: orderRef,
          amount: `${(intent.amount / 1000).toFixed(2)} ${intent.currency?.toUpperCase() ?? ""}`.trim(),
          reason: failureReason,
        });
      }

      writeAudit({
        action: "payment.webhook",
        actorId: intent.metadata?.userId,
        metadata: { type: event.type, paymentIntentId: intent.id, status: intent.status, eventId: event.id },
      });

      logger.info("Stripe webhook processed", { type: event.type, paymentIntentId: intent.id, eventId: event.id });
    }

    if (event.id) markStripeWebhookEventProcessed(event.id);
    return jsonOk({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook processing failed";
    enqueueWebhookFailure({ type: event.type, eventId: event.id }, message);
    logger.error("Webhook processing failed — queued to DLQ", { error: message });
    return jsonError("Webhook processing failed", 500);
  }
}
