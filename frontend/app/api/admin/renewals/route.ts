import { NextRequest } from "next/server";
import { isAdminClaims } from "@/lib/server/admin-auth";
import { isDemoMode } from "@/lib/server/config";
import { listAllPortalRenewalRequests } from "@/lib/server/odoo/renewal-requests";
import { listAllRenewalRequests } from "@/lib/server/portal-renewal-requests";
import { getSessionFromRequestOrRefresh, jsonError, jsonOk } from "@/lib/server/http";

export async function GET(request: NextRequest) {
  const claims = await getSessionFromRequestOrRefresh(request);
  if (!claims) {
    return jsonError("Not authenticated", 401);
  }
  if (!isAdminClaims(claims)) {
    return jsonError("Admin access required", 403);
  }

  if (isDemoMode()) {
    return jsonOk({ ok: true, requests: listAllRenewalRequests(), mode: "demo" });
  }

  const requests = await listAllPortalRenewalRequests();
  return jsonOk({ ok: true, requests, mode: "live" });
}
