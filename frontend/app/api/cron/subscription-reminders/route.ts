import { NextRequest } from "next/server";
import { processAllSubscriptionReminders } from "@/lib/server/renewal-confirmation";
import { jsonError, jsonOk } from "@/lib/server/http";
import { secureCompare } from "@shared/lib/secure-compare";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = request.headers.get("authorization");
  if (!secret || !auth || !secureCompare(auth, `Bearer ${secret}`)) {
    return jsonError("Unauthorized", 401);
  }

  const result = await processAllSubscriptionReminders();
  return jsonOk(result);
}
