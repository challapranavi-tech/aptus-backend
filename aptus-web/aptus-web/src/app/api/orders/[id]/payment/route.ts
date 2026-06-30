import { NextRequest, NextResponse } from "next/server";
import { writeAudit } from "@/lib/server/audit-log";
import { resolveProfile } from "@/lib/server/auth-service";
import { getSessionFromRequestOrRefresh, jsonError, jsonOk } from "@/lib/server/http";
import { getClientIp } from "@/lib/server/logger";
import {
  recordPortalOrderPayment,
  resolveOrderLeadId,
  resolvePortalOrderForPartner,
  upsertPortalOrderSnapshot,
} from "@/lib/server/portal-orders";
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

  let order = resolvePortalOrderForPartner(id, profile.partnerId);
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

  const updated = recordPortalOrderPayment(order.id, profile.partnerId, {
    paymentIntentId: parsed.data.paymentIntentId,
    amountPaid: parsed.data.amountPaid,
    paymentMethod: parsed.data.paymentMethod,
  });

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
