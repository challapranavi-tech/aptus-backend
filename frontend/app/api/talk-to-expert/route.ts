import { createTalkToExpertLead } from "@/lib/server/odoo/talk-to-expert";
import { isOdooConfigured } from "@/lib/server/config";
import { NextRequest, NextResponse } from "next/server";

/**
 * Talk to Expert contact gate.
 * 1) Prefer backend API when APTUS_API_URL is set (backend holds Odoo + stage id).
 * 2) Else create via frontend Odoo (portal ODOO_* vars).
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
}): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false }> {
  const base = backendBase();
  if (!base) return { ok: false };

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
    if (upstream.ok && data.ok === true) {
      return { ok: true, data };
    }
    console.error(
      "[api/talk-to-expert] backend proxy non-ok:",
      upstream.status,
      data,
    );
    return { ok: false };
  } catch (err) {
    console.error(
      "[api/talk-to-expert] backend proxy error:",
      err instanceof Error ? err.message : err,
    );
    return { ok: false };
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

  // 1) Backend first — usually where Odoo + stage id are configured.
  const proxied = await tryBackendProxy({ name, email, phone });
  if (proxied.ok) {
    return NextResponse.json(proxied.data);
  }

  // 2) Frontend Odoo (portal credentials).
  if (isOdooConfigured()) {
    const result = await createTalkToExpertLead({ name, email, phone });
    if (result.crmSynced) {
      return NextResponse.json({
        ok: true,
        leadId: result.leadId ?? undefined,
        crmSynced: true,
      });
    }
    console.error("[api/talk-to-expert] frontend Odoo create failed:", result.error);
  } else {
    console.error(
      "[api/talk-to-expert] No APTUS_API_URL and Odoo is not configured on frontend.",
    );
  }

  // Unlock chat, but flag that CRM did not sync so ops can fix env.
  return NextResponse.json({
    ok: true,
    crmSynced: false,
    warning:
      "Contact received, but CRM sync failed. Check frontend APTUS_API_URL or ODOO_* env vars.",
  });
}
