import { resolveProfile } from "@/lib/server/auth-service";
import { isDemoMode } from "@/lib/server/config";
import { getSessionFromCookies, jsonError, jsonOk } from "@/lib/server/http";

export async function GET() {
  const claims = await getSessionFromCookies();
  if (!claims) {
    return jsonError("Not authenticated", 401);
  }

  const profile = await resolveProfile(claims);
  if (!profile) {
    return jsonError("Profile not found", 404);
  }

  return jsonOk({ profile, mode: isDemoMode() ? "demo" : "live" });
}
