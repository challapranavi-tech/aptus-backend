import { NextRequest } from "next/server";
import { resolveProfile } from "@/lib/server/auth-service";
import { isDemoMode } from "@/lib/server/config";
import { createSubscriptionLead } from "@/lib/server/odoo/leads";
import { createPortalSaleOrder } from "@/lib/server/odoo/sales";
import { getSessionFromRequestOrRefresh, jsonError, jsonOk } from "@/lib/server/http";

export async function POST(request: NextRequest) {
  const claims = await getSessionFromRequestOrRefresh(request);
  if (!claims) {
    return jsonError("Not authenticated", 401);
  }

  let body: { productName?: string; notes?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body", 400);
  }

  const productName = body.productName?.trim();
  if (!productName) {
    return jsonError("Product name is required", 400);
  }

  const profile = await resolveProfile(claims);
  if (!profile) {
    return jsonError("Profile not found", 404);
  }

  if (isDemoMode()) {
    return jsonOk({
      ok: true,
      mode: "demo",
      message: `Subscription request recorded for ${productName}. Connect Odoo to create CRM leads.`,
      reference: `DEMO-${Date.now()}`,
    });
  }

  if (!profile.partnerId) {
    return jsonError("No linked Odoo partner for this account", 400);
  }

  try {
    const leadId = await createSubscriptionLead({
      partnerId: profile.partnerId,
      productName,
      notes: body.notes,
    });

    let saleOrderId: number | undefined;
    try {
      saleOrderId = await createPortalSaleOrder({
        partnerId: profile.partnerId,
        productName,
        notes: body.notes,
      });
    } catch {
      /* Sale order is best-effort; CRM lead is the primary record */
    }

    return jsonOk({
      ok: true,
      mode: "live",
      message: saleOrderId
        ? "Subscription recorded in Odoo (opportunity + quotation)."
        : "Subscription opportunity created in Odoo. Add a matching product name in Odoo Sales for quotations.",
      reference: saleOrderId ? `SO-${saleOrderId}` : `LEAD-${leadId}`,
      leadId,
      saleOrderId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create subscription";
    return jsonError(message, 500);
  }
}
