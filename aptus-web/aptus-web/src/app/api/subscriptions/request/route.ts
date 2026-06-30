import { NextRequest, NextResponse } from "next/server";
import { writeAudit } from "@/lib/server/audit-log";
import { resolveProfile } from "@/lib/server/auth-service";
import { getOrderNotificationEmail, isDemoMode } from "@/lib/server/config";
import { getSessionFromRequestOrRefresh, jsonError, jsonOk } from "@/lib/server/http";
import { sendPortalEmail } from "@/lib/server/mail-service";
import { createRenewalRequest } from "@/lib/server/portal-renewal-requests";
import { createSubscriptionRequestLead } from "@/lib/server/odoo/subscription-requests";
import { formatSubscriptionRequestEmail } from "@/lib/server/order-notification";
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

  if (isDemoMode()) {
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

    return jsonOk({
      ok: true,
      mode: "demo",
      reference,
      message,
      showConfirmationModal: requestType === "renew",
      notificationSent: false,
    });
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

    if (requestType === "renew") {
      createRenewalRequest({
        actorId: claims.sub,
        partnerId: profile.partnerId,
        productName,
        orderId,
        lineId,
        renewalDateIso,
        leadId,
        reference,
        status: "Submitted",
      });
    }

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
        reference,
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

    return jsonOk({
      ok: true,
      mode: "live",
      reference,
      leadId,
      message,
      showConfirmationModal: requestType === "renew",
      notificationSent: emailResult.sent,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to submit request";
    return jsonError(message, 500);
  }
}
