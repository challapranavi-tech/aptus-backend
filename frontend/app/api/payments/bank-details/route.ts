import { NextRequest } from "next/server";
import { resolveProfile } from "@/lib/server/auth-service";
import { deriveBankTransferReference, getBankTransferDetails } from "@/lib/server/bank-transfer";
import { getSessionFromRequestOrRefresh, jsonError, jsonOk } from "@/lib/server/http";
import { resolveOrderForPartner } from "@/lib/server/resolve-order";

export async function GET(request: NextRequest) {
  const claims = await getSessionFromRequestOrRefresh(request);
  if (!claims) {
    return jsonError("Not authenticated", 401);
  }

  const bankDetails = getBankTransferDetails();
  const orderId = request.nextUrl.searchParams.get("orderId")?.trim();
  if (!orderId) {
    return jsonOk({ bankDetails });
  }

  const profile = await resolveProfile(claims);
  const order = profile?.partnerId
    ? await resolveOrderForPartner({
        orderId,
        partnerId: profile.partnerId,
        actorId: claims.sub,
      })
    : null;

  const createdAt =
    order?.createdAt ?? request.nextUrl.searchParams.get("createdAt")?.trim() ?? undefined;

  return jsonOk({
    bankDetails,
    paymentReference:
      order?.bankTransferReference ?? deriveBankTransferReference({ id: orderId, createdAt }),
  });
}
