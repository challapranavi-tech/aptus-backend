import { NextRequest } from "next/server";
import { writeAudit } from "@/lib/server/audit-log";
import {
  clearAllAuthCookies,
  getSessionFromRequest,
  jsonOk,
  revokeAccessToken,
} from "@/lib/server/http";
import { revokeAllUserRefreshTokens } from "@/lib/server/refresh-tokens";
import { getClientIp } from "@/lib/server/logger";

export async function POST(request: NextRequest) {
  const claims = await getSessionFromRequest(request);
  const ip = getClientIp(request);

  if (claims) {
    revokeAccessToken(claims);
    revokeAllUserRefreshTokens(claims.sub);
    writeAudit({
      action: "auth.logout",
      actorId: claims.sub,
      traceId: claims.traceId,
      ip,
    });
  }

  const response = jsonOk({ ok: true });
  clearAllAuthCookies(response);
  return response;
}
