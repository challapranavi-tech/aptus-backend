import { NextRequest, NextResponse } from "next/server";
import { isAdminClaims } from "@/lib/server/admin-auth";
import { writeAudit } from "@/lib/server/audit-log";
import { getSessionFromRequestOrRefresh, jsonError, jsonOk } from "@/lib/server/http";
import { notifyRefundProcessed } from "@/lib/server/refund-notification";
import { getRefundById, updateRefundStatus } from "@/lib/server/refund-store";
import { refundProcessSchema, validationErrorResponse } from "@/lib/server/validation";

type RouteContext = { params: Promise<{ id: string }> };

/** Event 16 — Refund Processed (fires when action = "process"). */
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

  const parsed = refundProcessSchema.safeParse(body);
  if (!parsed.success) {
    const validation = validationErrorResponse(parsed.error);
    return NextResponse.json(
      { error: validation.error, code: "VALIDATION_ERROR", issues: validation.issues },
      { status: 400 },
    );
  }

  const existing = getRefundById(id);
  if (!existing) {
    return jsonError("Refund request not found", 404);
  }

  if (parsed.data.action === "reject") {
    const updated = updateRefundStatus(id, "Rejected", { rejectReason: parsed.data.rejectReason });
    writeAudit({
      action: "refund.reject",
      actorId: claims.sub,
      targetId: id,
      metadata: { reference: existing.reference, reason: parsed.data.rejectReason },
    });
    return jsonOk({ ok: true, refund: updated });
  }

  const updated = updateRefundStatus(id, "Processed", {
    paymentMethod: parsed.data.paymentMethod,
    estimatedArrival: parsed.data.estimatedArrival,
  });
  if (!updated) {
    return jsonError("Refund request not found", 404);
  }

  writeAudit({
    action: "refund.process",
    actorId: claims.sub,
    targetId: id,
    metadata: { reference: updated.reference },
  });

  await notifyRefundProcessed(updated, claims.sub);

  return jsonOk({ ok: true, refund: updated });
}

export async function GET(request: NextRequest, context: RouteContext) {
  const claims = await getSessionFromRequestOrRefresh(request);
  if (!claims) {
    return jsonError("Not authenticated", 401);
  }
  if (!isAdminClaims(claims)) {
    return jsonError("Admin access required", 403);
  }

  const { id } = await context.params;
  const refund = getRefundById(id);
  if (!refund) {
    return jsonError("Refund request not found", 404);
  }

  return jsonOk({ refund });
}
