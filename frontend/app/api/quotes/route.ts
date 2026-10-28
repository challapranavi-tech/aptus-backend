import { NextRequest } from "next/server";
import { resolveProfile } from "@/lib/server/auth-service";
import { isDemoMode } from "@/lib/server/config";
import { getSessionFromRequestOrRefresh, jsonError, jsonOk } from "@/lib/server/http";
import { fetchPartnerQuotes } from "@/lib/server/odoo/quotes";

export async function GET(request: NextRequest) {
  const claims = await getSessionFromRequestOrRefresh(request);
  if (!claims) {
    return jsonError("Not authenticated", 401);
  }

  const profile = await resolveProfile(claims);
  if (!profile) {
    return jsonError("Profile not found", 404);
  }

  if (!profile.partnerId || isDemoMode()) {
    return jsonOk({ quotes: [] }, 200, { "Cache-Control": "no-store" });
  }

  try {
    const quotes = await fetchPartnerQuotes(profile.partnerId, profile.email);
    return jsonOk({ quotes }, 200, { "Cache-Control": "no-store" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load quotes";
    return jsonError(message, 500);
  }
}
