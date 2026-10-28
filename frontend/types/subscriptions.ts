export type SubscriptionStatus =
  | "Active"
  | "Expiring Soon"
  | "Expired"
  | "Cancelled";

export type LicenseStatus = "Issued" | "Pending";

export type SubscriptionRequestType = "renew" | "upgrade" | "downgrade" | "cancel";

export type SubscriptionItem = {
  orderId?: number;
  lineId?: number;
  productName: string;
  purchaseDate: string;
  /** Display label for end/renewal date (expiry when present). */
  renewalDate: string;
  expiryDate?: string;
  renewalDateIso?: string;
  status: SubscriptionStatus;
  licenseStatus: LicenseStatus;
  licenseKey: string;
  /** Optional installer/download URL from Odoo (sale.order.line Char field). */
  downloadUrl?: string;
};

export type SubscriptionsResponse = {
  subscriptions: SubscriptionItem[];
  mode?: "demo" | "live";
};
