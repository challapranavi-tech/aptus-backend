import { NextRequest, NextResponse } from "next/server";
import { isAdminClaims } from "@/lib/server/admin-auth";
import { writeAudit } from "@/lib/server/audit-log";
import { getOrderNotificationEmail } from "@/lib/server/config";
import { getSessionFromRequestOrRefresh, jsonError, jsonOk } from "@/lib/server/http";
import { sendPortalEmail } from "@/lib/server/mail-service";
import {
  getRenewalRequestById,
  updateRenewalRequestStatus,
} from "@/lib/server/portal-renewal-requests";
import { notifyRenewalConfirmedIfNeeded } from "@/lib/server/renewal-confirmation";
import { validationErrorResponse, adminRenewalStatusSchema } from "@/lib/server/validation";

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
  const existing = getRenewalRequestById(id);
  if (!existing) {
    return jsonError("Renewal request not found", 404);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body", 400);
  }

  const parsed = adminRenewalStatusSchema.safeParse(body);
  if (!parsed.success) {
    const validation = validationErrorResponse(parsed.error);
    return NextResponse.json(
      { error: validation.error, code: "VALIDATION_ERROR", issues: validation.issues },
      { status: 400 },
    );
  }

  const updated = updateRenewalRequestStatus(id, parsed.data.status);
  if (!updated) {
    return jsonError("Failed to update renewal request", 500);
  }

  writeAudit({
    action: "subscription.request",
    actorId: claims.sub,
    targetId: id,
    metadata: {
      reference: updated.reference,
      previousStatus: existing.status,
      newStatus: parsed.data.status,
      action: "renewal.status_update",
    },
  });

  const notifyEmail = getOrderNotificationEmail();
  if (parsed.data.status === "Approved" || parsed.data.status === "Rejected") {
    const emailResult = await sendPortalEmail({
      to: notifyEmail,
      subject: `[Aptus Portal] Renewal ${updated.reference} ${parsed.data.status}`,
      body: [
        `Renewal request ${updated.reference} for ${updated.productName} was marked as ${parsed.data.status} by ${claims.email}.`,
      ].join("\n"),
    });

    if (emailResult.sent) {
      writeAudit({
        action: "notification.email",
        actorId: claims.sub,
        targetId: id,
        metadata: {
          subject: `[Aptus Portal] Renewal ${updated.reference} ${parsed.data.status}`,
          to: notifyEmail,
          channel: emailResult.channel,
        },
      });
    }
  }

  if (parsed.data.status === "Approved" && existing.status !== "Approved") {
    await notifyRenewalConfirmedIfNeeded(updated, claims.sub, existing.status);
  }

  return jsonOk({ ok: true, request: updated });
}
