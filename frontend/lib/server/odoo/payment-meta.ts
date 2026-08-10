import type { OrderPaymentStatus } from "@/types/orders";

/** Markers written into sale.order.note so portal payment state survives without a local DB. */
export const PAYMENT_PENDING_TAG = "[Payment Verification Pending]";
export const PAYMENT_PAID_TAG = "[Payment Paid]";
export const PAYMENT_REJECTED_TAG = "[Payment Rejected]";
export const PAYMENT_FAILED_TAG = "[Payment Failed]";

export type SaleOrderPaymentMeta = {
  paymentStatus: OrderPaymentStatus;
  bankTransferReference?: string;
  paymentMethod?: string;
  paymentProofFileName?: string;
  paymentProofOdooAttachmentId?: number;
  paymentIntentId?: string;
  amountPaid?: number;
  paidAt?: string;
  rejectReason?: string;
};

function readTagged(text: string, key: string): string | undefined {
  const match = text.match(new RegExp(`(?:^|\\s)${key}=([^\\s\\]]+)`, "i"));
  return match?.[1]?.trim().replace(/\+/g, " ") || undefined;
}

/**
 * Derive portal payment fields from sale.order.note + Odoo workflow hints.
 * ponytail: note tags + invoice_status/subscription_state — upgrade path is account.payment.
 */
export function parseSaleOrderPaymentMeta(
  note: string | false | null | undefined,
  hints?: {
    invoiceStatus?: string | false | null;
    subscriptionState?: string | false | null;
    orderState?: string | false | null;
    /** True when a serial/license key is already present on the sale order lines. */
    hasLicense?: boolean;
  },
): SaleOrderPaymentMeta {
  const text = typeof note === "string" ? note : "";
  const invoiceStatus = hints?.invoiceStatus;
  const subscriptionState =
    typeof hints?.subscriptionState === "string" ? hints.subscriptionState : "";
  const orderState = typeof hints?.orderState === "string" ? hints.orderState : "";

  if (
    text.includes(PAYMENT_REJECTED_TAG) ||
    /Payment status:\s*Rejected\b/i.test(text) ||
    orderState === "cancel"
  ) {
    return {
      paymentStatus: "failed",
      bankTransferReference: readTagged(text, "ref"),
      rejectReason:
        readTagged(text, "reason") ??
        text.match(/Reason:\s*(.+)$/im)?.[1]?.trim() ??
        undefined,
    };
  }

  // Card/gateway failure — order stays open for retry (do not treat as cancelled).
  if (text.includes(PAYMENT_FAILED_TAG) || /Payment status:\s*Failed\b/i.test(text)) {
    return {
      paymentStatus: "failed",
      paymentMethod: readTagged(text, "method"),
      paymentIntentId: readTagged(text, "intent"),
      rejectReason:
        readTagged(text, "reason") ??
        text.match(/Reason:\s*(.+)$/im)?.[1]?.trim() ??
        undefined,
    };
  }

  if (text.includes(PAYMENT_PAID_TAG) || /Payment status:\s*Paid\b/i.test(text)) {
    const amountRaw = readTagged(text, "amount");
    const amountPaid = amountRaw != null ? Number(amountRaw) : undefined;
    return {
      paymentStatus: "paid",
      bankTransferReference: readTagged(text, "ref"),
      paymentMethod: readTagged(text, "method"),
      paymentIntentId: readTagged(text, "intent"),
      paymentProofFileName: readTagged(text, "file"),
      paymentProofOdooAttachmentId: (() => {
        const raw = readTagged(text, "attachment_id");
        const id = raw != null ? Number(raw) : NaN;
        return Number.isFinite(id) ? id : undefined;
      })(),
      amountPaid: Number.isFinite(amountPaid) ? amountPaid : undefined,
      paidAt: readTagged(text, "paid_at"),
    };
  }

  // Finance confirmed in Odoo without portal admin: fully invoiced, active
  // subscription, or a license/serial already issued on the order lines.
  const subscriptionActive =
    subscriptionState === "progress" ||
    subscriptionState.endsWith("_progress") ||
    subscriptionState.includes("3_progress");
  if (invoiceStatus === "invoiced" || subscriptionActive || hints?.hasLicense) {
    return {
      paymentStatus: "paid",
      bankTransferReference: readTagged(text, "ref"),
      paymentMethod: readTagged(text, "method") ?? (hints?.hasLicense ? "License issued" : "Odoo"),
    };
  }

  if (text.includes(PAYMENT_PENDING_TAG) || /Payment Verification Pending/i.test(text)) {
    const ref =
      readTagged(text, "ref") ??
      text.match(/ref(?:erence)?\s+([A-Z0-9-]+)/i)?.[1] ??
      text.match(/Reference:\s*([A-Z0-9-]+)/i)?.[1];
    const attachmentRaw = readTagged(text, "attachment_id");
    const attachmentId = attachmentRaw != null ? Number(attachmentRaw) : NaN;
    return {
      paymentStatus: "pending_verification",
      bankTransferReference: ref,
      paymentMethod: readTagged(text, "method") ?? "Bank Transfer",
      paymentProofFileName: readTagged(text, "file"),
      paymentProofOdooAttachmentId: Number.isFinite(attachmentId) ? attachmentId : undefined,
    };
  }

  return { paymentStatus: "pending" };
}

export function formatPaymentPendingNote(input: {
  bankTransferReference: string;
  attachmentId?: number;
  fileName?: string;
}): string {
  const parts = [
    PAYMENT_PENDING_TAG,
    `ref=${input.bankTransferReference}`,
    "method=Bank_Transfer",
  ];
  if (input.attachmentId != null) parts.push(`attachment_id=${input.attachmentId}`);
  if (input.fileName) parts.push(`file=${input.fileName.replace(/\s+/g, "+")}`);
  parts.push("Awaiting finance approval.");
  return parts.join(" ");
}

export function formatPaymentPaidNote(input: {
  paymentMethod?: string;
  paymentIntentId?: string;
  amountPaid?: number;
  bankTransferReference?: string;
  attachmentId?: number;
  fileName?: string;
}): string {
  const paidAt = new Date().toISOString();
  const parts = [PAYMENT_PAID_TAG, `paid_at=${paidAt}`];
  if (input.paymentMethod) parts.push(`method=${input.paymentMethod.replace(/\s+/g, "_")}`);
  if (input.paymentIntentId) parts.push(`intent=${input.paymentIntentId}`);
  if (input.amountPaid != null) parts.push(`amount=${input.amountPaid}`);
  if (input.bankTransferReference) parts.push(`ref=${input.bankTransferReference}`);
  if (input.attachmentId != null) parts.push(`attachment_id=${input.attachmentId}`);
  if (input.fileName) parts.push(`file=${input.fileName.replace(/\s+/g, "+")}`);
  return parts.join(" ");
}

export function formatPaymentRejectedNote(input: {
  bankTransferReference?: string;
  reason?: string;
}): string {
  const parts = [PAYMENT_REJECTED_TAG];
  if (input.bankTransferReference) parts.push(`ref=${input.bankTransferReference}`);
  if (input.reason?.trim()) {
    parts.push(`reason=${input.reason.trim().replace(/\s+/g, "+")}`);
  }
  return parts.join(" ");
}

/** Stripe/card decline — keeps the sale order open so the customer can retry. */
export function formatPaymentFailedNote(input: {
  paymentIntentId?: string;
  reason?: string;
  paymentMethod?: string;
}): string {
  const parts = [PAYMENT_FAILED_TAG, "Payment status: Failed"];
  if (input.paymentMethod) parts.push(`method=${input.paymentMethod.replace(/\s+/g, "_")}`);
  if (input.paymentIntentId) parts.push(`intent=${input.paymentIntentId}`);
  if (input.reason?.trim()) {
    parts.push(`reason=${input.reason.trim().replace(/\s+/g, "+")}`);
  }
  return parts.join(" ");
}
