import { orderStatusClass, type OrderDisplayStatus } from "@/lib/order-status";
import type { PortalNotificationStatus, PortalNotificationType } from "@/types/notifications";

/** Map notification status (+ type for legacy Confirmed) onto order display statuses. */
export function notificationOrderStatus(
  status: PortalNotificationStatus,
  type?: PortalNotificationType,
): OrderDisplayStatus | null {
  switch (status) {
    case "Payment Verification Pending":
    case "Action Required":
      return "Payment Verification Pending";
    case "Payment Verified":
      return "Payment Verified";
    case "License Issued":
      return "License Issued";
    case "Confirmed":
      return type === "license_available" ? "License Issued" : "Payment Verified";
    case "Rejected":
      return "Rejected";
    case "Approved":
      return "Approved";
    case "Submitted":
      return "Submitted";
    default:
      return null;
  }
}

/** Badge label — same wording as the Orders page where applicable. */
export function notificationStatusLabel(
  status: PortalNotificationStatus,
  type?: PortalNotificationType,
): string {
  const mapped = notificationOrderStatus(status, type);
  if (mapped === "License Issued" || mapped === "Completed") return "License Issued";
  if (mapped === "Payment Verified") return "Payment Verified";
  if (mapped === "Payment Verification Pending") return "Payment Verification Pending";
  if (mapped === "Rejected") return "Rejected";
  if (mapped === "Approved") return "Approved";
  if (mapped === "Submitted") return "Submitted";
  return status;
}

export function notificationStatusClass(
  status: PortalNotificationStatus,
  type?: PortalNotificationType,
): string {
  const mapped = notificationOrderStatus(status, type);
  if (mapped) return orderStatusClass(mapped);
  switch (status) {
    case "Failed":
    case "Expired":
    case "Cancelled":
      return "aptus-status--expired";
    case "Processed":
      return "aptus-status--delivered";
    default:
      return "aptus-status--pending";
  }
}

export function isActionRequiredNotification(status: PortalNotificationStatus): boolean {
  return status === "Action Required" || status === "Payment Verification Pending";
}
