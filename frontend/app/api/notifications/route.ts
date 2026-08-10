import { NextRequest, NextResponse } from "next/server";
import { resolveProfile } from "@/lib/server/auth-service";
import { isDemoMode } from "@/lib/server/config";
import { fetchPartnerNotifications } from "@/lib/server/odoo/notifications";
import {
  applyReadFlags,
  getReadNotificationIds,
  listNotificationsForPartner,
  markNotificationsRead,
  mergeNotifications,
} from "@/lib/server/portal-notifications";
import { getSessionFromRequestOrRefresh, jsonError, jsonOk } from "@/lib/server/http";
import { z } from "zod";

export async function GET(request: NextRequest) {
  const claims = await getSessionFromRequestOrRefresh(request);
  if (!claims) {
    return jsonError("Not authenticated", 401);
  }

  const profile = await resolveProfile(claims);
  if (!profile) {
    return jsonError("Profile not found", 404);
  }

  if (!profile.partnerId) {
    return jsonOk({ notifications: [] }, 200, { "Cache-Control": "no-store" });
  }

  const partnerId = profile.partnerId;
  const stored = listNotificationsForPartner(partnerId, 100);
  let derived: typeof stored = [];

  if (!isDemoMode()) {
    try {
      derived = await fetchPartnerNotifications(partnerId, 100);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load notifications";
      return jsonError(message, 500);
    }
  }

  const merged = mergeNotifications(stored, derived);
  const readIds = await getReadNotificationIds(partnerId);
  const notifications = applyReadFlags(merged, readIds);

  return jsonOk({ notifications }, 200, { "Cache-Control": "no-store" });
}

const markReadSchema = z.object({
  ids: z.array(z.string().min(1).max(128)).min(1).max(100),
});

export async function PATCH(request: NextRequest) {
  const claims = await getSessionFromRequestOrRefresh(request);
  if (!claims) {
    return jsonError("Not authenticated", 401);
  }

  const profile = await resolveProfile(claims);
  if (!profile?.partnerId) {
    return jsonError("No linked partner for this account", 400);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body", 400);
  }

  const parsed = markReadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid notification ids", code: "VALIDATION_ERROR" },
      { status: 400 },
    );
  }

  const marked = await markNotificationsRead(profile.partnerId, parsed.data.ids);
  return jsonOk({ ok: true, marked });
}
