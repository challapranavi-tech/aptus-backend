import { createTalkToExpertLead } from "@/lib/server/odoo/talk-to-expert";
import { isOdooConfigured } from "@/lib/server/config";
import { NextRequest, NextResponse } from "next/server";

/**
 * Talk to Expert contact gate.
 * 1) Prefer backend API when APTUS_API_URL is set (backend holds Odoo + stage id).
 * 2) Else create via frontend Odoo (portal ODOO_* vars).
 * Fails loudly when CRM does not sync so missing env is obvious.
 */
export const maxDuration = 60;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PERSON_NAME_RE = /^(?=.*\p{L})[\p{L}\p{M}'’\- ]{2,120}$/u;

function normalizePhone(value: string): string {
  return value.replace(/[^\d+]/g, "").trim();
}

function backendBase(): string | null {
  const raw = (
    process.env.APTUS_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    ""
  ).replace(/\/$/, "");
  if (!raw) return null;
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(raw)) {
    if (process.env.VERCEL) return null;
  }
  return raw;
}

function parseBody(raw: unknown): {
  ok: true;
  data: { name: string; email: string; phone: string };
} | {
  ok: false;
  error: string;
} {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { ok: false, error: "Invalid request body." };
  }
  const body = raw as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const phone =
    typeof body.phone === "string" ? normalizePhone(body.phone.trim()) : "";

  if (!name || name.length < 2 || !PERSON_NAME_RE.test(name)) {
    return {
      ok: false,
      error: "Please enter a valid name (letters, spaces, hyphens, apostrophes).",
    };
  }
  if (!email || !EMAIL_RE.test(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) {
    return { ok: false, error: "Please enter a valid phone number." };
  }

  return { ok: true, data: { name, email, phone } };
}

async function tryBackendProxy(payload: {
  name: string;
  email: string;
  phone: string;
}): Promise<
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; detail: string }
> {
  const base = backendBase();
  if (!base) {
    return {
      ok: false,
      detail:
        "Frontend APTUS_API_URL is missing or points to localhost. Set it to your backend Vercel URL.",
    };
  }

  try {
    const upstream = await fetch(`${base}/api/talk-to-expert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    const data = (await upstream.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    if (upstream.ok && data.ok === true && data.crmSynced !== false) {
      return { ok: true, data };
    }
    if (upstream.ok && data.ok === true && data.crmSynced === false) {
      return {
        ok: false,
        detail:
          "Backend reached, but CRM did not sync. Check backend ODOO_URL / ODOO_DB / ODOO_USER / ODOO_API_KEY and ODOO_CRM_TALK_TO_EXPERT_STAGE_ID=10.",
      };
    }
    const errMsg =
      typeof data.error === "string"
        ? data.error
        : `Backend returned HTTP ${upstream.status}.`;
    return { ok: false, detail: errMsg };
  } catch (err) {
    return {
      ok: false,
      detail: `Could not reach backend (${err instanceof Error ? err.message : "network error"}). Check APTUS_API_URL.`,
    };
  }
}

export async function POST(req: NextRequest) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = parseBody(raw);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { name, email, phone } = parsed.data;
  const errors: string[] = [];

  const proxied = await tryBackendProxy({ name, email, phone });
  if (proxied.ok) {
    return NextResponse.json(proxied.data);
  }
  errors.push(proxied.detail);

  if (isOdooConfigured()) {
    const result = await createTalkToExpertLead({ name, email, phone });
    if (result.crmSynced) {
      return NextResponse.json({
        ok: true,
        leadId: result.leadId ?? undefined,
        crmSynced: true,
      });
    }
    errors.push(
      result.error
        ? `Frontend Odoo create failed: ${result.error}`
        : "Frontend Odoo create failed.",
    );
  } else {
    errors.push(
      "Frontend ODOO_* vars are not set (copy ODOO_URL, ODOO_DB, ODOO_USER, ODOO_API_KEY from backend, or set APTUS_API_URL).",
    );
  }

  return NextResponse.json(
    {
      error:
        "We couldn't save your details to Odoo CRM. " +
        errors.filter(Boolean).join(" "),
      details: errors,
    },
    { status: 502 },
  );
}

/** Quick config check — open /api/talk-to-expert in the browser. */
export async function GET() {
  const base = backendBase();
  return NextResponse.json({
    ok: true,
    frontendOdooConfigured: isOdooConfigured(),
    aptusApiUrlConfigured: Boolean(base),
    talkToExpertStageId:
      process.env.ODOO_CRM_TALK_TO_EXPERT_STAGE_ID?.trim() || null,
  });
}
