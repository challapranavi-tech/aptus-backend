import { NextRequest } from "next/server";
import { softDeleteCustomerAccount } from "@/lib/server/auth-service";
import {
  clearAllAuthCookies,
  getSessionFromRequest,
  jsonError,
  jsonOk,
  revokeAccessToken,
} from "@/lib/server/http";
import { revokeAllUserRefreshTokens } from "@/lib/server/refresh-tokens";

/** Soft-delete account (GDPR right to erasure) — clears portal credentials on the partner. */
export async function DELETE(request: NextRequest) {
  const claims = await getSessionFromRequest(request);
  if (!claims) {
    return jsonError("Not authenticated", 401);
  }

  const deleted = await softDeleteCustomerAccount(claims.sub, claims.sub);
  if (!deleted) {
    return jsonError("Account not found", 404);
  }

  await revokeAccessToken(claims);
  await revokeAllUserRefreshTokens(claims.sub);

  const response = jsonOk({ deleted: true });
  clearAllAuthCookies(response);
  return response;
}
