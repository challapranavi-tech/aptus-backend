/**
 * GET|POST /api/cron/recruitment-stages
 *
 * Sends a congratulations email when an applicant's recruitment card
 * has moved to a later stage (qualified, interviews, offer, and so on).
 *
 * Auth: Authorization Bearer CRON_SECRET (Vercel cron) or
 * X-Cron-Token matching CRON_SECRET or ODOO_REVALIDATE_TOKEN.
 *
 * ponytail: vercel.json cron is daily — Hobby forbids sub-daily schedules
 * and rejects the deploy. A card moved today is mailed on the next run.
 * On Pro, switch the schedule to every 15 minutes.
 */
import { jsonCors, corsPreflight } from "@/lib/api-cors";
import { isMailConfigured } from "@/lib/mail";
import { isOdooConfigured } from "@/lib/odoo";
import { notifyRecruitmentStageMoves } from "@/lib/recruitment-stage-notify";
import { secureCompare } from "@shared/lib/secure-compare";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function OPTIONS(req: NextRequest) {
  return corsPreflight(req) ?? new Response(null, { status: 405 });
}

function expectedSecrets(): string[] {
  return [
    process.env.CRON_SECRET?.trim(),
    process.env.ODOO_REVALIDATE_TOKEN?.trim(),
  ].filter((secret): secret is string => Boolean(secret));
}

function tokenFromRequest(req: NextRequest): string {
  const auth = req.headers.get("authorization")?.trim() ?? "";
  if (auth.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();
  return req.headers.get("x-cron-token")?.trim() ?? "";
}

async function run(req: NextRequest) {
  const secrets = expectedSecrets();
  if (!secrets.length) {
    return jsonCors(
      req,
      { error: "Server misconfigured", hint: "Set CRON_SECRET or ODOO_REVALIDATE_TOKEN." },
      { status: 503 },
    );
  }
  const provided = tokenFromRequest(req);
  if (!provided || !secrets.some((secret) => secureCompare(provided, secret))) {
    return jsonCors(req, { error: "Unauthorized" }, { status: 401 });
  }
  if (!isOdooConfigured() || !isMailConfigured()) {
    return jsonCors(
      req,
      { error: "Recruitment stage mail is not configured." },
      { status: 503 },
    );
  }

  try {
    const result = await notifyRecruitmentStageMoves();
    return jsonCors(req, { ok: true, ...result });
  } catch (err) {
    console.error("[recruitment-stage] run failed:", err);
    return jsonCors(
      req,
      { error: "Could not send recruitment stage emails." },
      { status: 502 },
    );
  }
}

export async function GET(req: NextRequest) {
  return run(req);
}

export async function POST(req: NextRequest) {
  const preflight = corsPreflight(req);
  if (preflight) return preflight;
  return run(req);
}
