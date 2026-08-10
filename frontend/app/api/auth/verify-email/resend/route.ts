import { NextRequest } from "next/server";
import { resendEmailVerification } from "@/lib/server/auth-service";
import { jsonError, jsonOk } from "@/lib/server/http";
import { enforceIdentifierLimit } from "@/lib/server/rate-limit-guard";
import { IDENTIFIER_RULES } from "@/lib/server/rate-limit-policy";
import { resendVerificationSchema, validationErrorResponse } from "@/lib/server/validation";

/**
 * Resends the post-registration verification link. Always responds with the same
 * generic message regardless of whether the email exists or is already verified,
 * so the endpoint cannot be used to enumerate accounts.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body", 400);
  }

  const parsed = resendVerificationSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(validationErrorResponse(parsed.error).error, 400);
  }

  const limit = await enforceIdentifierLimit(IDENTIFIER_RULES.emailVerifyResend, parsed.data.email);
  if (!limit.ok) return limit.response;

  await resendEmailVerification(parsed.data.email);

  return jsonOk({
    sent: true,
    message: "If that email needs verification, a new link is on its way.",
  });
}
