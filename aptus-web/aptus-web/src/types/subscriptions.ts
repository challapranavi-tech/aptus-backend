export type SubscriptionStatus =
  | "Active"
  | "Expiring Soon"
  | "Expired"
  | "Cancelled";

export type SubscriptionRequestType = "renew" | "upgrade" | "downgrade" | "cancel";

export type SubscriptionItem = {
  orderId?: number;
  lineId?: number;
  productName: string;
  purchaseDate: string;
  renewalDate: string;
  renewalDateIso?: string;
  status: SubscriptionStatus;
  licenseKey: string;
};

export type SubscriptionsResponse = {
  subscriptions: SubscriptionItem[];
  mode?: "demo" | "live";
};
