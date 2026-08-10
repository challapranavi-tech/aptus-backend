export type PortalNotificationStatus =
  | "Submitted"
  | "Confirmed"
  | "Approved"
  | "Action Required"
  | "Rejected"
  | "Cancelled"
  | "Expired"
  | "Failed"
  | "Processed";

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
