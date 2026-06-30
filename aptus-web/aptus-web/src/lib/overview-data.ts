import type { PortalNotification, PortalNotificationType } from "@/types/notifications";
import type { PortalOrder } from "@/types/orders";
import type { ClientProfile } from "@/types/profile";
import type { SubscriptionItem } from "@/types/subscriptions";

export type OverviewActivity = {
  id: string;
  title: string;
  detail: string;
  timestamp: string;
  kind: "order" | PortalNotificationType;
};

export type OrdersSummary = {
  pendingReview: number;
  approved: number;
  completed: number;
  rejected: number;
};

export type AccountHealth = {
  accountStatus: "Active" | "Attention";
  profileCompletion: number;
  pendingRequests: number;
  verificationStatus: "Verified" | "Pending";
  openSupportTickets: number;
  activeSubscriptions: number;
  renewalsDue: number;
};

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["Active", "Expiring Soon"]);

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function formatOverviewDate(iso: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatShortDate(iso: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function isActiveSubscription(subscription: SubscriptionItem): boolean {
  return ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status);
}

export function profileCompletionPercent(user: ClientProfile): number {
  const fields = [user.name, user.email, user.phone, user.city, user.country, user.company];
  const filled = fields.filter((value) => Boolean(String(value ?? "").trim())).length;
  return Math.round((filled / fields.length) * 100);
}

export function summarizeOrders(orders: PortalOrder[]): OrdersSummary {
  return {
    pendingReview: orders.filter(
      (order) => order.status === "Submitted" || order.status === "Under Review",
    ).length,
    approved: orders.filter((order) => order.status === "Approved").length,
    completed: orders.filter((order) => order.status === "Completed").length,
    rejected: orders.filter((order) => order.status === "Rejected").length,
  };
}

export function buildAccountHealth(
  user: ClientProfile,
  orders: PortalOrder[],
  subscriptions: SubscriptionItem[],
  notifications: PortalNotification[],
): AccountHealth {
  const pendingOrders = orders.filter(
    (order) => order.status === "Submitted" || order.status === "Under Review",
  ).length;
  const actionRequired = notifications.filter(
    (notification) => notification.status === "Action Required" && !notification.read,
  ).length;
  const activeSubscriptions = subscriptions.filter(isActiveSubscription).length;
  const renewalsDue = subscriptions.filter((subscription) => subscription.status === "Expiring Soon").length;
  const pendingRequests = pendingOrders + actionRequired;

  return {
    accountStatus: pendingRequests > 0 || renewalsDue > 0 ? "Attention" : "Active",
    profileCompletion: profileCompletionPercent(user),
    pendingRequests,
    verificationStatus: user.partnerId ? "Verified" : "Pending",
    openSupportTickets: 0,
    activeSubscriptions,
    renewalsDue,
  };
}

export function getAccountStatusMessage(
  health: AccountHealth,
  orders: PortalOrder[],
  notifications: PortalNotification[],
): string {
  const actionRequired = notifications.filter(
    (notification) => notification.status === "Action Required" && !notification.read,
  ).length;
  const pendingOrders = orders.filter(
    (order) => order.status === "Submitted" || order.status === "Under Review",
  ).length;

  if (actionRequired > 0) {
    return `You have ${actionRequired} alert${actionRequired === 1 ? "" : "s"} that need your attention.`;
  }
  if (pendingOrders > 0) {
    return `You have ${pendingOrders} order${pendingOrders === 1 ? "" : "s"} pending review.`;
  }
  if (health.renewalsDue > 0) {
    return `${health.renewalsDue} subscription${health.renewalsDue === 1 ? " is" : "s are"} expiring soon.`;
  }
  if (health.activeSubscriptions > 0) {
    return "Your account is active and all services are operating normally.";
  }
  return "Your account is active. Browse products or place an order to get started.";
}

function orderActivityTitle(status: PortalOrder["status"]): string {
  switch (status) {
    case "Submitted":
    case "Under Review":
      return "Purchase request submitted";
    case "Approved":
      return "Order approved";
    case "Completed":
      return "Order completed";
    case "Rejected":
      return "Order rejected";
    default:
      return "Order updated";
  }
}

export function buildActivityTimeline(
  orders: PortalOrder[],
  notifications: PortalNotification[],
  limit = 6,
): OverviewActivity[] {
  const orderEvents: OverviewActivity[] = orders.map((order) => ({
    id: `order-${order.id}`,
    title: orderActivityTitle(order.status),
    detail: `${order.reference} · ${order.items.map((item) => item.productName).join(", ") || "Software order"}`,
    timestamp: order.updatedAt || order.createdAt,
    kind: "order",
  }));

  const notificationEvents: OverviewActivity[] = notifications.map((notification) => ({
    id: `notification-${notification.id}`,
    title: notification.title,
    detail: notification.detail,
    timestamp: notification.createdAt,
    kind: notification.type,
  }));

  return [...orderEvents, ...notificationEvents]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}

export function accountTypeLabel(user: ClientProfile): string {
  if (user.contactType === "company") return "Business account";
  return "Individual account";
}
