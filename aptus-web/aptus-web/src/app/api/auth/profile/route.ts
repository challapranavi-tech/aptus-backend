import { NextRequest } from "next/server";
import { claimsFromProfile, resolveProfile, updateCustomerProfile } from "@/lib/server/auth-service";
import { isDemoMode } from "@/lib/server/config";
import {
  authJsonResponse,
  clearAllAuthCookies,
  getSessionFromRequest,
  getSessionFromRequestOrRefresh,
  issueAuthTokens,
  jsonError,
  jsonOk,
} from "@/lib/server/http";
import { profileUpdateSchema } from "@/lib/server/validation";

export async function PATCH(request: NextRequest) {
  const claims = await getSessionFromRequestOrRefresh(request);
  if (!claims) {
    return jsonError("Not authenticated", 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body", 400);
  }

  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Validation failed", 400);
  }

  try {
    const profile = await updateCustomerProfile(claims.sub, parsed.data);

    if (!profile) {
      return jsonError("Profile not found", 404);
    }

    const tokens = issueAuthTokens(claimsFromProfile(profile));
    return authJsonResponse(
      {
        user: profile,
        mode: isDemoMode() ? "demo" : "live",
      },
      tokens,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Profile update failed";
    return jsonError(message, 500);
  }
}

export async function GET(request: NextRequest) {
  const claims = await getSessionFromRequestOrRefresh(request);
  if (!claims) {
    return jsonError("Not authenticated", 401);
  }

  const profile = await resolveProfile(claims);
  if (!profile) {
    const response = jsonError("Access denied. Your account may be archived in Odoo.", 403, "ACCESS_DENIED");
    clearAllAuthCookies(response);
    return response;
  }

  return jsonOk({ user: profile, mode: isDemoMode() ? "demo" : "live" });
}
