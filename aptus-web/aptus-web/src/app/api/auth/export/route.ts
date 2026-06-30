import { NextRequest } from "next/server";
import { writeAudit } from "@/lib/server/audit-log";
import { exportPortalAccountData } from "@/lib/server/portal-accounts";
import { getSessionFromRequest, jsonError, jsonOk } from "@/lib/server/http";
import { getClientIp } from "@/lib/server/logger";

/** GDPR data export — returns all stored personal data for the authenticated user. */
export async function GET(request: NextRequest) {
  const claims = await getSessionFromRequest(request);
  if (!claims) {
    return jsonError("Not authenticated", 401);
  }

  const data = exportPortalAccountData(claims.sub);
  if (!data) {
    return jsonError("Account not found", 404);
  }

  writeAudit({
    action: "profile.export",
    actorId: claims.sub,
    targetId: claims.sub,
    traceId: claims.traceId,
    ip: getClientIp(request),
  });

  return jsonOk({ export: data });
}
