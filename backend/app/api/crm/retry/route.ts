/**
 * POST|GET /api/crm/retry — drain pending crm.lead creates (Vercel Cron).
 *
 * Auth: Authorization Bearer CRON_SECRET (Vercel cron) or
 * X-Cron-Token matching CRON_SECRET or ODOO_REVALIDATE_TOKEN.
 *
 * ponytail: vercel.json cron is daily (`0 0 * * *`) — Hobby forbids
 * sub-daily schedules and rejects the deploy. On Pro, tighten to `*/15 * * * *`.
 */
import { jsonCors, corsPreflight } from "@/lib/api-cors";
import { retryPendingCrmLeads } from "@/lib/crm-pending";
import { secureCompare } from "@shared/lib/secure-compare";
import { NextRequest } from "next/server";

export async function OPTIONS(req: NextRequest) {
  return corsPreflight(req) ?? new Response(null, { status: 405 });
}

function expectedSecrets(): string[] {
  return [
    process.env.CRON_SECRET?.trim(),
    process.env.ODOO_REVALIDATE_TOKEN?.trim(),
  ].filter((s): s is string => Boolean(s));
}

function tokenFromRequest(req: NextRequest): string {
  const auth = req.headers.get("authorization")?.trim() ?? "";
  if (auth.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }
  return req.headers.get("x-cron-token")?.trim() ?? "";
}

async function run(req: NextRequest) {
  const secrets = expectedSecrets();
  if (!secrets.length) {
    return jsonCors(
      req,
      {
        error: "Server misconfigured",
        hint: "Set CRON_SECRET or ODOO_REVALIDATE_TOKEN.",
      },
      { status: 503 },
    );
  }
  const provided = tokenFromRequest(req);
  if (!provided || !secrets.some((s) => secureCompare(provided, s))) {
    return jsonCors(req, { error: "Unauthorized" }, { status: 401 });
  }

  const result = await retryPendingCrmLeads();
  return jsonCors(req, { ok: true, ...result });
}

export async function GET(req: NextRequest) {
  return run(req);
}

export async function POST(req: NextRequest) {
  const preflight = corsPreflight(req);
  if (preflight) return preflight;
  return run(req);
}
