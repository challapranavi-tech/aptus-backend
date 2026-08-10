import { NextRequest, NextResponse } from "next/server";
import { writeAudit } from "@/lib/server/audit-log";
import { resolveProfile } from "@/lib/server/auth-service";
import { getOrderNotificationEmail, isDemoMode } from "@/lib/server/config";
import { getSessionFromRequestOrRefresh, jsonError, jsonOk } from "@/lib/server/http";
import { sendPortalEmail } from "@/lib/server/mail-service";
import { createRenewalRequest } from "@/lib/server/portal-renewal-requests";
import { createSubscriptionRequestLead } from "@/lib/server/odoo/subscription-requests";
import { formatSubscriptionRequestEmail } from "@/lib/server/order-notification";
import {
  buildSubscriptionRequestIdempotencyKey,
  claimSubscriptionRequestIdempotency,
  rememberSubscriptionRequestIdempotency,
  releaseSubscriptionRequestIdempotency,
} from "@/lib/server/portal-orders";
import { RENEWAL_SUBMITTED_MESSAGE } from "@/lib/server/renewal-confirmation";
import {
  subscriptionRequestSchema,
  validationErrorResponse,
} from "@/lib/server/validation";

function customerMessage(requestType: string): string {
  if (requestType === "renew") {
    return RENEWAL_SUBMITTED_MESSAGE;
  }
  return `Your ${requestType} request has been submitted. Our team will respond within 48 hours.`;
}

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

  const parsed = subscriptionRequestSchema.safeParse(body);
  if (!parsed.success) {
    const validation = validationErrorResponse(parsed.error);
    return NextResponse.json(
      { error: validation.error, code: "VALIDATION_ERROR", issues: validation.issues },
      { status: 400 },
    );
  }

  const profile = await resolveProfile(claims);
  if (!profile) {
    return jsonError("Profile not found", 404);
  }

  const { productName, requestType, orderId, lineId, renewalDateIso, notes } = parsed.data;
  const reference = `REQ-${requestType.toUpperCase()}-${Date.now()}`;
  const notification = formatSubscriptionRequestEmail({
    customerName: profile.name,
    company: profile.company ?? "",
    email: profile.email,
    phone: profile.phone ?? "",
    productName,
    requestType,
    orderId,
    notes,
    reference,
  });
  const notifyEmail = getOrderNotificationEmail();
  const message = customerMessage(requestType);

  let claimedIdempotency = false;
  let idempotencyKey = "";
  if (profile.partnerId) {
    idempotencyKey = buildSubscriptionRequestIdempotencyKey({
      partnerId: profile.partnerId,
      productName,
      requestType,
      orderId,
      lineId,
    });
    const claim = await claimSubscriptionRequestIdempotency(profile.partnerId, idempotencyKey);
    if (claim.outcome === "duplicate") {
      return jsonOk({
        ok: true,
        mode: isDemoMode() ? "demo" : "live",
        reference: claim.reference,
        duplicate: true,
        message,
        showConfirmationModal: requestType === "renew",
        notificationSent: false,
      });
    }
    if (claim.outcome === "in_progress") {
      return jsonOk({
        ok: true,
        mode: isDemoMode() ? "demo" : "live",
        reference: `REQ-PENDING`,
        duplicate: true,
        message,
        showConfirmationModal: requestType === "renew",
        notificationSent: false,
      });
    }
    claimedIdempotency = true;
  }

  if (isDemoMode()) {
    try {
      if (requestType === "renew" && profile.partnerId) {
        createRenewalRequest({
          actorId: claims.sub,
          partnerId: profile.partnerId,
          productName,
          orderId,
          lineId,
          renewalDateIso,
          reference,
          status: "Submitted",
        });
      }

      writeAudit({
        action: "subscription.request",
        actorId: claims.sub,
        metadata: {
          mode: "demo",
          reference,
          requestType,
          productName,
          notifyEmail,
          subject: notification.subject,
        },
      });

      if (claimedIdempotency && profile.partnerId) {
        await rememberSubscriptionRequestIdempotency(profile.partnerId, idempotencyKey, reference);
      }

      return jsonOk({
        ok: true,
        mode: "demo",
        reference,
        message,
        showConfirmationModal: requestType === "renew",
        notificationSent: false,
      });
    } catch (error) {
      if (claimedIdempotency && profile.partnerId) {
        await releaseSubscriptionRequestIdempotency(profile.partnerId, idempotencyKey);
      }
      throw error;
    }
  }

  if (!profile.partnerId) {
    return jsonError("No linked Odoo partner for this account", 400);
  }

  try {
    const leadId = await createSubscriptionRequestLead({
      partnerId: profile.partnerId,
      productName,
      requestType,
      orderId,
      notes,
    });

    const finalReference =
      requestType === "renew" ? `REQ-RENEW-${leadId}` : `REQ-${requestType.toUpperCase()}-${leadId}`;

    const emailResult = await sendPortalEmail({
      to: notifyEmail,
      subject: notification.subject,
      body: notification.body,
      replyTo: profile.email,
    });

    writeAudit({
      action: "subscription.request",
      actorId: claims.sub,
      targetId: String(leadId),
      metadata: {
        mode: "live",
        reference: finalReference,
        requestType,
        productName,
        leadId,
        notifyEmail,
        emailChannel: emailResult.channel,
        notificationSent: emailResult.sent,
      },
    });

    if (emailResult.sent) {
      writeAudit({
        action: "notification.email",
        actorId: claims.sub,
        targetId: String(leadId),
        metadata: {
          subject: notification.subject,
          to: notifyEmail,
          channel: emailResult.channel,
        },
      });
    }

    await rememberSubscriptionRequestIdempotency(profile.partnerId, idempotencyKey, finalReference);

    return jsonOk({
      ok: true,
      mode: "live",
      reference: finalReference,
      leadId,
      message,
      showConfirmationModal: requestType === "renew",
      notificationSent: emailResult.sent,
    });
  } catch (error) {
    if (claimedIdempotency) {
      await releaseSubscriptionRequestIdempotency(profile.partnerId, idempotencyKey);
    }
    const errMessage = error instanceof Error ? error.message : "Failed to submit request";
    return jsonError(errMessage, 500);
  }
}
