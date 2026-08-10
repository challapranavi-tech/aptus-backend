import { NextRequest, NextResponse } from "next/server";
import { resolveProfile } from "@/lib/server/auth-service";
import { isAdminClaims } from "@/lib/server/admin-auth";
import { getSessionFromRequestOrRefresh, jsonError } from "@/lib/server/http";
import { getOdooClient } from "@/lib/server/odoo/client";
import { readPaymentProofFile } from "@/lib/server/payment-proof-storage";
import { resolveOrderForPartner } from "@/lib/server/resolve-order";

type RouteContext = { params: Promise<{ id: string }> };

/** Streams payment proof from Odoo attachment (preferred) or local upload buffer. */
export async function GET(request: NextRequest, context: RouteContext) {
  const claims = await getSessionFromRequestOrRefresh(request);
  if (!claims) {
    return jsonError("Not authenticated", 401);
  }

  const profile = await resolveProfile(claims);
  const { id } = await context.params;

  const order = profile?.partnerId
    ? await resolveOrderForPartner({
        orderId: id,
        partnerId: profile.partnerId,
        actorId: claims.sub,
      })
    : null;

  if (!order) {
    return jsonError("Payment proof not found", 404);
  }

  const isOwner = profile?.partnerId === order.partnerId;
  if (!isOwner && !isAdminClaims(claims)) {
    return jsonError("Forbidden", 403);
  }

  if (order.paymentProofOdooAttachmentId) {
    const client = getOdooClient();
    if (client) {
      try {
        const rows = await client.read<{
          datas: string | false;
          name: string;
          mimetype: string | false;
        }>("ir.attachment", [order.paymentProofOdooAttachmentId], ["datas", "name", "mimetype"]);
        const attachment = rows[0];
        if (attachment && typeof attachment.datas === "string") {
          const buffer = Buffer.from(attachment.datas, "base64");
          const fileName = order.paymentProofFileName || attachment.name || "payment-proof";
          const contentType =
            typeof attachment.mimetype === "string" ? attachment.mimetype : "application/octet-stream";
          return new NextResponse(new Uint8Array(buffer), {
            status: 200,
            headers: {
              "Content-Type": contentType,
              "Content-Disposition": `attachment; filename="${fileName}"`,
              "Cache-Control": "private, no-store",
            },
          });
        }
      } catch {
        /* fall through to local */
      }
    }
  }

  if (!order.paymentProofFileName) {
    return jsonError("Payment proof not found", 404);
  }

  const storeDir = order.id;
  const files = order.paymentProofFileName;
  const fs = await import("fs");
  const path = await import("path");
  const dir = path.join(process.cwd(), ".data", "payment-proofs", storeDir);
  let matchKey = `${storeDir}/${files}`;
  try {
    const entries = fs.readdirSync(dir);
    const match = entries.find((entry) => entry.endsWith(files));
    if (match) matchKey = `${storeDir}/${match}`;
  } catch {
    /* fall through */
  }

  const buffer = readPaymentProofFile(matchKey);
  if (!buffer) {
    return jsonError("Payment proof not found", 404);
  }

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${order.paymentProofFileName}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
