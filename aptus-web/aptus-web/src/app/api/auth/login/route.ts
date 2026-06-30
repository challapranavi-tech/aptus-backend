import { NextRequest, NextResponse } from "next/server";
import {
  authDenyMessage,
  claimsFromProfile,
  resolveLoginAttempt,
} from "@/lib/server/auth-service";
import { writeAudit } from "@/lib/server/audit-log";
import { isDemoMode } from "@/lib/server/config";
import {
  authJsonResponse,
  issueAuthTokens,
  jsonError,
  rateLimitedResponse,
} from "@/lib/server/http";
import { getClientIp, logger } from "@/lib/server/logger";
import { AUTH_RATE_LIMIT, checkRateLimit, rateLimitKey } from "@/lib/server/rate-limit";
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
  const { email, password } = parsed.data;
  const limit = await checkRateLimit(
    rateLimitKey("auth:login", ip, email),
    AUTH_RATE_LIMIT.max,
    AUTH_RATE_LIMIT.windowMs,
  );
  if (!limit.allowed) {
    logger.warn("Login rate limit exceeded", { ip, email, traceId: undefined });
    return rateLimitedResponse(limit.retryAfterSec);
  }

  const result = await resolveLoginAttempt(email, password);

  if (result.status === "success") {
    const claims = claimsFromProfile(result.profile);
    const tokens = issueAuthTokens(claims);

    writeAudit({
      action: "auth.login",
      actorId: result.account.id,
      traceId: tokens.traceId,
      ip,
    });

    logger.info("Client logged in", {
      userId: result.account.id,
      traceId: tokens.traceId,
      ip,
    });

    return authJsonResponse(
      {
        user: result.profile,
        mode: isDemoMode() ? "demo" : "live",
      },
      tokens,
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
    default:
      return jsonError("Invalid email or password", 401, "INVALID_CREDENTIALS");
  }
}
