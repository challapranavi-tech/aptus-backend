import { NextRequest } from "next/server";
import { processAllCartReminders } from "@/lib/server/cart-reminder";
import { jsonError, jsonOk } from "@/lib/server/http";
import { secureCompare } from "@shared/lib/secure-compare";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = request.headers.get("authorization");
  // security: constant-time compare (OWASP) — a plain !== leaks timing info
  // proportional to matching-prefix length on a secret bearer token.
  if (!secret || !auth || !secureCompare(auth, `Bearer ${secret}`)) {
    return jsonError("Unauthorized", 401);
  }

  const result = await processAllCartReminders();
  return jsonOk(result);
}
