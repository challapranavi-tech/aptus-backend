export type PortalOrderStatus =
  | "Submitted"
  | "Under Review"
  | "Approved"
  | "Rejected"
  | "Completed";

export type OrderPaymentStatus = "pending" | "paid" | "failed";

export type OrderLineItem = {
  category: string;
  productName: string;
  quantity: number;
};

export type PortalOrder = {
  id: string;
  reference: string;
  actorId: string;
  partnerId: number;
  status: PortalOrderStatus;
  duration: "1year" | "3year";
  items: OrderLineItem[];
  leadId?: number;
  saleOrderId?: number;
  createdAt: string;
  updatedAt: string;
  idempotencyKey?: string;
  paymentStatus?: OrderPaymentStatus;
  paymentIntentId?: string;
  amountDue?: number;
  amountPaid?: number;
  paymentMethod?: string;
  paidAt?: string;
  customerMessage?: string;
};

export type OrdersResponse = {
  orders: PortalOrder[];
  mode?: "demo" | "live";
};
