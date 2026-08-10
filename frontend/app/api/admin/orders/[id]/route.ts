import { NextRequest, NextResponse } from "next/server";
import { isAdminClaims } from "@/lib/server/admin-auth";
import { writeAudit } from "@/lib/server/audit-log";
import { getOrderNotificationEmail, isDemoMode } from "@/lib/server/config";
import { getSessionFromRequestOrRefresh, jsonError, jsonOk } from "@/lib/server/http";
import { sendPortalEmail } from "@/lib/server/mail-service";
import { getOdooClient } from "@/lib/server/odoo/client";
import {
  resolvePartnerOrder,
  updatePartnerOrderStatusInOdoo,
} from "@/lib/server/odoo/orders";
import type { PortalOrder as Order } from "@/types/orders";
import { getPortalOrderById, updatePortalOrderStatus } from "@/lib/server/portal-orders";
import {
  notifyOrderApprovedIfNeeded,
  notifyOrderRejectedIfNeeded,
  notifyPurchaseApprovedIfNeeded,
} from "@/lib/server/subscription-confirmation";
import {
  adminOrderStatusSchema,
  validationErrorResponse,
} from "@/lib/server/validation";

type RouteContext = { params: Promise<{ id: string }> };

async function resolveAdminOrder(id: string): Promise<Order | null> {
  const client = getOdooClient();
  if (!client) return null;

  if (id.startsWith("odoo-so-") || id.startsWith("SO-")) {
    const saleOrderId = Number(id.replace(/^odoo-so-|^SO-/i, ""));
    if (!Number.isFinite(saleOrderId)) return null;
    const rows = await client.read<{ partner_id: [number, string] | false }>(
      "sale.order",
      [saleOrderId],
      ["partner_id"],
    );
    const partnerId = Array.isArray(rows[0]?.partner_id) ? rows[0].partner_id[0] : null;
    if (!partnerId) return null;
    return resolvePartnerOrder(partnerId, `odoo-so-${saleOrderId}`);
  }

  if (id.startsWith("odoo-lead-") || id.startsWith("LEAD-")) {
    const leadId = Number(id.replace(/^odoo-lead-|^LEAD-/i, ""));
    if (!Number.isFinite(leadId)) return null;
    const rows = await client.read<{ partner_id: [number, string] | false }>(
      "crm.lead",
      [leadId],
      ["partner_id"],
    );
    const partnerId = Array.isArray(rows[0]?.partner_id) ? rows[0].partner_id[0] : null;
    if (!partnerId) return null;
    return resolvePartnerOrder(partnerId, `odoo-lead-${leadId}`);
  }

  return null;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const claims = await getSessionFromRequestOrRefresh(request);
  if (!claims) {
    return jsonError("Not authenticated", 401);
  }

  if (!isAdminClaims(claims)) {
    return jsonError("Admin access required", 403);
  }

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body", 400);
  }

  const parsed = adminOrderStatusSchema.safeParse(body);
  if (!parsed.success) {
    const validation = validationErrorResponse(parsed.error);
    return NextResponse.json(
      { error: validation.error, code: "VALIDATION_ERROR", issues: validation.issues },
      { status: 400 },
    );
  }

  if (isDemoMode()) {
    const existing = getPortalOrderById(id);
    if (!existing) {
      return jsonError("Order not found", 404);
    }

    const updated = updatePortalOrderStatus(id, parsed.data.status, {
      assignedStaff: parsed.data.assignedStaff,
    });
    if (!updated) {
      return jsonError("Failed to update order", 500);
    }

    writeAudit({
      action: "order.status_update",
      actorId: claims.sub,
      targetId: id,
      metadata: {
        mode: "demo",
        reference: updated.reference,
        previousStatus: existing.status,
        newStatus: parsed.data.status,
        assignedStaff: parsed.data.assignedStaff,
      },
    });

    if (
      parsed.data.status === "Approved" &&
      existing.status !== "Approved" &&
      existing.status !== "Completed"
    ) {
      await notifyOrderApprovedIfNeeded(updated, claims.sub, existing.status);
    }
    if (parsed.data.status === "Completed") {
      await notifyPurchaseApprovedIfNeeded(updated, claims.sub);
    }
    if (parsed.data.status === "Rejected") {
      await notifyOrderRejectedIfNeeded(
        { ...updated, rejectReason: parsed.data.reason ?? updated.rejectReason },
        claims.sub,
      );
    }

    return jsonOk({ ok: true, order: updated });
  }

  const existing = await resolveAdminOrder(id);
  if (!existing) {
    return jsonError("Order not found in Odoo", 404);
  }

  const updated = await updatePartnerOrderStatusInOdoo(existing, parsed.data.status, {
    reason: parsed.data.reason,
  });
  if (!updated) {
    return jsonError("Failed to update order in Odoo", 500);
  }

  writeAudit({
    action: "order.status_update",
    actorId: claims.sub,
    targetId: id,
    metadata: {
      mode: "live",
      reference: updated.reference,
      previousStatus: existing.status,
      newStatus: parsed.data.status,
      assignedStaff: parsed.data.assignedStaff,
    },
  });

  const notifyEmail = getOrderNotificationEmail();
  if (parsed.data.status === "Approved" || parsed.data.status === "Rejected") {
    const emailResult = await sendPortalEmail({
      to: notifyEmail,
      subject: `[Aptus Portal] Order ${updated.reference} ${parsed.data.status}`,
      body: [
        `Order ${updated.reference} was marked as ${parsed.data.status} by ${claims.email}.`,
        parsed.data.assignedStaff ? `Assigned staff: ${parsed.data.assignedStaff}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    });

    if (emailResult.sent) {
      writeAudit({
        action: "notification.email",
        actorId: claims.sub,
        targetId: id,
        metadata: {
          subject: `[Aptus Portal] Order ${updated.reference} ${parsed.data.status}`,
          to: notifyEmail,
          channel: emailResult.channel,
        },
      });
    }
  }

  if (
    parsed.data.status === "Approved" &&
    existing.status !== "Approved" &&
    existing.status !== "Completed"
  ) {
    await notifyOrderApprovedIfNeeded(updated, claims.sub, existing.status);
  }
  if (parsed.data.status === "Completed") {
    await notifyPurchaseApprovedIfNeeded(updated, claims.sub);
  }
  if (parsed.data.status === "Rejected") {
    await notifyOrderRejectedIfNeeded(
      { ...updated, rejectReason: parsed.data.reason ?? updated.rejectReason },
      claims.sub,
    );
  }

  return jsonOk({ ok: true, order: updated });
}
