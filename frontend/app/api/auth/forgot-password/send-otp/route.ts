import { NextRequest } from "next/server";
import { sendPasswordRecoveryOtp } from "@/lib/server/auth-service";
import { writeAudit } from "@/lib/server/audit-log";
import { isDemoMode } from "@/lib/server/config";
import { jsonError, jsonOk } from "@/lib/server/http";
import { getClientIp, logger } from "@/lib/server/logger";
import { enforceIdentifierLimit } from "@/lib/server/rate-limit-guard";
import { IDENTIFIER_RULES } from "@/lib/server/rate-limit-policy";
import { sendOtpSchema, validationErrorResponse } from "@/lib/server/validation";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

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

  const limit = await enforceIdentifierLimit(
    IDENTIFIER_RULES.otpRecovery,
    parsed.data.recoveryToken,
  );
  if (!limit.ok) return limit.response;

  const result = await sendPasswordRecoveryOtp(parsed.data.recoveryToken, parsed.data.channel);
  if (!result.ok) {
    const status =
      result.code === "SESSION_EXPIRED" ? 400 : result.code === "SMS_UNAVAILABLE" ? 503 : 502;
    return jsonError(result.message, status, result.code);
  }

  writeAudit({
    action: "auth.password_reset_otp",
    ip,
    metadata: { channel: result.channel },
  });

  logger.info("Password recovery OTP issued", {
    channel: result.channel,
    ip,
    demo: isDemoMode(),
  });

  return jsonOk({
    sent: true,
    channel: result.channel,
    maskedDestination: result.maskedDestination,
    demoCode: result.demoCode,
  });
}
