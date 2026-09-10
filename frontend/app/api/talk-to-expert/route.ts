import { createTalkToExpertLead } from "@/lib/server/odoo/talk-to-expert";
import { isOdooConfigured } from "@/lib/server/config";
import { NextRequest, NextResponse } from "next/server";

/**
 * Talk to Expert contact gate.
 * Creates the CRM lead directly via frontend Odoo (same ODOO_* as portal),
 * so it does not depend on APTUS_API_URL / backend proxy.
 */
export const maxDuration = 60;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PERSON_NAME_RE = /^(?=.*\p{L})[\p{L}\p{M}'’\- ]{2,120}$/u;

function normalizePhone(value: string): string {
  return value.replace(/[^\d+]/g, "").trim();
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

  // Prefer direct Odoo on the frontend (portal credentials). Always unlock chat.
  if (isOdooConfigured()) {
    const result = await createTalkToExpertLead({ name, email, phone });
    return NextResponse.json({
      ok: true,
      leadId: result.leadId ?? undefined,
      crmSynced: result.crmSynced,
    });
  }

  // Fallback: proxy to backend if frontend has no Odoo but backend API is set.
  const backend = (
    process.env.APTUS_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    ""
  ).replace(/\/$/, "");
  const isLocal =
    !backend || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(backend);

  if (!isLocal) {
    try {
      const upstream = await fetch(`${backend}/api/talk-to-expert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone }),
        cache: "no-store",
      });
      const data = (await upstream.json().catch(() => ({}))) as Record<
        string,
        unknown
      >;
      if (upstream.ok) {
        return NextResponse.json(data);
      }
      console.error(
        "[api/talk-to-expert] backend fallback failed:",
        upstream.status,
        data,
      );
    } catch (err) {
      console.error(
        "[api/talk-to-expert] backend fallback error:",
        err instanceof Error ? err.message : err,
      );
    }
  } else {
    console.error(
      "[api/talk-to-expert] Odoo not configured on frontend and no remote APTUS_API_URL.",
    );
  }

  // Still unlock the chatbot so the visitor can continue.
  return NextResponse.json({ ok: true, crmSynced: false });
}
