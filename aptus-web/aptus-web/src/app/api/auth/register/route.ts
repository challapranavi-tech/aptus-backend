import { NextRequest } from "next/server";
import { claimsFromProfile, registerCustomer } from "@/lib/server/auth-service";
import { writeAudit } from "@/lib/server/audit-log";
import { isDemoMode } from "@/lib/server/config";
import {
  authJsonResponse,
  getSessionFromRequest,
  issueAuthTokens,
  jsonError,
  jsonOk,
  rateLimitedResponse,
} from "@/lib/server/http";
import { getClientIp, logger } from "@/lib/server/logger";
import { AUTH_RATE_LIMIT, checkRateLimit, rateLimitKey } from "@/lib/server/rate-limit";
import { registerSchema, validationErrorResponse } from "@/lib/server/validation";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const ipLimit = await checkRateLimit(
    rateLimitKey("auth:register", ip),
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

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(
      parsed.error.issues[0]?.message ?? validationErrorResponse(parsed.error).error,
      400,
    );
  }

  const data = parsed.data;

  try {
    const profile = await registerCustomer({
      email: data.email,
      password: data.password,
      name: data.name,
      companyName: data.companyName,
      region: data.region,
      crNumber: data.crNumber,
      userType: data.userType,
      contactType:
        data.userType === "individual"
          ? "person"
          : "company",
      phone: data.phone,
      street: data.street,
      street2: data.street2,
      city: data.city ?? data.region,
      state: data.state,
      zip: data.zip,
      country: data.country ?? (data.userType === "oman_company" ? "Oman" : data.country),
      taxId: data.crNumber ?? data.taxId,
      website: data.website,
      language: data.language,
      tags: data.tags,
    });

    if (!profile) {
      return jsonError(
        "An account with this email, CR number, or mobile number already exists",
        409,
      );
    }

    const tokens = issueAuthTokens(claimsFromProfile(profile));

    writeAudit({
      action: "auth.register",
      actorId: profile.portalAccountId,
      traceId: tokens.traceId,
      ip,
    });

    logger.info("Client registered", {
      userId: profile.portalAccountId,
      traceId: tokens.traceId,
      ip,
    });

    return authJsonResponse(
      {
        user: profile,
        mode: isDemoMode() ? "demo" : "live",
      },
      tokens,
      201,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed";
    return jsonError(message, 500);
  }
}

export async function GET(request: NextRequest) {
  const claims = await getSessionFromRequest(request);
  if (claims) {
    return jsonError("Already signed in", 400);
  }
  return jsonOk({ register: true, mode: isDemoMode() ? "demo" : "live" });
}
