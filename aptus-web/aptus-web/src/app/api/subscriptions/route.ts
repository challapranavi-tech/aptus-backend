import { NextRequest } from "next/server";
import { resolveProfile } from "@/lib/server/auth-service";
import { isDemoMode } from "@/lib/server/config";
import { fetchPartnerRenewalRequests } from "@/lib/server/odoo/renewal-requests";
import { fetchPartnerSubscriptions } from "@/lib/server/odoo/subscriptions";
import { listRenewalRequestsForPartner } from "@/lib/server/portal-renewal-requests";
import {
  maybeNotifyConfirmedRenewals,
  maybeSendRenewalReminders,
} from "@/lib/server/renewal-confirmation";
import { getSessionFromRequestOrRefresh, jsonError, jsonOk } from "@/lib/server/http";
import { logger } from "@/lib/server/logger";

export async function GET(request: NextRequest) {
  const claims = await getSessionFromRequestOrRefresh(request);
  if (!claims) {
    return jsonError("Not authenticated", 401);
  }

  if (isDemoMode()) {
    return jsonOk({
      subscriptions: [],
      mode: "demo",
    });
  }

  let partnerId = claims.partnerId;
  if (!partnerId) {
    const profile = await resolveProfile(claims);
    partnerId = profile?.partnerId;
  }

  if (!partnerId) {
    return jsonError("No linked Odoo partner for this account", 400);
  }

  try {
    const subscriptions = await fetchPartnerSubscriptions(partnerId, {
      includeInactive: request.nextUrl.searchParams.get("includeInactive") === "true",
    });

    await maybeSendRenewalReminders(subscriptions, partnerId);

    const localRenewals = listRenewalRequestsForPartner(partnerId);
    const renewalRequests = await fetchPartnerRenewalRequests(partnerId);
    await maybeNotifyConfirmedRenewals(renewalRequests, localRenewals, claims.sub);

    logger.info("Subscriptions loaded for portal user", {
      action: "subscriptions.list",
      partnerId,
      count: subscriptions.length,
    });
    return jsonOk(
      {
        subscriptions,
        mode: "live",
      },
      200,
      { "Cache-Control": "no-store" },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load subscriptions";
    logger.error("Subscription fetch failed", {
      action: "subscriptions.list",
      partnerId,
      error: message,
    });
    return jsonError(message, 500);
  }
}
