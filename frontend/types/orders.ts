export type PortalOrderStatus =
  | "Submitted"
  | "Under Review"
  | "Approved"
  | "Rejected"
  | "Completed";

export type OrderPaymentStatus =
  | "pending"
  | "pending_verification"
  | "paid"
  | "failed";

export type PaymentMethodId = "bank_transfer" | "card" | "stripe" | "paypal";

export type PurchaseType = "new" | "renew";

export type OrderLineItem = {
  category: string;
  productName: string;
  quantity: number;
  /** Per-line subscription term; falls back to cart/order duration when omitted. Renewal-kind products only. */
  duration?: "1year" | "3year";
  /** New license vs renewal — chosen on the product page before add to cart. Renewal-kind products only. */
  purchaseType?: PurchaseType;
  /** Selected package/seat tier id (renewal or levels products configured with packages). */
  packageId?: string;
  /** Selected level id (levels-kind products, e.g. Level 1–5). */
  levelId?: string;
  /** Existing license serial — required when renewing renewal-kind products. */
  serialNumber?: string;
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
  /** True once Software Team has issued a license key (or CRM is at License Issued). */
  licenseIssued?: boolean;
  /** Live CRM stage name when known — portal status mirrors this when present. */
  crmStage?: string;
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
  /** Reason from finance/CRM when payment or request is declined. */
  rejectReason?: string;
  /** Reference the customer is asked to quote on their bank transfer (e.g. APT-20260803-0001). */
  bankTransferReference?: string;
  paymentProofFileName?: string;
  /** Blob / storage key from savePaymentProofFile (`<orderId>/<timestamp>-<file>`). */
  paymentProofStorageKey?: string;
  paymentProofUrl?: string;
  paymentProofUploadedAt?: string;
  paymentProofOdooAttachmentId?: number;
};

export type OrdersResponse = {
  orders: PortalOrder[];
  mode?: "demo" | "live";
};
