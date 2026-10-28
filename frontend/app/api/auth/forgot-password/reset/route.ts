import { NextRequest } from "next/server";
import { resetPasswordWithOtp } from "@/lib/server/auth-service";
import { writeAudit } from "@/lib/server/audit-log";
import { jsonError, jsonOk } from "@/lib/server/http";
import { getClientIp, logger } from "@/lib/server/logger";
import { enforceIdentifierLimit } from "@/lib/server/rate-limit-guard";
import { IDENTIFIER_RULES } from "@/lib/server/rate-limit-policy";
import { resetPasswordSchema, validationErrorResponse } from "@/lib/server/validation";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

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

  const limit = await enforceIdentifierLimit(
    IDENTIFIER_RULES.resetToken,
    parsed.data.recoveryToken,
  );
  if (!limit.ok) return limit.response;

  const profile = await resetPasswordWithOtp(
    parsed.data.recoveryToken,
    parsed.data.password,
    parsed.data.otp,
  );

  if (!profile) {
    return jsonError(
      "Verify your code before resetting the password, or the session has expired.",
      400,
      "OTP_NOT_VERIFIED",
    );
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
