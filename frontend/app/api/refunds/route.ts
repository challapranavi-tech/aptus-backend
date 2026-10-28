import { NextRequest, NextResponse } from "next/server";
import { resolveProfile } from "@/lib/server/auth-service";
import { writeAudit } from "@/lib/server/audit-log";
import { getSessionFromRequestOrRefresh, jsonError, jsonOk } from "@/lib/server/http";
import { notifyRefundRequested } from "@/lib/server/refund-notification";
import { createRefundRequest, listRefundsForPartner } from "@/lib/server/refund-store";
import { refundRequestSchema, validationErrorResponse } from "@/lib/server/validation";

export async function GET(request: NextRequest) {
  const claims = await getSessionFromRequestOrRefresh(request);
  if (!claims) {
    return jsonError("Not authenticated", 401);
  }

  const profile = await resolveProfile(claims);
  if (!profile?.partnerId) {
    return jsonOk({ refunds: [] });
  }

  return jsonOk({ refunds: listRefundsForPartner(profile.partnerId) }, 200, { "Cache-Control": "no-store" });
}

/** Event 15 — Refund Requested. */
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

  const parsed = refundRequestSchema.safeParse(body);
  if (!parsed.success) {
    const validation = validationErrorResponse(parsed.error);
    return NextResponse.json(
      { error: validation.error, code: "VALIDATION_ERROR", issues: validation.issues },
      { status: 400 },
    );
  }

  const profile = await resolveProfile(claims);
  if (!profile?.partnerId) {
    return jsonError("No linked Odoo partner for this account", 400);
  }

  const refund = createRefundRequest({
    partnerId: profile.partnerId,
    actorId: claims.sub,
    orderReference: parsed.data.orderReference,
    productName: parsed.data.productName,
    amount: parsed.data.amount,
    reason: parsed.data.reason,
  });

  writeAudit({
    action: "refund.request",
    actorId: claims.sub,
    targetId: refund.id,
    metadata: {
      reference: refund.reference,
      orderReference: refund.orderReference,
      productName: refund.productName,
      amount: refund.amount,
    },
  });

  await notifyRefundRequested(refund);

  return jsonOk({
    ok: true,
    refund,
    message:
      "Your refund request has been received. Our team will review it and be in touch — processing typically takes 5-7 business days once approved.",
  });
}
