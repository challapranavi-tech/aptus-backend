import type { PortalOrder, PortalOrderStatus } from "@/types/orders";

export type OrderDisplayStatus =
  | "Submitted"
  | "Approved"
  | "Pending verification"
  | "License issued"
  | "Rejected"
  | "Completed";

export function normalizeOrderStatus(status: PortalOrderStatus): PortalOrderStatus {
  return status === "Under Review" ? "Submitted" : status;
}

/**
 * Portal-facing status. Payment overlay wins over raw Odoo draft/submitted state
 * so bank-transfer proof surfaces as "Pending verification",
 * and verified / licensed orders surface as "License issued".
 */
export function getOrderDisplayStatus(order: PortalOrder): OrderDisplayStatus {
  const status = normalizeOrderStatus(order.status);

  if (status === "Rejected" || order.paymentStatus === "failed") {
    return "Rejected";
  }

  if (order.paymentStatus === "paid" || status === "Completed") {
    return "License issued";
  }

  if (order.paymentStatus === "pending_verification") {
    return "Pending verification";
  }

  if (status === "Approved") return "Approved";
  if (status === "Submitted") return "Submitted";

  return "Submitted";
}

/** Orders page: only payment-submitted or completed/licensed requests. */
export function isOrdersPageOrder(order: PortalOrder): boolean {
  const display = getOrderDisplayStatus(order);
  return display === "Pending verification" || display === "License issued";
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
    case "Pending verification":
      return "aptus-status--pending";
    case "License issued":
    case "Completed":
      return "aptus-status--delivered";
    case "Rejected":
      return "aptus-status--expired";
    default:
      return "aptus-status--pending";
  }
}

/** Dashboard "Recent Orders" row label — must not claim payment proof was submitted
 * ("Pending verification") for an order that merely reached the payment step. */
export function orderRowStatusLabel(displayStatus: OrderDisplayStatus): string {
  if (displayStatus === "License issued" || displayStatus === "Completed") return "License issued";
  if (displayStatus === "Rejected") return "Rejected";
  if (displayStatus === "Pending verification") return "Pending verification";
  if (displayStatus === "Approved") return "Approved";
  return "Awaiting payment";
}

export function orderRowStatusTone(displayStatus: OrderDisplayStatus): string {
  if (displayStatus === "License issued" || displayStatus === "Completed") return "completed";
  if (displayStatus === "Rejected") return "rejected";
  return "processing";
}

export function orderStatusHint(displayStatus: OrderDisplayStatus): string | null {
  switch (displayStatus) {
    case "Submitted":
      return "Request submitted and awaiting review.";
    case "Approved":
      return "Request approved by the backend team. Complete payment to activate your subscriptions.";
    case "Pending verification":
      return "We received your bank transfer proof. Our finance team verifies payments within 2-3 business days.";
    case "License issued":
      return "Payment verified. Your license has been issued.";
    case "Rejected":
      return "Payment or purchase request was declined.";
    default:
      return null;
  }
}
