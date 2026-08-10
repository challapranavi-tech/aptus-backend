import { NextRequest, NextResponse } from "next/server";
import {
  authDenyMessage,
  claimsFromProfile,
  maybeSendNewDeviceLoginAlert,
  resolveLoginAttempt,
} from "@/lib/server/auth-service";
import { writeAudit } from "@/lib/server/audit-log";
import { isDemoMode } from "@/lib/server/config";
import { authJsonResponse, issueAuthTokens, jsonError } from "@/lib/server/http";
import { getClientIp, logger } from "@/lib/server/logger";
import { enforceIdentifierLimit } from "@/lib/server/rate-limit-guard";
import { IDENTIFIER_RULES } from "@/lib/server/rate-limit-policy";
import { loginSchema, validationErrorResponse } from "@/lib/server/validation";

const LOGIN_DELAY_MS = 300;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body", 400);
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(validationErrorResponse(parsed.error).error, 400);
  }

  const ip = getClientIp(request);
  const { email, password, remember } = parsed.data;

  // Per-IP limits are applied in middleware; this caps attempts against a single
  // account no matter how many addresses they arrive from.
  const limit = await enforceIdentifierLimit(IDENTIFIER_RULES.loginEmail, email);
  if (!limit.ok) {
    writeAudit({ action: "security.rate_limited", ip, metadata: { scope: "auth.login" } });
    return limit.response;
  }

  let result: Awaited<ReturnType<typeof resolveLoginAttempt>>;
  try {
    result = await resolveLoginAttempt(email, password);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("Login lookup failed", {
      action: "auth.login",
      ip,
      error: message,
    });
    writeAudit({
      action: "auth.login_failed",
      ip,
      metadata: { reason: "lookup_error", error: message },
    });
    return jsonError(
      "Unable to verify account right now. Please try again.",
      503,
      "LOGIN_UNAVAILABLE",
    );
  }

  if (result.status === "success") {
    const claims = claimsFromProfile(result.profile);
    const rememberSession = remember !== false;
    const tokens = await issueAuthTokens(claims, { remember: rememberSession });
    const actorId = result.profile.portalAccountId ?? result.profile.id;

    writeAudit({
      action: "auth.login",
      actorId,
      traceId: tokens.traceId,
      ip,
    });

    logger.info("Client logged in", {
      userId: actorId,
      traceId: tokens.traceId,
      ip,
    });

    // Event 13 — best-effort, never blocks login on failure.
    await maybeSendNewDeviceLoginAlert(actorId, result.profile.email, result.profile.name, ip);

    return authJsonResponse(
      {
        user: result.profile,
        mode: isDemoMode() ? "demo" : "live",
      },
      tokens,
      200,
      { remember: rememberSession },
    );
  }

  await delay(LOGIN_DELAY_MS);
  writeAudit({
    action: "auth.login_failed",
    ip,
    metadata: { reason: result.status },
  });

  switch (result.status) {
    case "not_found":
      return jsonError(
        "No portal account found for this email. You will be guided to registration.",
        404,
        "ACCOUNT_NOT_FOUND",
      );
    case "partner_exists":
      return NextResponse.json(
        {
          error:
            "A customer record exists for this email. Complete registration with your user type and CR number or mobile.",
          code: "PARTNER_EXISTS_NO_PORTAL",
          prefill: result.prefill,
        },
        { status: 404 },
      );
    case "invalid_password":
      return NextResponse.json(
        {
          error: "Incorrect password for this registered email.",
          code: "INVALID_CREDENTIALS",
          accountExists: true,
          maskedEmail: result.maskedEmail,
          maskedPhone: result.maskedPhone,
        },
        { status: 401 },
      );
    case "account_disabled":
      return jsonError(authDenyMessage("account_disabled"), 403, "ACCOUNT_DISABLED");
    case "partner_not_found":
      return jsonError(authDenyMessage("partner_not_found"), 403, "PARTNER_NOT_FOUND");
    case "partner_archived":
      return jsonError(authDenyMessage("partner_archived"), 403, "PARTNER_ARCHIVED");
    case "partner_portal_disabled":
      return jsonError(authDenyMessage("partner_portal_disabled"), 403, "PARTNER_PORTAL_DISABLED");
    case "email_not_verified":
      return NextResponse.json(
        {
          error: "Please verify your email before signing in. Check your inbox for the verification link.",
          code: "EMAIL_NOT_VERIFIED",
          maskedEmail: result.maskedEmail,
        },
        { status: 403 },
      );
    default:
      return jsonError("Invalid email or password", 401, "INVALID_CREDENTIALS");
  }
}
