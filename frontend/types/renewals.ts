export type RenewalRequestStatus = "Submitted" | "Approved" | "Rejected";

export type PortalRenewalRequest = {
  id: string;
  reference: string;
  actorId: string;
  partnerId: number;
  productName: string;
  orderId?: number;
  lineId?: number;
  renewalDateIso?: string;
  leadId?: number;
  status: RenewalRequestStatus;
  createdAt: string;
  updatedAt: string;
};
