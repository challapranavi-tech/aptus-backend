import type { PortalOrder, PortalOrderStatus } from "@/types/orders";

export type OrderDisplayStatus =
  | "Submitted"
  | "Approved"
  | "Payment Completed"
  | "Rejected"
  | "Completed";

export function normalizeOrderStatus(status: PortalOrderStatus): PortalOrderStatus {
  return status === "Under Review" ? "Submitted" : status;
}

export function getOrderDisplayStatus(order: PortalOrder): OrderDisplayStatus {
  const status = normalizeOrderStatus(order.status);

  if (status === "Rejected") return "Rejected";
  if (status === "Submitted") return "Submitted";
  if (order.paymentStatus === "paid" || status === "Completed") {
    return "Payment Completed";
  }
  if (status === "Approved") return "Approved";

  return "Submitted";
}

export function canMakePayment(order: PortalOrder): boolean {
  return (
    normalizeOrderStatus(order.status) === "Approved" && order.paymentStatus !== "paid"
  );
}

/** Trust the live UI snapshot when local store lags behind Odoo approval state. */
export function isOrderEligibleForPayment(
  stored: PortalOrder | null | undefined,
  snapshot?: Pick<PortalOrder, "status" | "paymentStatus"> | null,
): boolean {
  if (
    snapshot &&
    normalizeOrderStatus(snapshot.status) === "Approved" &&
    snapshot.paymentStatus !== "paid"
  ) {
    return true;
  }
  return stored ? canMakePayment(stored) : false;
}

export function orderStatusClass(displayStatus: OrderDisplayStatus): string {
  switch (displayStatus) {
    case "Submitted":
      return "aptus-status--submitted";
    case "Approved":
      return "aptus-status--confirmed";
    case "Payment Completed":
    case "Completed":
      return "aptus-status--delivered";
    case "Rejected":
      return "aptus-status--expired";
    default:
      return "aptus-status--pending";
  }
}

export function orderStatusHint(displayStatus: OrderDisplayStatus): string | null {
  switch (displayStatus) {
    case "Submitted":
      return "Request submitted and awaiting review.";
    case "Approved":
      return "Request approved by the backend team. Complete payment to activate your subscriptions.";
    case "Payment Completed":
      return "Payment successfully received.";
    case "Rejected":
      return "Request was not approved.";
    default:
      return null;
  }
}
