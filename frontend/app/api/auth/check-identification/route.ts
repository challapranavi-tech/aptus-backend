import { NextRequest } from "next/server";
import { checkIdentification } from "@/lib/server/auth-service";
import { jsonError, jsonOk } from "@/lib/server/http";
import { enforceIdentifierLimit } from "@/lib/server/rate-limit-guard";
import { IDENTIFIER_RULES } from "@/lib/server/rate-limit-policy";
import { checkIdentificationSchema, validationErrorResponse } from "@/lib/server/validation";

export async function POST(request: NextRequest) {
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

  // This endpoint reveals whether a CR number or mobile is already registered,
  // so limit probes per identifier as well as per IP.
  const limit = await enforceIdentifierLimit(
    IDENTIFIER_RULES.identifyTarget,
    parsed.data.identifier,
  );
  if (!limit.ok) return limit.response;

  try {
    const result = await checkIdentification(
      parsed.data.userType,
      parsed.data.identifier,
      parsed.data.pendingEmail,
    );
    return jsonOk(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const isConfig = /UPSTASH|ODOO_|not configured|Authentication failed|Odoo lookup/i.test(
      message,
    );
    return jsonError(
      isConfig
        ? "Identification check is not fully configured. Add Odoo and Upstash Redis environment variables on Vercel, then try again."
        : "Unable to verify identification. Please try again.",
      503,
    );
  }
}
