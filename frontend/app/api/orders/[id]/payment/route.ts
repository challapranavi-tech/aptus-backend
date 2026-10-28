import { NextRequest, NextResponse } from "next/server";
import { writeAudit } from "@/lib/server/audit-log";
import { resolveProfile } from "@/lib/server/auth-service";
import { isDemoMode } from "@/lib/server/config";
import { getSessionFromRequestOrRefresh, jsonError, jsonOk } from "@/lib/server/http";
import { getClientIp } from "@/lib/server/logger";
import {
  markPartnerOrderPaymentPaid,
  resolveOrderLeadId,
} from "@/lib/server/odoo/orders";
import { recordPortalOrderPayment } from "@/lib/server/portal-orders";
import { resolveOrderForPartner } from "@/lib/server/resolve-order";
import { notifySubscriptionConfirmedIfNeeded } from "@/lib/server/subscription-confirmation";
import { postOrderPaymentMessageToLead } from "@/lib/server/odoo/leads";
import { isOrderEligibleForPayment } from "@/lib/order-status";
import { orderPaymentCompleteSchema, validationErrorResponse } from "@/lib/server/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const claims = await getSessionFromRequestOrRefresh(request);
  if (!claims) {
    return jsonError("Not authenticated", 401);
  }

  const profile = await resolveProfile(claims);
  if (!profile?.partnerId) {
    return jsonError("No linked partner for this account", 400);
  }

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body", 400);
  }

  const parsed = orderPaymentCompleteSchema.safeParse(body);
  if (!parsed.success) {
    const validation = validationErrorResponse(parsed.error);
    return NextResponse.json(
      { error: validation.error, code: "VALIDATION_ERROR", issues: validation.issues },
      { status: 400 },
    );
  }

  const order = await resolveOrderForPartner({
    orderId: id,
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

  let updated = null;

  if (isDemoMode()) {
    updated = recordPortalOrderPayment(order.id, profile.partnerId, {
      paymentIntentId: parsed.data.paymentIntentId,
      amountPaid: parsed.data.amountPaid,
      paymentMethod: parsed.data.paymentMethod,
    });
  } else {
    if (!order.saleOrderId) {
      return jsonError("Order has no linked Odoo sale order", 400);
    }
    updated = await markPartnerOrderPaymentPaid({
      saleOrderId: order.saleOrderId,
      paymentMethod: parsed.data.paymentMethod,
      paymentIntentId: parsed.data.paymentIntentId,
      amountPaid: parsed.data.amountPaid,
      bankTransferReference: order.bankTransferReference,
      attachmentId: order.paymentProofOdooAttachmentId,
      fileName: order.paymentProofFileName,
    });
  }

  if (!updated) {
    return jsonError("Failed to record payment", 500);
  }

  writeAudit({
    action: "order.payment_complete",
    actorId: claims.sub,
    targetId: updated.id,
    ip: getClientIp(request),
    metadata: {
      reference: updated.reference,
      paymentIntentId: parsed.data.paymentIntentId,
      amountPaid: parsed.data.amountPaid,
    },
  });

  await notifySubscriptionConfirmedIfNeeded(updated, claims.sub);

  const customerMessage = parsed.data.customerMessage;
  const leadId = resolveOrderLeadId(updated);
  if (customerMessage && leadId) {
    await postOrderPaymentMessageToLead({
      leadId,
      orderReference: updated.reference,
      message: customerMessage,
      paymentMethod: parsed.data.paymentMethod,
      amountPaid: parsed.data.amountPaid,
    });
  }

  return jsonOk({ ok: true, order: updated });
}
