import { NextRequest } from "next/server";
import { resolveProfile } from "@/lib/server/auth-service";
import { isDemoMode } from "@/lib/server/config";
import { fetchPartnerOrders } from "@/lib/server/odoo/orders";
import { listPortalOrdersForPartner } from "@/lib/server/portal-orders";
import { maybeNotifyConfirmedOrders } from "@/lib/server/subscription-confirmation";
import { getSessionFromRequestOrRefresh, jsonError, jsonOk } from "@/lib/server/http";

export async function GET(request: NextRequest) {
  const claims = await getSessionFromRequestOrRefresh(request);
  if (!claims) {
    return jsonError("Not authenticated", 401);
  }

  const profile = await resolveProfile(claims);
  if (!profile) {
    return jsonError("Profile not found", 404);
  }

  if (isDemoMode() || !profile.partnerId) {
    const orders = profile.partnerId
      ? listPortalOrdersForPartner(profile.partnerId)
      : listPortalOrdersForPartner(0).filter((order) => order.actorId === claims.sub);

    const localOrders = [...orders];
    await maybeNotifyConfirmedOrders(orders, localOrders, claims.sub);

    return jsonOk(
      { orders, mode: isDemoMode() ? "demo" : "live" },
      200,
      { "Cache-Control": "no-store" },
    );
  }

  try {
    const localOrders = listPortalOrdersForPartner(profile.partnerId);
    const orders = await fetchPartnerOrders(profile.partnerId);
    await maybeNotifyConfirmedOrders(orders, localOrders, claims.sub);
    return jsonOk(
      { orders, mode: "live" },
      200,
      { "Cache-Control": "no-store" },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load orders";
    return jsonError(message, 500);
  }
}
