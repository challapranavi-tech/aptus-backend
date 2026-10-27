export type QuoteLifecycleStatus =
  | "Submitted"
  | "Quotation Sent"
  | "Payment Pending"
  | "Payment Received"
  | "Won"
  | "Lost";

export type PortalQuote = {
  id: string;
  leadId: number;
  saleOrderId?: number;
  reference: string;
  productName: string;
  status: QuoteLifecycleStatus;
  stageLabel: string;
  amountTotal?: number;
  createdAt: string;
  updatedAt: string;
};

export type QuotesResponse = {
  quotes: PortalQuote[];
};
