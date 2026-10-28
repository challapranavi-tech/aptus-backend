import { NextRequest } from "next/server";
import { writeAudit } from "@/lib/server/audit-log";
import { REFRESH_COOKIE } from "@/lib/cookie-names";
import {
  clearAllAuthCookies,
  getSessionFromRequest,
  jsonOk,
  revokeAccessToken,
} from "@/lib/server/http";
import { verifyRefreshToken } from "@/lib/server/jwt";
import { revokeAllUserRefreshTokens } from "@/lib/server/refresh-tokens";
import { getClientIp } from "@/lib/server/logger";

export async function POST(request: NextRequest) {
  let claims = await getSessionFromRequest(request);
  const ip = getClientIp(request);

  // No live access JWT — still revoke via refresh cookie so KV sessions die.
  if (!claims) {
    const refreshCookie = request.cookies.get(REFRESH_COOKIE)?.value;
    if (refreshCookie) {
      claims = await verifyRefreshToken(refreshCookie);
    }
  }

  if (claims) {
    await revokeAccessToken(claims);
    await revokeAllUserRefreshTokens(claims.sub);
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
