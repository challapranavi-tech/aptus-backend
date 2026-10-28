import type { PortalOrder } from "@/types/orders";

export function orderHasPaymentProof(order: PortalOrder): boolean {
  return Boolean(
    order.paymentProofFileName?.trim() ||
      order.paymentProofUrl?.trim() ||
      order.paymentProofOdooAttachmentId,
  );
}

export function ordersWithPaymentProof(orders: PortalOrder[]): PortalOrder[] {
  return orders.filter(orderHasPaymentProof);
}
