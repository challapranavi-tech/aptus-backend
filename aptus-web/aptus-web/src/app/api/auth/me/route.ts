import { NextRequest } from "next/server";
import { authDenyMessage, resolveProfile } from "@/lib/server/auth-service";
import { getPortalAccountById } from "@/lib/server/portal-accounts";
import { checkPartnerPortalAccess } from "@/lib/server/odoo/partner-access";
import { isDemoMode } from "@/lib/server/config";
import {
  clearAllAuthCookies,
  getSessionFromRequest,
  getSessionFromRequestOrRefresh,
  jsonError,
  jsonOk,
} from "@/lib/server/http";
import { logger } from "@/lib/server/logger";

export async function GET(request: NextRequest) {
  try {
    let claims = await getSessionFromRequest(request);

    if (!claims) {
      claims = await getSessionFromRequestOrRefresh(request);
      if (!claims) {
        const response = jsonError("Not authenticated", 401);
        clearAllAuthCookies(response);
        return response;
      }
    }

    const account = getPortalAccountById(claims.sub);
    if (!account || account.status !== "active") {
      const response = jsonError(authDenyMessage("account_disabled"), 403, "ACCOUNT_DISABLED");
      clearAllAuthCookies(response);
      return response;
    }

    if (account.partnerId && !isDemoMode()) {
      const access = await checkPartnerPortalAccess(account.partnerId);
      if (!access.allowed) {
        const reason =
          access.reason === "archived"
            ? "partner_archived"
            : access.reason === "portal_disabled"
              ? "partner_portal_disabled"
              : "partner_not_found";
        const response = jsonError(authDenyMessage(reason), 403, reason.toUpperCase());
        clearAllAuthCookies(response);
        return response;
      }
    }

    const profile = await resolveProfile(claims);
    if (!profile) {
      const response = jsonError(authDenyMessage("partner_not_found"), 403, "ACCESS_DENIED");
      clearAllAuthCookies(response);
      return response;
    }

    return jsonOk({ user: profile, mode: isDemoMode() ? "demo" : "live" });
  } catch (error) {
    logger.error("Failed to resolve auth session", {
      action: "auth.me.failed",
      error: error instanceof Error ? error.message : String(error),
    });
    const response = jsonError("Unable to load session", 500, "SESSION_ERROR");
    clearAllAuthCookies(response);
    return response;
  }
}
