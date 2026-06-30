import { NextRequest, NextResponse } from "next/server";
import { isAdminClaims } from "@/lib/server/admin-auth";
import { writeAudit } from "@/lib/server/audit-log";
import { getOrderNotificationEmail } from "@/lib/server/config";
import { getSessionFromRequestOrRefresh, jsonError, jsonOk } from "@/lib/server/http";
import { sendPortalEmail } from "@/lib/server/mail-service";
import { getPortalOrderById, updatePortalOrderStatus } from "@/lib/server/portal-orders";
import { notifyOrderApprovedIfNeeded } from "@/lib/server/subscription-confirmation";
import {
  adminOrderStatusSchema,
  validationErrorResponse,
} from "@/lib/server/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const claims = await getSessionFromRequestOrRefresh(request);
  if (!claims) {
    return jsonError("Not authenticated", 401);
  }

  if (!isAdminClaims(claims)) {
    return jsonError("Admin access required", 403);
  }

  const { id } = await context.params;
  const existing = getPortalOrderById(id);
  if (!existing) {
    return jsonError("Order not found", 404);
  }

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

  return jsonOk({ ok: true, order: updated });
}
