import { NextRequest } from "next/server";
import { writeAudit } from "@/lib/server/audit-log";
import { resolveProfile } from "@/lib/server/auth-service";
import { getOdooSaleOrderLink, getOrderNotificationEmail, getPortalBaseUrl, isDemoMode } from "@/lib/server/config";
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
import { promoteCartLeadToProductOrder } from "@/lib/server/odoo/leads";
import { createPortalNotification, claimNotificationSend } from "@/lib/server/portal-notifications";
import {
  cartBelongsToOrder,
  clearStoredPortalCart,
  getStoredPortalCart,
} from "@/lib/server/portal-cart-store";
import { savePaymentProofFile, readPaymentProofBuffer } from "@/lib/server/payment-proof-storage";
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

type RouteContext = { params: Promise<{ id: string }> };

type BankTransferStep =
  | "request_received"
  | "parse_formdata"
  | "validate_input"
  | "resolve_order"
  | "claim_lock"
  | "store_proof"
  | "promote_lead"
  | "create_sale_order"
  | "read_proof_buffer"
  | "attach_odoo_proof"
  | "mark_payment_pending"
  | "persist_snapshot"
  | "clear_cart"
  | "notify";

function logBankTransferError(
  step: BankTransferStep,
  orderId: string,
  error: unknown,
  extra?: Record<string, unknown>,
): void {
  const err = error instanceof Error ? error : new Error(String(error));
  logger.error("bank-transfer step failed", {
    failedOperation: step,
    orderId,
    error: err.message,
    stack: err.stack,
    ...extra,
  });
}

function parseOrderSnapshot(raw: FormDataEntryValue | null): PortalOrder | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  try {
    return JSON.parse(raw) as PortalOrder;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { id: routeOrderId } = await context.params;
  logger.info("bank-transfer request received", {
    orderId: routeOrderId,
    failedOperation: "request_received" satisfies BankTransferStep,
  });

  const claims = await getSessionFromRequestOrRefresh(request);
  if (!claims) {
    return jsonError("Not authenticated", 401);
  }

  const profile = await resolveProfile(claims);
  if (!profile?.partnerId) {
    return jsonError("No linked partner for this account", 400);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
    logger.info("bank-transfer formData parsed", { orderId: routeOrderId });
  } catch (error) {
    logBankTransferError("parse_formdata", routeOrderId, error);
    return jsonError(
      "Upload failed — the file may be too large (max 4 MB) or the request was incomplete. Try a smaller JPEG/PNG or a PDF.",
      400,
      "INVALID_UPLOAD",
    );
  }

  const confirmed = formData.get("confirmed") === "true";
  const orderSnapshot = parseOrderSnapshot(formData.get("orderSnapshot"));
  const file = formData.get("file");

  logger.info("bank-transfer input parsed", {
    orderId: routeOrderId,
    confirmed,
    hasSnapshot: Boolean(orderSnapshot),
    fileName: file instanceof File ? file.name : null,
    fileSize: file instanceof File ? file.size : null,
    fileType: file instanceof File ? file.type : null,
  });

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
    return jsonError("File is too large. Maximum size is 4 MB.", 400, "FILE_TOO_LARGE");
  }

  if (!isAllowedPaymentProofFile({ type: file.type, name: file.name })) {
    return jsonError(
      "Unsupported file type. Please upload a PDF, JPG, JPEG, or PNG file.",
      400,
      "UNSUPPORTED_FILE_TYPE",
    );
  }

  let order = await resolveOrderForPartner({
    orderId: routeOrderId,
    partnerId: profile.partnerId,
    actorId: claims.sub,
    snapshot: orderSnapshot,
  });

  if (!order) {
    logger.warn("bank-transfer order not found", { orderId: routeOrderId });
    return jsonError("Order not found", 404);
  }

  logger.info("bank-transfer order resolved", {
    orderId: order.id,
    leadId: order.leadId ?? null,
    saleOrderId: order.saleOrderId ?? null,
    paymentStatus: order.paymentStatus,
  });

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
      orderId: routeOrderId,
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
    logger.warn("bank-transfer submission already in progress", { orderId: order.id });
    return jsonError(
      "Your payment proof is still being processed. Please wait a moment and try again.",
      409,
      "SUBMISSION_IN_PROGRESS",
    );
  }

  // Until payment, the CRM record is still the cart journey, whose title carries no
  // quantities — the stored cart is the authoritative line source. Only trust it when
  // it belongs to this very order, so paying an older order never picks up a new cart.
  const cart = await getStoredPortalCart(claims.sub);
  const cartMatchesOrder = cartBelongsToOrder(cart, order);
  if (cartMatchesOrder && cart) {
    order = { ...order, duration: cart.duration, items: cart.items };
    logger.info("bank-transfer using stored cart lines", {
      orderId: order.id,
      leadId: order.leadId,
      itemCount: cart.items.length,
    });
  }

  const bankTransferReference = order.bankTransferReference ?? deriveBankTransferReference(order);
  const pricing = estimateOrderPricing(order);
  const totalAmount = order.amountDue ?? pricing?.total;

  let stored;
  try {
    logger.info("bank-transfer storing proof", {
      orderId: order.id,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      blobConfigured: Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim()),
    });
    stored = await savePaymentProofFile(order.id, file);
    logger.info("bank-transfer proof stored", {
      orderId: order.id,
      storageKey: stored.storageKey,
      contentType: stored.contentType,
      size: stored.size,
    });
  } catch (error) {
    await releaseBankTransferSubmission(order.id);
    logBankTransferError("store_proof", order.id, error, {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      blobConfigured: Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim()),
    });
    const message = error instanceof Error ? error.message : String(error);
    if (/content does not match|must be one of/i.test(message)) {
      return jsonError(message, 400, "UNSUPPORTED_FILE_TYPE");
    }
    return jsonError("Could not save your upload. Please try again.", 500, "UPLOAD_FAILED");
  }

  let saleOrderId = order.saleOrderId;
  let odooAttachmentId: number | undefined;

  if (!isDemoMode()) {
    try {
      // First purchase write of the whole flow: the proof is stored, so the cart
      // journey may now become a software order in CRM.
      if (order.leadId) {
        logger.info("bank-transfer promoting CRM lead to software order", {
          orderId: order.id,
          leadId: order.leadId,
        });
        await promoteCartLeadToProductOrder({
          partnerId: profile.partnerId,
          items: order.items.map((item) => ({
            productName: item.productName,
            quantity: item.quantity,
          })),
          existingLeadId: order.leadId,
        }).catch((error: unknown) => {
          throw Object.assign(error instanceof Error ? error : new Error(String(error)), {
            failedOperation: "promote_lead" as const,
          });
        });
      }

      if (!saleOrderId) {
        try {
          logger.info("bank-transfer creating sale order", { orderId: order.id });
          saleOrderId = await createBankTransferSaleOrder({
            partnerId: profile.partnerId,
            duration: order.duration,
            lines: order.items,
            bankTransferReference,
            orderReference: order.reference,
          });
          logger.info("bank-transfer sale order created", {
            orderId: order.id,
            saleOrderId,
          });
        } catch (createError) {
          const leadId = order.leadId;
          if (leadId && isRecoverableSaleOrderCreateError(createError)) {
            logger.warn("Sale order create unavailable — recording bank transfer on CRM lead", {
              orderId: order.id,
              leadId,
              failedOperation: "create_sale_order" satisfies BankTransferStep,
              error: createError instanceof Error ? createError.message : String(createError),
              stack: createError instanceof Error ? createError.stack : undefined,
            });
          } else {
            throw Object.assign(
              createError instanceof Error ? createError : new Error(String(createError)),
              { failedOperation: "create_sale_order" as const },
            );
          }
        }
      }

      logger.info("bank-transfer reading proof buffer for Odoo", {
        orderId: order.id,
        storageKey: stored.storageKey,
      });
      const proofBufferForOdoo = await readPaymentProofBuffer(stored.storageKey);
      if (!proofBufferForOdoo || proofBufferForOdoo.byteLength === 0) {
        throw Object.assign(new Error("Payment proof buffer empty after storage"), {
          failedOperation: "read_proof_buffer" as const,
        });
      }
      const base64Content = proofBufferForOdoo.toString("base64");
      logger.info("bank-transfer proof converted to base64", {
        orderId: order.id,
        bytes: proofBufferForOdoo.byteLength,
        base64Length: base64Content.length,
      });

      if (saleOrderId) {
        logger.info("bank-transfer attaching proof to sale order", {
          orderId: order.id,
          saleOrderId,
        });
        odooAttachmentId =
          (await attachBankTransferProofToSaleOrder({
            saleOrderId,
            fileName: stored.fileName,
            contentType: stored.contentType,
            base64Content,
            bankTransferReference,
          })) ?? undefined;

        logger.info("bank-transfer marking sale order payment pending", {
          orderId: order.id,
          saleOrderId,
          odooAttachmentId: odooAttachmentId ?? null,
        });
        await markPartnerOrderPaymentPending({
          saleOrderId,
          bankTransferReference,
          attachmentId: odooAttachmentId,
          fileName: stored.fileName,
        });

        const refreshed = await resolvePartnerOrder(profile.partnerId, `odoo-so-${saleOrderId}`);
        if (refreshed) order = refreshed;
      } else if (order.leadId) {
        logger.info("bank-transfer attaching proof to CRM lead", {
          orderId: order.id,
          leadId: order.leadId,
        });
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
        throw Object.assign(
          new Error("No sale order or CRM lead available to record bank transfer payment"),
          { failedOperation: "attach_odoo_proof" as const },
        );
      }

      logger.info("bank-transfer Odoo sync complete", {
        orderId: order.id,
        saleOrderId: saleOrderId ?? null,
        leadId: order.leadId ?? null,
        odooAttachmentId: odooAttachmentId ?? null,
      });
    } catch (error) {
      await releaseBankTransferSubmission(order.id);
      const failedOperation =
        error && typeof error === "object" && "failedOperation" in error
          ? String((error as { failedOperation: string }).failedOperation)
          : "attach_odoo_proof";
      logBankTransferError(failedOperation as BankTransferStep, order.id, error, {
        saleOrderId: saleOrderId ?? null,
        leadId: order.leadId ?? null,
      });
      return jsonError(
        "Could not record payment in Odoo. Please try again or contact support.",
        502,
        "ODOO_SYNC_FAILED",
      );
    }
  } else {
    // Demo: no Odoo — status is recorded only on the local snapshot below.
    logger.info("bank-transfer demo mode — skipping Odoo sync", { orderId: order.id });
  }

  // The cart survives every failed attempt above so the customer can retry; it is
  // only spent once the order is genuinely recorded.
  if (cartMatchesOrder) {
    const orderId = order.id;
    await clearStoredPortalCart(claims.sub).catch((error: unknown) => {
      logBankTransferError("clear_cart", orderId, error);
    });
  }

  order = {
    ...order,
    saleOrderId: saleOrderId ?? order.saleOrderId,
    paymentStatus: "pending_verification",
    paymentMethod: "Bank Transfer",
    amountDue: totalAmount ?? order.amountDue,
    bankTransferReference,
    paymentProofFileName: stored.fileName,
    paymentProofStorageKey: stored.storageKey,
    paymentProofUrl: `/api/orders/${encodeURIComponent(order.id)}/payment-proof`,
    paymentProofUploadedAt: order.paymentProofUploadedAt ?? new Date().toISOString(),
    paymentProofOdooAttachmentId: odooAttachmentId ?? order.paymentProofOdooAttachmentId,
  };

  // Persist storage key (and demo status) so /payment-proof can find the blob without scanning disk.
  try {
    order = upsertPortalOrderSnapshot(order);
    logger.info("bank-transfer snapshot persisted", {
      orderId: order.id,
      storageKey: stored.storageKey,
      paymentStatus: order.paymentStatus,
    });
  } catch (error) {
    // Odoo already holds the proof — a local snapshot failure must not make the
    // customer retry (that would duplicate the attachment).
    logBankTransferError("persist_snapshot", order.id, error);
  }

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
      storageKey: stored.storageKey,
      saleOrderId,
    },
  });

  // Best-effort from here on: the proof is recorded in Odoo, so notification
  // failures are logged but never turned into an error for the customer.
  try {
    const productLines = updated.items.map(
      (item) => `${item.category} — ${item.productName} × ${item.quantity}`,
    );
    const totalAmountLabel =
      totalAmount != null ? formatOmanAmount(totalAmount) : "To be confirmed";
    const portalUrl = getPortalBaseUrl();

    // Once-only per order reference — retries / double-submit must not re-email.
    const claimRef = updated.reference;
    const canNotifyCustomer =
      !profile.partnerId ||
      (await claimNotificationSend(profile.partnerId, claimRef, "purchase_submitted"));
    const canNotifySales =
      !profile.partnerId ||
      (await claimNotificationSend(profile.partnerId, `sales:${claimRef}`, "order"));

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

    const proofBuffer = await readPaymentProofBuffer(stored.storageKey).catch((error) => {
      logBankTransferError("notify", updated.id, error, { phase: "read_proof_for_email" });
      return null;
    });

    const [customerResult, adminResult] = await Promise.all([
      canNotifyCustomer
        ? sendPortalEmail({
            to: profile.email,
            subject: customerEmail.subject,
            body: customerEmail.body,
          })
        : Promise.resolve({ sent: false, channel: "none" as const }),
      canNotifySales
        ? sendPortalEmail({
            to: getOrderNotificationEmail(),
            subject: adminEmail.subject,
            body: adminEmail.body,
            replyTo: profile.email,
            attachments: proofBuffer
              ? [{ filename: stored.fileName, content: proofBuffer, contentType: stored.contentType }]
              : undefined,
          })
        : Promise.resolve({ sent: false, channel: "none" as const }),
    ]);

    if ((canNotifyCustomer && !customerResult.sent) || (canNotifySales && !adminResult.sent)) {
      logger.warn("Bank transfer notification email(s) not sent", {
        orderId: updated.id,
        customerSent: customerResult.sent,
        adminSent: adminResult.sent,
        canNotifyCustomer,
        canNotifySales,
      });
    }

    if (customerResult.sent && profile.partnerId) {
      await createPortalNotification({
        partnerId: profile.partnerId,
        actorId: claims.sub,
        title: "Payment Verification Pending",
        detail: `Your order ${updated.reference} is awaiting payment verification (2-3 business days).`,
        status: "Payment Verification Pending",
        type: "purchase_submitted",
        reference: updated.reference,
      });
    }
  } catch (error) {
    logBankTransferError("notify", updated.id, error);
  }

  logger.info("bank-transfer submission complete", {
    orderId: updated.id,
    bankTransferReference,
    saleOrderId: saleOrderId ?? null,
    odooAttachmentId: odooAttachmentId ?? null,
  });

  return jsonOk({
    ok: true,
    order: updated,
    bankTransferReference,
    verificationTimeline: "2-3 business days",
  });
}
