import { NextRequest } from "next/server";
import { isAdminClaims } from "@/lib/server/admin-auth";
import { writeAudit } from "@/lib/server/audit-log";
import { isDemoMode } from "@/lib/server/config";
import { getSessionFromRequestOrRefresh, jsonError, jsonOk } from "@/lib/server/http";
import { getOdooClient } from "@/lib/server/odoo/client";
import {
  markPartnerOrderPaymentPaid,
  resolvePartnerOrder,
} from "@/lib/server/odoo/orders";
import { getPortalOrderById, recordPortalOrderPayment } from "@/lib/server/portal-orders";
import { notifyPurchaseApprovedIfNeeded } from "@/lib/server/subscription-confirmation";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Finance/admin approval step for a bank-transfer order: marks it paid in Odoo
 * and triggers Purchase Approved email. Odoo UI confirmation is also detected on
 * the next portal orders fetch via invoice_status / subscription_state / note tags.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const claims = await getSessionFromRequestOrRefresh(request);
  if (!claims) {
    return jsonError("Not authenticated", 401);
  }

  if (!isAdminClaims(claims)) {
    return jsonError("Admin access required", 403);
  }

  const { id } = await context.params;

  if (isDemoMode()) {
    const existing = getPortalOrderById(id);
    if (!existing) {
      return jsonError("Order not found", 404);
    }
    if (existing.paymentStatus !== "pending_verification") {
      return jsonError(
        "This order has no bank transfer payment awaiting verification",
        400,
        "NOT_PENDING_VERIFICATION",
      );
    }

    const updated = recordPortalOrderPayment(existing.id, existing.partnerId, {
      paymentIntentId: existing.bankTransferReference ?? `bank-transfer-${existing.id}`,
      amountPaid: existing.amountDue ?? 0,
      paymentMethod: "Bank Transfer",
    });
    if (!updated) {
      return jsonError("Failed to record payment", 500);
    }

    writeAudit({
      action: "order.payment_complete",
      actorId: claims.sub,
      targetId: updated.id,
      metadata: {
        mode: "demo",
        reference: updated.reference,
        bankTransferReference: updated.bankTransferReference,
        verifiedBy: claims.email,
      },
    });

    await notifyPurchaseApprovedIfNeeded(updated, claims.sub);
    return jsonOk({ ok: true, order: updated });
  }

  const client = getOdooClient();
  if (!client) {
    return jsonError("Odoo is not configured", 503);
  }

  let existing = null;
  if (id.startsWith("odoo-so-") || id.startsWith("SO-")) {
    const saleOrderId = Number(id.replace(/^odoo-so-|^SO-/i, ""));
    if (Number.isFinite(saleOrderId)) {
      const rows = await client.read<{ partner_id: [number, string] | false }>(
        "sale.order",
        [saleOrderId],
        ["partner_id"],
      );
      const partnerId = Array.isArray(rows[0]?.partner_id) ? rows[0].partner_id[0] : null;
      if (partnerId) existing = await resolvePartnerOrder(partnerId, `odoo-so-${saleOrderId}`);
    }
  }

  if (!existing?.saleOrderId) {
    return jsonError("Order not found in Odoo", 404);
  }

  if (existing.paymentStatus !== "pending_verification") {
    return jsonError(
      "This order has no bank transfer payment awaiting verification",
      400,
      "NOT_PENDING_VERIFICATION",
    );
  }

  const updated = await markPartnerOrderPaymentPaid({
    saleOrderId: existing.saleOrderId,
    paymentMethod: "Bank Transfer",
    paymentIntentId: existing.bankTransferReference ?? `bank-transfer-${existing.id}`,
    amountPaid: existing.amountDue ?? 0,
    bankTransferReference: existing.bankTransferReference,
    attachmentId: existing.paymentProofOdooAttachmentId,
    fileName: existing.paymentProofFileName,
  });

  if (!updated) {
    return jsonError("Failed to record payment in Odoo", 500);
  }

  writeAudit({
    action: "order.payment_complete",
    actorId: claims.sub,
    targetId: updated.id,
    metadata: {
      mode: "live",
      reference: updated.reference,
      bankTransferReference: updated.bankTransferReference,
      verifiedBy: claims.email,
    },
  });

  await notifyPurchaseApprovedIfNeeded(updated, claims.sub);

  return jsonOk({ ok: true, order: updated });
}
