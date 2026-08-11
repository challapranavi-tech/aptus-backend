import fs from "fs";
import { NextRequest } from "next/server";
import { writeAudit } from "@/lib/server/audit-log";
import { resolveProfile } from "@/lib/server/auth-service";
import { getOdooSaleOrderLink, getOrderNotificationEmail, isDemoMode } from "@/lib/server/config";
import { getSessionFromRequestOrRefresh, jsonError, jsonOk } from "@/lib/server/http";
import { getClientIp, logger } from "@/lib/server/logger";
import { sendPortalEmail } from "@/lib/server/mail-service";
import {
  attachBankTransferProofToLead,
  attachBankTransferProofToSaleOrder,
  createBankTransferSaleOrder,
  isRecoverableSaleOrderCreateError,
} from "@/lib/server/odoo/sales";
import {
  markPartnerOrderPaymentPending,
  resolvePartnerOrder,
} from "@/lib/server/odoo/orders";
import {
  formatBankTransferAdminEmail,
  formatPurchaseRequestSubmittedEmail,
} from "@/lib/server/order-notification";
import { createPortalNotification } from "@/lib/server/portal-notifications";
import { savePaymentProofFile } from "@/lib/server/payment-proof-storage";
import {
  deriveBankTransferReference,
  isAllowedPaymentProofFile,
  PAYMENT_PROOF_MAX_BYTES,
} from "@/lib/server/bank-transfer";
import { isOrderEligibleForPayment } from "@/lib/order-status";
import { estimateOrderPricing, formatOmanAmount } from "@/lib/order-pricing";
import { resolveOrderForPartner } from "@/lib/server/resolve-order";
import {
  claimBankTransferSubmission,
  releaseBankTransferSubmission,
  upsertPortalOrderSnapshot,
} from "@/lib/server/portal-orders";
import type { PortalOrder } from "@/types/orders";

function getPortalBaseUrl(): string {
  return (process.env.PORTAL_BASE_URL?.trim() || "https://aptusinfotech.com").replace(/\/$/, "");
}

type RouteContext = { params: Promise<{ id: string }> };

function parseOrderSnapshot(raw: FormDataEntryValue | null): PortalOrder | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  try {
    return JSON.parse(raw) as PortalOrder;
  } catch {
    return null;
  }
}

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

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError("Invalid upload — expected multipart form data", 400);
  }

  const confirmed = formData.get("confirmed") === "true";
  const orderSnapshot = parseOrderSnapshot(formData.get("orderSnapshot"));
  const file = formData.get("file");

  if (!confirmed) {
    return jsonError(
      "Please confirm that you have transferred the payment before submitting.",
      400,
      "CONFIRMATION_REQUIRED",
    );
  }

  if (!(file instanceof File) || file.size === 0) {
    return jsonError(
      "Please attach your payment proof (PDF, JPG, JPEG, or PNG).",
      400,
      "PROOF_REQUIRED",
    );
  }

  if (file.size > PAYMENT_PROOF_MAX_BYTES) {
    return jsonError("File is too large. Maximum size is 10 MB.", 400, "FILE_TOO_LARGE");
  }

  if (!isAllowedPaymentProofFile({ type: file.type, name: file.name })) {
    return jsonError(
      "Unsupported file type. Please upload a PDF, JPG, JPEG, or PNG file.",
      400,
      "UNSUPPORTED_FILE_TYPE",
    );
  }

  let order = await resolveOrderForPartner({
    orderId: id,
    partnerId: profile.partnerId,
    actorId: claims.sub,
    snapshot: orderSnapshot,
  });

  if (!order) {
    return jsonError("Order not found", 404);
  }

  if (order.paymentStatus === "pending_verification") {
    return jsonOk({
      ok: true,
      duplicate: true,
      reference: order.reference,
      bankTransferReference: order.bankTransferReference ?? deriveBankTransferReference(order),
      message:
        "Payment proof already submitted. Finance will confirm within 2–3 business days.",
    });
  }

  if (order.paymentStatus === "paid" || order.status === "Completed") {
    return jsonError("This order is already paid", 400, "ALREADY_PAID");
  }

  if (!isOrderEligibleForPayment(order)) {
    return jsonError("This order is not ready for payment yet", 400, "PAYMENT_NOT_ALLOWED");
  }

  const locked = await claimBankTransferSubmission(order.id);
  if (!locked) {
    // Lock means "in flight", not "already succeeded". Only report duplicate
    // when the order itself is already pending verification.
    const latest = await resolveOrderForPartner({
      orderId: id,
      partnerId: profile.partnerId,
      actorId: claims.sub,
      snapshot: orderSnapshot,
    });
    if (latest?.paymentStatus === "pending_verification") {
      return jsonOk({
        ok: true,
        duplicate: true,
        reference: latest.reference,
        bankTransferReference: latest.bankTransferReference ?? deriveBankTransferReference(latest),
        message:
          "Payment proof already submitted. Finance will confirm within 2–3 business days.",
      });
    }
    return jsonError(
      "Your payment proof is still being processed. Please wait a moment and try again.",
      409,
      "SUBMISSION_IN_PROGRESS",
    );
  }

  const bankTransferReference = order.bankTransferReference ?? deriveBankTransferReference(order);
  const pricing = estimateOrderPricing(order);
  const totalAmount = order.amountDue ?? pricing?.total;

  let stored;
  try {
    stored = await savePaymentProofFile(order.id, file);
  } catch (error) {
    await releaseBankTransferSubmission(order.id);
    const message = error instanceof Error ? error.message : String(error);
    logger.error("Failed to store payment proof", {
      orderId: order.id,
      error: message,
    });
    if (/content does not match|must be one of/i.test(message)) {
      return jsonError(message, 400, "UNSUPPORTED_FILE_TYPE");
    }
    return jsonError("Could not save your upload. Please try again.", 500, "UPLOAD_FAILED");
  }

  let saleOrderId = order.saleOrderId;
  let odooAttachmentId: number | undefined;

  if (!isDemoMode()) {
    try {
      if (!saleOrderId) {
        try {
          saleOrderId = await createBankTransferSaleOrder({
            partnerId: profile.partnerId,
            duration: order.duration,
            lines: order.items,
            bankTransferReference,
            orderReference: order.reference,
          });
        } catch (createError) {
          const leadId = order.leadId;
          if (leadId && isRecoverableSaleOrderCreateError(createError)) {
            logger.warn("Sale order create unavailable — recording bank transfer on CRM lead", {
              orderId: order.id,
              leadId,
              error: createError instanceof Error ? createError.message : String(createError),
            });
          } else {
            throw createError;
          }
        }
      }

      const base64Content = fs.readFileSync(stored.filePath).toString("base64");

      if (saleOrderId) {
        odooAttachmentId =
          (await attachBankTransferProofToSaleOrder({
            saleOrderId,
            fileName: stored.fileName,
            contentType: stored.contentType,
            base64Content,
            bankTransferReference,
          })) ?? undefined;

        await markPartnerOrderPaymentPending({
          saleOrderId,
          bankTransferReference,
          attachmentId: odooAttachmentId,
          fileName: stored.fileName,
        });

        const refreshed = await resolvePartnerOrder(profile.partnerId, `odoo-so-${saleOrderId}`);
        if (refreshed) order = refreshed;
      } else if (order.leadId) {
        odooAttachmentId =
          (await attachBankTransferProofToLead({
            leadId: order.leadId,
            fileName: stored.fileName,
            contentType: stored.contentType,
            base64Content,
            bankTransferReference,
          })) ?? undefined;

        const refreshed = await resolvePartnerOrder(
          profile.partnerId,
          `odoo-lead-${order.leadId}`,
        );
        if (refreshed) order = refreshed;
      } else {
        throw new Error("No sale order or CRM lead available to record bank transfer payment");
      }
    } catch (error) {
      await releaseBankTransferSubmission(order.id);
      logger.error("Odoo bank-transfer sync failed", {
        orderId: order.id,
        error: error instanceof Error ? error.message : String(error),
      });
      return jsonError(
        "Could not record payment in Odoo. Please try again or contact support.",
        502,
        "ODOO_SYNC_FAILED",
      );
    }
  } else {
    order = upsertPortalOrderSnapshot({
      ...order,
      saleOrderId: saleOrderId ?? order.saleOrderId,
      paymentStatus: "pending_verification",
      paymentMethod: "Bank Transfer",
      amountDue: totalAmount ?? order.amountDue,
      bankTransferReference,
      paymentProofFileName: stored.fileName,
      paymentProofUrl: `/api/orders/${encodeURIComponent(order.id)}/payment-proof`,
      paymentProofUploadedAt: new Date().toISOString(),
      paymentProofOdooAttachmentId: odooAttachmentId,
    });
  }

  order = {
    ...order,
    paymentStatus: "pending_verification",
    paymentMethod: "Bank Transfer",
    amountDue: totalAmount ?? order.amountDue,
    bankTransferReference,
    paymentProofFileName: stored.fileName,
    paymentProofUrl: `/api/orders/${encodeURIComponent(order.id)}/payment-proof`,
    paymentProofUploadedAt: order.paymentProofUploadedAt ?? new Date().toISOString(),
    paymentProofOdooAttachmentId: odooAttachmentId ?? order.paymentProofOdooAttachmentId,
  };

  const updated = order;

  writeAudit({
    action: "order.bank_transfer_submitted",
    actorId: claims.sub,
    targetId: updated.id,
    ip: getClientIp(request),
    metadata: {
      reference: updated.reference,
      bankTransferReference,
      proofFileName: stored.fileName,
      saleOrderId,
    },
  });

  const productLines = updated.items.map(
    (item) => `${item.category} — ${item.productName} × ${item.quantity}`,
  );
  const totalAmountLabel = totalAmount != null ? formatOmanAmount(totalAmount) : "To be confirmed";
  const portalUrl = getPortalBaseUrl();

  const customerEmail = formatPurchaseRequestSubmittedEmail({
    customerName: profile.name,
    reference: updated.reference,
    bankTransferReference,
    products: updated.items.map((item) => item.productName),
    duration: updated.duration,
    totalAmount: totalAmountLabel,
    portalUrl,
  });

  const adminEmail = formatBankTransferAdminEmail({
    customerName: profile.name,
    company: profile.company,
    email: profile.email,
    phone: profile.phone,
    reference: updated.reference,
    bankTransferReference,
    products: productLines,
    totalAmount: totalAmountLabel,
    odooLink: saleOrderId ? getOdooSaleOrderLink(saleOrderId) : null,
  });

  let proofBuffer: Buffer | null = null;
  try {
    proofBuffer = fs.readFileSync(stored.filePath);
  } catch {
    proofBuffer = null;
  }

  const [customerResult, adminResult] = await Promise.all([
    sendPortalEmail({ to: profile.email, subject: customerEmail.subject, body: customerEmail.body }),
    sendPortalEmail({
      to: getOrderNotificationEmail(),
      subject: adminEmail.subject,
      body: adminEmail.body,
      replyTo: profile.email,
      attachments: proofBuffer
        ? [{ filename: stored.fileName, content: proofBuffer, contentType: stored.contentType }]
        : undefined,
    }),
  ]);

  if (!customerResult.sent || !adminResult.sent) {
    logger.warn("Bank transfer notification email(s) not sent", {
      orderId: updated.id,
      customerSent: customerResult.sent,
      adminSent: adminResult.sent,
    });
  }

  if (customerResult.sent && profile.partnerId) {
    await createPortalNotification({
      partnerId: profile.partnerId,
      actorId: claims.sub,
      title: "Order received",
      detail: `Your order ${updated.reference} is awaiting payment verification (2-3 business days).`,
      status: "Action Required",
      type: "purchase_submitted",
      reference: updated.reference,
    });
  }

  return jsonOk({
    ok: true,
    order: updated,
    bankTransferReference,
    verificationTimeline: "2-3 business days",
  });
}
