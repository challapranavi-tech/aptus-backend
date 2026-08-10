import { NextRequest } from "next/server";
import { verifyPasswordRecoveryOtp } from "@/lib/server/auth-service";
import { writeAudit } from "@/lib/server/audit-log";
import { jsonError, jsonOk } from "@/lib/server/http";
import { getClientIp } from "@/lib/server/logger";
import { enforceIdentifierLimit } from "@/lib/server/rate-limit-guard";
import { IDENTIFIER_RULES } from "@/lib/server/rate-limit-policy";
import { verifyOtpSchema, validationErrorResponse } from "@/lib/server/validation";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body", 400);
  }

  const parsed = verifyOtpSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(
      parsed.error.issues[0]?.message ?? validationErrorResponse(parsed.error).error,
      400,
    );
  }

  const limit = await enforceIdentifierLimit(
    IDENTIFIER_RULES.resetToken,
    parsed.data.recoveryToken,
  );
  if (!limit.ok) return limit.response;

  const valid = await verifyPasswordRecoveryOtp(parsed.data.recoveryToken, parsed.data.otp);
  if (!valid) {
    return jsonError("Invalid or expired verification code", 400, "INVALID_OTP");
  }

  writeAudit({
    action: "auth.password_reset_otp",
    ip,
    metadata: { verified: true },
  });

  return jsonOk({ verified: true });
}
