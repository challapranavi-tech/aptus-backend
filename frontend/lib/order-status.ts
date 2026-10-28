import type { PortalOrder, PortalOrderStatus } from "@/types/orders";

export type OrderDisplayStatus =
  | "Submitted"
  | "Approved"
  | "Payment Verification Pending"
  | "Payment Verified"
  | "License Issued"
  | "Rejected"
  | "Completed";

export function normalizeOrderStatus(status: PortalOrderStatus): PortalOrderStatus {
  return status === "Under Review" ? "Submitted" : status;
}

function crmStageHint(order: PortalOrder): string {
  return (order.crmStage ?? "").toLowerCase();
}

export function isPaymentVerificationCrmStage(stage?: string): boolean {
  const value = (stage ?? "").toLowerCase();
  return (
    value.includes("payment verification") ||
    value.includes("portal purchase") ||
    value.includes("portal software order")
  );
}

export function isPaymentVerifiedCrmStage(stage?: string): boolean {
  const value = (stage ?? "").toLowerCase();
  return value.includes("payment confirmation") || value.includes("payment verified");
}

export function isLicenseIssuedCrmStage(stage?: string): boolean {
  const value = (stage ?? "").toLowerCase();
  return value.includes("license issued") || value.includes("won");
}

/**
 * Portal-facing status mirrors the purchase CRM journey:
 * Portal Purchase → Payment Verification Pending
 * Payment Confirmation → Payment Verified
 * License Issued / Won → License Issued
 */
export function getOrderDisplayStatus(order: PortalOrder): OrderDisplayStatus {
  const status = normalizeOrderStatus(order.status);
  const stage = crmStageHint(order);

  if (status === "Rejected" || order.paymentStatus === "failed") {
    return "Rejected";
  }

  if (order.licenseIssued || isLicenseIssuedCrmStage(stage)) {
    return "License Issued";
  }

  if (
    order.paymentStatus === "paid" ||
    status === "Completed" ||
    isPaymentVerifiedCrmStage(stage)
  ) {
    return "Payment Verified";
  }

  if (
    order.paymentStatus === "pending_verification" ||
    isPaymentVerificationCrmStage(stage)
  ) {
    return "Payment Verification Pending";
  }

  if (status === "Approved") return "Approved";
  if (status === "Submitted") return "Submitted";

  return "Submitted";
}

/** Orders page: payment submitted through licensed. */
export function isOrdersPageOrder(order: PortalOrder): boolean {
  const display = getOrderDisplayStatus(order);
  return (
    display === "Payment Verification Pending" ||
    display === "Payment Verified" ||
    display === "License Issued"
  );
}

export function canMakePayment(order: PortalOrder): boolean {
  return (
    // ponytail: staff-approval gate disabled — bank transfer is the only payment
    // rail today, so the customer pays right after placing the order. Restoring the
    // approve-before-payment model is one uncomment.
    // normalizeOrderStatus(order.status) === "Approved" &&
    order.paymentStatus !== "paid" &&
    order.paymentStatus !== "pending_verification" &&
    order.paymentStatus !== "failed"
  );
}

/**
 * Payment eligibility from the server-resolved order only (Odoo / demo store).
 * Client snapshots may be used to locate the record, never to authorize payment.
 */
export function isOrderEligibleForPayment(
  stored: PortalOrder | null | undefined,
  _snapshot?: Pick<PortalOrder, "status" | "paymentStatus"> | null,
): boolean {
  return stored ? canMakePayment(stored) : false;
}

export function orderStatusClass(displayStatus: OrderDisplayStatus): string {
  switch (displayStatus) {
    case "Submitted":
      return "aptus-status--submitted";
    case "Approved":
      return "aptus-status--confirmed";
    case "Payment Verification Pending":
      return "aptus-status--pending";
    case "Payment Verified":
      return "aptus-status--confirmed";
    case "License Issued":
    case "Completed":
      return "aptus-status--delivered";
    case "Rejected":
      return "aptus-status--expired";
    default:
      return "aptus-status--pending";
  }
}

/** Dashboard "Recent Orders" row label — must not claim payment proof was submitted
 * for an order that merely reached the payment step. */
export function orderRowStatusLabel(displayStatus: OrderDisplayStatus): string {
  if (displayStatus === "License Issued" || displayStatus === "Completed") return "License Issued";
  if (displayStatus === "Payment Verified") return "Payment Verified";
  if (displayStatus === "Rejected") return "Rejected";
  if (displayStatus === "Payment Verification Pending") return "Payment Verification Pending";
  if (displayStatus === "Approved") return "Approved";
  return "Awaiting payment";
}

export function orderRowStatusTone(displayStatus: OrderDisplayStatus): string {
  if (displayStatus === "License Issued" || displayStatus === "Completed") return "completed";
  if (displayStatus === "Rejected") return "rejected";
  return "processing";
}

export function orderStatusHint(displayStatus: OrderDisplayStatus): string | null {
  switch (displayStatus) {
    case "Submitted":
      return "Request submitted and awaiting review.";
    case "Approved":
      return "Request approved by the backend team. Complete payment to activate your subscriptions.";
    case "Payment Verification Pending":
      return "We received your bank transfer proof. Our finance team verifies payments within 2-3 business days.";
    case "Payment Verified":
      return "Payment verified. Your software license is being prepared and will be issued within 2–3 business days.";
    case "License Issued":
      return "Your license has been issued. View details in Licenses.";
    case "Rejected":
      return "Payment or purchase request was declined.";
    default:
      return null;
  }
}
