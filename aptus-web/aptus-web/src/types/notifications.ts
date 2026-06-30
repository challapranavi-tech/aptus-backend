export type PortalNotificationStatus =
  | "Submitted"
  | "Confirmed"
  | "Approved"
  | "Action Required"
  | "Rejected";

export type PortalNotificationType =
  | "order"
  | "order_approved"
  | "subscription"
  | "renewal"
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
