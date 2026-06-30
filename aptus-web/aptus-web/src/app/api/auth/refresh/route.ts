import { NextRequest } from "next/server";
import { writeAudit } from "@/lib/server/audit-log";
import {
  attachAuthToResponse,
  clearAllAuthCookies,
  getRefreshTokenFromCookies,
  jsonError,
  jsonOk,
  rateLimitedResponse,
  refreshAuthTokensOnce,
} from "@/lib/server/http";
import { getClientIp, logger } from "@/lib/server/logger";
import { REFRESH_RATE_LIMIT, checkRateLimit, rateLimitKey } from "@/lib/server/rate-limit";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = await checkRateLimit(
    rateLimitKey("auth:refresh", ip),
    REFRESH_RATE_LIMIT.max,
    REFRESH_RATE_LIMIT.windowMs,
  );
  if (!limit.allowed) {
    return rateLimitedResponse(limit.retryAfterSec);
  }

  const refreshToken = (await getRefreshTokenFromCookies()) ?? undefined;
  if (!refreshToken) {
    return jsonError("Refresh token missing", 401, "REFRESH_MISSING");
  }

  const result = await refreshAuthTokensOnce(refreshToken);
  if (!result.ok) {
    const response = jsonError(
      result.reason === "reuse_detected"
        ? "Session invalidated due to token reuse"
        : "Invalid or expired refresh token",
      401,
      result.reason === "reuse_detected" ? "TOKEN_REUSE" : "REFRESH_INVALID",
    );
    clearAllAuthCookies(response);
    if (result.reason === "reuse_detected") {
      writeAudit({ action: "auth.token_reuse", ip });
      logger.warn("Refresh token reuse detected", { ip });
    }
    return response;
  }

  writeAudit({
    action: "auth.refresh",
    traceId: result.tokens.traceId,
    ip,
  });

  const response = jsonOk({
    accessToken: result.tokens.accessToken,
    expiresIn: result.tokens.expiresIn,
    traceId: result.tokens.traceId,
  });
  return attachAuthToResponse(response, result.tokens);
}
