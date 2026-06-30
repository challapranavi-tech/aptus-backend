import { NextRequest, NextResponse } from "next/server";
import { writeAudit } from "@/lib/server/audit-log";
import { resolveProfile } from "@/lib/server/auth-service";
import { CANCELLATION_SUCCESS_MESSAGE } from "@/lib/server/cancellation-confirmation";
import { isDemoMode } from "@/lib/server/config";
import {
  cancelSubscriptionLeads,
  findSubscriptionLeads,
  findSubscriptionOpportunityLeads,
} from "@/lib/server/odoo/leads";
import { cancelPortalSaleOrders, findPortalSaleOrders } from "@/lib/server/odoo/sales";
import { closePartnerSubscription } from "@/lib/server/odoo/subscriptions";
import { getSessionFromRequestOrRefresh, jsonError, jsonOk } from "@/lib/server/http";
import {
  subscriptionCancelSchema,
  validationErrorResponse,
} from "@/lib/server/validation";

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

  const parsed = subscriptionCancelSchema.safeParse(body);
  if (!parsed.success) {
    const validation = validationErrorResponse(parsed.error);
    return NextResponse.json(
      { error: validation.error, code: "VALIDATION_ERROR", issues: validation.issues },
      { status: 400 },
    );
  }

  const { productName, orderId, leadId, saleOrderId } = parsed.data;
  const profile = await resolveProfile(claims);
  if (!profile) {
    return jsonError("Profile not found", 404);
  }

  if (isDemoMode()) {
    writeAudit({
      action: "subscription.cancel",
      actorId: claims.sub,
      metadata: {
        mode: "demo",
        productName,
        orderId: orderId ?? null,
      },
    });

    return jsonOk({
      ok: true,
      mode: "demo",
      message: CANCELLATION_SUCCESS_MESSAGE,
      subscriptionClosed: Boolean(orderId),
      leadsCancelled: 0,
      ordersCancelled: 0,
      showConfirmationModal: true,
    });
  }

  if (!profile.partnerId) {
    return jsonError("No linked Odoo partner for this account", 400);
  }

  try {
    let subscriptionClosed = false;

    if (orderId) {
      subscriptionClosed = await closePartnerSubscription(profile.partnerId, orderId);
    }

    const leadIds = leadId
      ? [leadId]
      : [
          ...new Set([
            ...(await findSubscriptionOpportunityLeads(profile.partnerId, productName)),
            ...(await findSubscriptionLeads(profile.partnerId, productName)),
          ]),
        ];

    const saleOrderIds = saleOrderId
      ? [saleOrderId]
      : await findPortalSaleOrders(profile.partnerId, productName);

    const leadsCancelled = await cancelSubscriptionLeads(leadIds);
    const ordersCancelled = await cancelPortalSaleOrders(saleOrderIds);

    writeAudit({
      action: "subscription.cancel",
      actorId: claims.sub,
      targetId: orderId ? String(orderId) : undefined,
      metadata: {
        mode: "live",
        productName,
        orderId: orderId ?? null,
        subscriptionClosed,
        leadsCancelled,
        ordersCancelled,
        leadIds,
        saleOrderIds,
      },
    });

    if (!subscriptionClosed && !leadsCancelled && !ordersCancelled) {
      return jsonOk({
        ok: true,
        mode: "live",
        message: `No open records found for ${productName}. It may already be closed.`,
        subscriptionClosed,
        leadsCancelled,
        ordersCancelled,
        showConfirmationModal: false,
      });
    }

    const parts: string[] = [];
    if (subscriptionClosed) {
      parts.push("Subscription closed");
    }
    if (leadsCancelled) {
      parts.push(
        `${leadsCancelled} CRM ${leadsCancelled === 1 ? "opportunity" : "opportunities"} marked as Lost`,
      );
    }
    if (ordersCancelled) {
      parts.push(
        `${ordersCancelled} sales ${ordersCancelled === 1 ? "quotation" : "quotations"} cancelled`,
      );
    }

    return jsonOk({
      ok: true,
      mode: "live",
      message: parts.length ? `${parts.join("; ")}.` : CANCELLATION_SUCCESS_MESSAGE,
      subscriptionClosed,
      leadsCancelled,
      ordersCancelled,
      leadIds,
      saleOrderIds,
      showConfirmationModal: subscriptionClosed || leadsCancelled > 0,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to cancel subscription in Odoo";
    return jsonError(message, 500);
  }
}
