export type Purchase = {
  id: string;
  product: string;
  date: string;
  amount: string;
  status: "Delivered" | "Processing" | "Invoiced";
};

export type Subscription = {
  id: string;
  product: string;
  seats: number;
  renewsOn: string;
  status: "Active" | "Expiring soon";
};

export type Renewal = {
  id: string;
  product: string;
  dueDate: string;
  amount: string;
  priority: "High" | "Medium";
};

export type PortalData = {
  purchases: Purchase[];
  subscriptions: Subscription[];
  renewals: Renewal[];
  stats: { label: string; value: string }[];
};

const DATA_BY_USER: Record<string, PortalData> = {};

export function getPortalData(user: { email: string }): PortalData {
  return (
    DATA_BY_USER[user.email.toLowerCase()] ?? {
      stats: [],
      purchases: [],
      subscriptions: [],
      renewals: [],
    }
  );
}
