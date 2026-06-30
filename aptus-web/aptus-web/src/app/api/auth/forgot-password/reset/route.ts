import { NextRequest } from "next/server";
import { resetPasswordWithOtp } from "@/lib/server/auth-service";
import { writeAudit } from "@/lib/server/audit-log";
import { jsonError, jsonOk, rateLimitedResponse } from "@/lib/server/http";
import { getClientIp, logger } from "@/lib/server/logger";
import { AUTH_RATE_LIMIT, checkRateLimit, rateLimitKey } from "@/lib/server/rate-limit";
import { resetPasswordSchema, validationErrorResponse } from "@/lib/server/validation";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const ipLimit = await checkRateLimit(
    rateLimitKey("auth:reset-password", ip),
    AUTH_RATE_LIMIT.max,
    AUTH_RATE_LIMIT.windowMs,
  );
  if (!ipLimit.allowed) {
    return rateLimitedResponse(ipLimit.retryAfterSec);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body", 400);
  }

  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(
      parsed.error.issues[0]?.message ?? validationErrorResponse(parsed.error).error,
      400,
    );
  }

  const profile = await resetPasswordWithOtp(
    parsed.data.recoveryToken,
    parsed.data.otp,
    parsed.data.password,
  );

  if (!profile) {
    return jsonError("Invalid or expired verification code", 400);
  }

  writeAudit({
    action: "auth.password_reset",
    actorId: profile.portalAccountId,
    ip,
  });

  logger.info("Password reset completed", {
    userId: profile.portalAccountId,
    ip,
  });

  return jsonOk({ reset: true });
}
