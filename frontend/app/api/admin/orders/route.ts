import { NextRequest } from "next/server";
import { isAdminClaims } from "@/lib/server/admin-auth";
import { isDemoMode } from "@/lib/server/config";
import { getSessionFromRequestOrRefresh, jsonError, jsonOk } from "@/lib/server/http";
import { listAllPortalOrdersFromOdoo } from "@/lib/server/odoo/orders";
import { listAllPortalOrders } from "@/lib/server/portal-orders";

export async function GET(request: NextRequest) {
  const claims = await getSessionFromRequestOrRefresh(request);
  if (!claims) {
    return jsonError("Not authenticated", 401);
  }

  if (!isAdminClaims(claims)) {
    return jsonError("Admin access required", 403);
  }

  if (isDemoMode()) {
    return jsonOk({ orders: listAllPortalOrders(200), mode: "demo" }, 200, {
      "Cache-Control": "no-store",
    });
  }

  const orders = await listAllPortalOrdersFromOdoo(200);
  return jsonOk({ orders, mode: "live" }, 200, { "Cache-Control": "no-store" });
}
