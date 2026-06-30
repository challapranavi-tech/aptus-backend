import { NextRequest } from "next/server";
import { resolveProfile } from "@/lib/server/auth-service";
import { listNotificationsForPartner } from "@/lib/server/portal-notifications";
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

  if (!profile.partnerId) {
    return jsonOk({ notifications: [] }, 200, { "Cache-Control": "no-store" });
  }

  const notifications = listNotificationsForPartner(profile.partnerId, 100);
  return jsonOk({ notifications }, 200, { "Cache-Control": "no-store" });
}
