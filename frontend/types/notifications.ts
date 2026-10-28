export type PortalNotificationStatus =
  | "Submitted"
  | "Approved"
  | "Payment Verification Pending"
  | "Payment Verified"
  | "License Issued"
  | "Rejected"
  | "Cancelled"
  | "Expired"
  | "Failed"
  | "Processed"
  | "Quotation Sent"
  | "Payment Received"
  /** @deprecated Prefer Payment Verified / License Issued — kept for stored notifications. */
  | "Confirmed"
  /** @deprecated Prefer Payment Verification Pending — kept for stored notifications. */
  | "Action Required";

export type PortalNotificationType =
  | "order"
  | "order_approved"
  | "order_rejected"
  | "subscription"
  | "purchase_approved"
  | "purchase_submitted"
  | "license_available"
  | "renewal"
  | "cancellation"
  | "license_expired"
  | "email_verification"
  | "new_device_login"
  | "payment_failed"
  | "refund_requested"
  | "refund_processed"
  | "quote"
  | "quote_sent"
  | "quote_payment"
  | "general";

export type PortalNotification = {
  id: string;
  partnerId: number;
  actorId?: string;
  title: string;
  detail: string;
  status: PortalNotificationStatus;
  type: PortalNotificationType;
  reference?: string;
  read: boolean;
  createdAt: string;
};

export type NotificationsResponse = {
  notifications: PortalNotification[];
};
