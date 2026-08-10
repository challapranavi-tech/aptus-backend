import { NextRequest } from "next/server";
import {
  claimsFromProfile,
  isEmailVerificationPending,
  registerCustomer,
} from "@/lib/server/auth-service";
import { writeAudit } from "@/lib/server/audit-log";
import { isDemoMode } from "@/lib/server/config";
import {
  authJsonResponse,
  getSessionFromRequest,
  issueAuthTokens,
  jsonError,
  jsonOk,
} from "@/lib/server/http";
import { getClientIp, logger } from "@/lib/server/logger";
import { registerSchema, validationErrorResponse } from "@/lib/server/validation";
import { NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

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
    const result = await registerCustomer({
      email: data.email,
      password: data.password,
      name: data.name,
      companyName: data.companyName,
      region: data.region,
      crNumber: data.crNumber,
      userType: data.userType,
      contactType: data.userType === "individual" ? "person" : "company",
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

    if (!result.ok) {
      const title =
        result.conflictField === "cr"
          ? "CR Number Already Exists"
          : result.conflictField === "mobile"
            ? "Mobile Number Already Exists"
            : "Account Already Exists";

      return NextResponse.json(
        {
          error: title,
          code: "ACCOUNT_EXISTS",
          conflictField: result.conflictField,
          maskedEmail: result.maskedEmail,
          maskedPhone: result.maskedPhone,
          recoveryToken: result.recoveryToken,
          message:
            "Please use Forgot Password to access your account.",
        },
        { status: 409 },
      );
    }

    const profile = result.profile;
    const actorId = profile.portalAccountId ?? profile.id;

    // security: never grant a live session (or refresh cookie) to an account that still
    // needs to verify its email — issuing tokens here would let registration itself
    // bypass the login-time verification gate.
    const verificationRequired = await isEmailVerificationPending(actorId);

    writeAudit({
      action: "auth.register",
      actorId,
      ip,
      metadata: { verificationRequired },
    });

    logger.info("Client registered", {
      userId: actorId,
      verificationRequired,
      ip,
    });

    if (verificationRequired) {
      return jsonOk(
        {
          user: profile,
          mode: isDemoMode() ? "demo" : "live",
          verificationRequired: true,
        },
        201,
      );
    }

    const tokens = await issueAuthTokens(claimsFromProfile(profile));
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
