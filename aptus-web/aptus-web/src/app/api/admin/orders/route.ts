import { NextRequest } from "next/server";
import { isAdminClaims } from "@/lib/server/admin-auth";
import { getSessionFromRequestOrRefresh, jsonError, jsonOk } from "@/lib/server/http";
import { listAllPortalOrders } from "@/lib/server/portal-orders";

export async function GET(request: NextRequest) {
  const claims = await getSessionFromRequestOrRefresh(request);
  if (!claims) {
    return jsonError("Not authenticated", 401);
  }

  if (!isAdminClaims(claims)) {
    return jsonError("Admin access required", 403);
  }

  const orders = listAllPortalOrders(200);
  return jsonOk({ orders }, 200, { "Cache-Control": "no-store" });
}
