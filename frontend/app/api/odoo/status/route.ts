import { isDemoMode } from "@/lib/server/config";
import { jsonOk } from "@/lib/server/http";
import { getOdooConnectionStatus } from "@/lib/server/odoo/health";

export async function GET() {
  const status = await getOdooConnectionStatus();
  return jsonOk({
    ...status,
    demoMode: isDemoMode(),
  });
}
