export type RefundStatus = "Requested" | "Processed" | "Rejected";

export type PortalRefundRequest = {
  id: string;
  reference: string;
  partnerId: number;
  actorId: string;
  orderReference: string;
  productName: string;
  amount: string;
  reason?: string;
  status: RefundStatus;
  paymentMethod?: string;
  estimatedArrival?: string;
  rejectReason?: string;
  createdAt: string;
  updatedAt: string;
  processedAt?: string;
};

export type RefundsResponse = {
  refunds: PortalRefundRequest[];
};
