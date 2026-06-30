import { NextRequest } from "next/server";
import { sendPasswordRecoveryOtp } from "@/lib/server/auth-service";
import { writeAudit } from "@/lib/server/audit-log";
import { isDemoMode } from "@/lib/server/config";
import { jsonError, jsonOk, rateLimitedResponse } from "@/lib/server/http";
import { getClientIp, logger } from "@/lib/server/logger";
import { AUTH_RATE_LIMIT, checkRateLimit, rateLimitKey } from "@/lib/server/rate-limit";
import { sendOtpSchema, validationErrorResponse } from "@/lib/server/validation";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const ipLimit = await checkRateLimit(
    rateLimitKey("auth:send-otp", ip),
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

  const parsed = sendOtpSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(
      parsed.error.issues[0]?.message ?? validationErrorResponse(parsed.error).error,
      400,
    );
  }

  const result = await sendPasswordRecoveryOtp(parsed.data.recoveryToken, parsed.data.channel);
  if (!result) {
    return jsonError("Recovery session expired. Please start again.", 400);
  }

  writeAudit({
    action: "auth.password_reset_otp",
    ip,
    metadata: { channel: parsed.data.channel },
  });

  logger.info("Password recovery OTP issued", {
    channel: parsed.data.channel,
    ip,
    demo: isDemoMode(),
  });

  return jsonOk(result);
}
