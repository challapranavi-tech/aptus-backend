import { isDemoMode } from "./config";
import { resolvePartnerOrder } from "./odoo/orders";
import {
  resolvePortalOrderForPartner as resolveDemoPortalOrder,
  upsertPortalOrderSnapshot,
} from "./portal-orders";
import type { PortalOrder } from "@/types/orders";

type OrderSnapshot = Partial<PortalOrder> & {
  id: string;
  reference: string;
  partnerId: number;
  status: PortalOrder["status"];
  duration: PortalOrder["duration"];
  items: PortalOrder["items"];
};

/**
 * Resolve an order for a partner: Odoo in live mode, local demo store otherwise.
 * Optional snapshot is only used as a last-resort shape when the record is not yet readable
 * (should be rare once the order exists in Odoo).
 */
export async function resolveOrderForPartner(input: {
  orderId: string;
  partnerId: number;
  actorId?: string;
  snapshot?: OrderSnapshot | null;
}): Promise<PortalOrder | null> {
  if (isDemoMode()) {
    const local = resolveDemoPortalOrder(input.orderId, input.partnerId);
    if (local) return local;
    if (input.snapshot) {
      const now = new Date().toISOString();
      return upsertPortalOrderSnapshot({
        id: input.snapshot.id,
        reference: input.snapshot.reference,
        actorId: input.snapshot.actorId ?? input.actorId ?? "",
        partnerId: input.partnerId,
        status: input.snapshot.status,
        duration: input.snapshot.duration,
        items: input.snapshot.items,
        leadId: input.snapshot.leadId,
        saleOrderId: input.snapshot.saleOrderId,
        paymentStatus: input.snapshot.paymentStatus ?? "pending",
        amountDue: input.snapshot.amountDue,
        createdAt: input.snapshot.createdAt ?? now,
        updatedAt: input.snapshot.updatedAt ?? now,
      });
    }
    return null;
  }

  const fromOdoo = await resolvePartnerOrder(input.partnerId, input.orderId);
  if (fromOdoo) return fromOdoo;

  if (input.snapshot?.saleOrderId) {
    return resolvePartnerOrder(input.partnerId, `odoo-so-${input.snapshot.saleOrderId}`);
  }
  if (input.snapshot?.leadId) {
    return resolvePartnerOrder(input.partnerId, `odoo-lead-${input.snapshot.leadId}`);
  }
  if (input.snapshot?.id) {
    return resolvePartnerOrder(input.partnerId, input.snapshot.id);
  }

  return null;
}
