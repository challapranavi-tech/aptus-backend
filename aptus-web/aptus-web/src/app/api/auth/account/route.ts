import { NextRequest } from "next/server";
import { softDeletePortalAccount } from "@/lib/server/portal-accounts";
import {
  clearAllAuthCookies,
  getSessionFromRequest,
  jsonError,
  jsonOk,
  revokeAccessToken,
} from "@/lib/server/http";
import { revokeAllUserRefreshTokens } from "@/lib/server/refresh-tokens";

/** Soft-delete account (GDPR right to erasure) — anonymises PII, retains audit trail. */
export async function DELETE(request: NextRequest) {
  const claims = await getSessionFromRequest(request);
  if (!claims) {
    return jsonError("Not authenticated", 401);
  }

  const deleted = softDeletePortalAccount(claims.sub, claims.sub);
  if (!deleted) {
    return jsonError("Account not found", 404);
  }

  revokeAccessToken(claims);
  revokeAllUserRefreshTokens(claims.sub);

  const response = jsonOk({ deleted: true });
  clearAllAuthCookies(response);
  return response;
}
