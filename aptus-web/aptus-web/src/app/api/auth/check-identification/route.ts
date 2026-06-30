import { NextRequest } from "next/server";
import { checkIdentification } from "@/lib/server/auth-service";
import { jsonError, jsonOk, rateLimitedResponse } from "@/lib/server/http";
import { getClientIp } from "@/lib/server/logger";
import { AUTH_RATE_LIMIT, checkRateLimit, rateLimitKey } from "@/lib/server/rate-limit";
import { checkIdentificationSchema, validationErrorResponse } from "@/lib/server/validation";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const ipLimit = await checkRateLimit(
    rateLimitKey("auth:check-id", ip),
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

  const parsed = checkIdentificationSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(
      parsed.error.issues[0]?.message ?? validationErrorResponse(parsed.error).error,
      400,
    );
  }

  const result = await checkIdentification(
    parsed.data.userType,
    parsed.data.identifier,
    parsed.data.pendingEmail,
  );
  return jsonOk(result);
}
