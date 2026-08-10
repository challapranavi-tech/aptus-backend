import { NextRequest } from "next/server";
import { resolveProfile } from "@/lib/server/auth-service";
import { closeCartCrmJourney, syncCartCrmJourney } from "@/lib/server/cart-crm";
import { maybeSendCartReminderForActor } from "@/lib/server/cart-reminder";
import { getSessionFromRequestOrRefresh, jsonError, jsonOk } from "@/lib/server/http";
import {
  clearStoredPortalCart,
  getStoredPortalCart,
  saveStoredPortalCart,
} from "@/lib/server/portal-cart-store";
import { portalCartSchema, validationErrorResponse } from "@/lib/server/validation";

export async function GET(request: NextRequest) {
  const claims = await getSessionFromRequestOrRefresh(request);
  if (!claims) return jsonError("Not authenticated", 401);

  const profile = await resolveProfile(claims);
  const cart = await getStoredPortalCart(claims.sub);
  if (cart?.items.length) {
    await maybeSendCartReminderForActor(claims.sub, profile?.partnerId ?? cart.partnerId);
  }

  const fresh = await getStoredPortalCart(claims.sub);
  return jsonOk({
    cart: fresh
      ? { duration: fresh.duration, items: fresh.items }
      : { duration: "1year" as const, items: [] },
  });
}

export async function PUT(request: NextRequest) {
  const claims = await getSessionFromRequestOrRefresh(request);
  if (!claims) return jsonError("Not authenticated", 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body", 400);
  }

  const parsed = portalCartSchema.safeParse(body);
  if (!parsed.success) {
    const validation = validationErrorResponse(parsed.error);
    return jsonError(validation.error, 400);
  }

  const profile = await resolveProfile(claims);
  // Read before saving: an empty cart deletes the record, taking crmLeadId with it.
  const previous = await getStoredPortalCart(claims.sub);
  const saved = await saveStoredPortalCart(claims.sub, {
    ...parsed.data,
    partnerId: profile?.partnerId ?? undefined,
  });

  // Soft-fail inside — never block cart persistence.
  if (saved?.items.length && profile?.partnerId) {
    await syncCartCrmJourney({ actorId: claims.sub, profile, cart: saved });
  } else if (!saved && previous?.items.length) {
    await closeCartCrmJourney({
      actorId: claims.sub,
      partnerId: profile?.partnerId,
      existingLeadId: previous.crmLeadId,
    });
  }

  const fresh = await getStoredPortalCart(claims.sub);
  return jsonOk({
    cart: fresh
      ? { duration: fresh.duration, items: fresh.items }
      : { duration: parsed.data.duration, items: [] },
  });
}

export async function DELETE(request: NextRequest) {
  const claims = await getSessionFromRequestOrRefresh(request);
  if (!claims) return jsonError("Not authenticated", 401);

  const profile = await resolveProfile(claims);
  const existing = await getStoredPortalCart(claims.sub);
  await clearStoredPortalCart(claims.sub);

  await closeCartCrmJourney({
    actorId: claims.sub,
    partnerId: profile?.partnerId,
    existingLeadId: existing?.crmLeadId,
  });

  return jsonOk({ ok: true });
}
