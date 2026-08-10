import { NextRequest } from "next/server";
import { authDenyMessage, resolveProfile } from "@/lib/server/auth-service";
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

    const profile = await resolveProfile(claims);
    if (!profile) {
      const response = jsonError(authDenyMessage("account_disabled"), 403, "ACCOUNT_DISABLED");
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
