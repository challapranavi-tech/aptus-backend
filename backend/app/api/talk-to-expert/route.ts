import { corsPreflight, jsonCors, withCors } from "@/lib/api-cors";
import { requireJsonContentType, validationError } from "@/lib/api-validate";
import { formatMuscatDateTime } from "@/lib/contact-routing";
import { formatEnquiryThankYouEmail } from "@/lib/enquiry-email";
import { isMailConfigured, sendEmail } from "@/lib/mail";
import {
  createCrmLead,
  findPartnerIdByEmail,
  isOdooConfigured,
} from "@/lib/odoo";
import {
  enforceKeyRateLimit,
  identityKey,
} from "@/lib/rate-limit-http";
import {
  EMAIL_RE,
  PERSON_NAME_RE,
  PHONE_RE,
  type FieldErrors,
} from "@shared/lib/schema";
import { NextRequest } from "next/server";

export const maxDuration = 60;

const MAX_BODY_BYTES = 16 * 1024;

export async function OPTIONS(req: NextRequest) {
  return corsPreflight(req) ?? new Response(null, { status: 405 });
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: parts[0] };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

function parseTalkToExpertBody(raw: unknown): {
  ok: true;
  data: { name: string; email: string; phone: string };
} | {
  ok: false;
  errors: FieldErrors;
} {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { ok: false, errors: { _form: "Invalid request body." } };
  }
  const body = raw as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const errors: FieldErrors = {};

  if (!name || name.length < 2) {
    errors.name = "Please enter your name.";
  } else if (!PERSON_NAME_RE.test(name)) {
    errors.name =
      "Name can only include letters, spaces, hyphens, and apostrophes.";
  }

  if (!email) {
    errors.email = "Please enter a valid email address.";
  } else if (!EMAIL_RE.test(email)) {
    errors.email = "Please enter a valid email address.";
  }

  if (!phone) {
    errors.phone = "Please enter a valid phone number.";
  } else if (!PHONE_RE.test(phone)) {
    errors.phone = "Please enter a valid phone number.";
  }

  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, data: { name, email, phone } };
}

/**
 * Talk to an Expert chatbot lead gate → Odoo CRM + customer thank-you email.
 * Creates a distinctly named opportunity ("Talk to an Expert – …").
 * Does not notify the sales inbox.
 */
export async function POST(req: NextRequest) {
  const preflight = corsPreflight(req);
  if (preflight) return preflight;

  const ctError = requireJsonContentType(req);
  if (ctError) {
    return validationError(ctError, (res) => withCors(res, req));
  }

  const contentLength = Number(req.headers.get("content-length") ?? "0");
  if (contentLength > MAX_BODY_BYTES) {
    return jsonCors(req, { error: "Request body too large." }, { status: 413 });
  }

  let raw: unknown;
  try {
    const text = await req.text();
    if (text.length > MAX_BODY_BYTES) {
      return jsonCors(req, { error: "Request body too large." }, { status: 413 });
    }
    raw = JSON.parse(text) as unknown;
  } catch {
    return validationError(
      { _form: "Invalid JSON body." },
      (res) => withCors(res, req),
    );
  }

  const parsed = parseTalkToExpertBody(raw);
  if (!parsed.ok) {
    return validationError(parsed.errors, (res) => withCors(res, req));
  }

  const { name, email, phone } = parsed.data;

  const limited = await enforceKeyRateLimit(
    identityKey(email || phone),
    "publicWriteIdentity",
    "talk-to-expert",
    (res) => withCors(res, req),
  );
  if (limited) return limited;

  if (!isOdooConfigured()) {
    console.error("[talk-to-expert] Odoo is not configured.");
    return jsonCors(
      req,
      {
        error:
          "Odoo is not configured on the backend. Set ODOO_URL, ODOO_DB, ODOO_USER, and ODOO_API_KEY.",
        ok: false,
        crmSynced: false,
      },
      { status: 503 },
    );
  }

  const { firstName, lastName } = splitName(name);
  let partnerId: number | undefined;
  let leadId: number | null = null;

  try {
    partnerId = await findPartnerIdByEmail(email);
  } catch (err) {
    console.warn(
      "[talk-to-expert] partner lookup failed:",
      err instanceof Error ? err.message : err,
    );
  }

  try {
    leadId = await createCrmLead({
      firstName,
      lastName,
      company: "",
      email,
      phone,
      contactName: name,
      partnerId,
      channel: "talk-to-expert",
      message: "Lead captured from Talk to an Expert chatbot.",
    });
    console.info(
      `[talk-to-expert] crm.lead #${leadId} created email=${email}`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[talk-to-expert] CRM create failed:", message);
    return jsonCors(
      req,
      {
        error: `Odoo CRM create failed: ${message}`,
        ok: false,
        crmSynced: false,
      },
      { status: 502 },
    );
  }

  if (isMailConfigured()) {
    const thankYou = formatEnquiryThankYouEmail({
      customerName: name,
      enquiryId: leadId ? `TTE-${leadId}` : `TTE-${Date.now()}`,
      productName: "Talk to an Expert",
      enquiryDate: formatMuscatDateTime(),
      enquirySummary:
        "You shared your contact details via Talk to an Expert on our website. An Aptus specialist will follow up shortly.",
    });
    const thankYouResult = await sendEmail({
      to: email,
      subject: thankYou.subject,
      text: thankYou.text,
    });
    if (!thankYouResult.ok) {
      console.warn(
        `[talk-to-expert] customer thank-you failed lead=#${leadId ?? "none"}:`,
        thankYouResult.error,
      );
    }
  } else {
    console.warn(
      `[talk-to-expert] thank-you skipped (mail not configured) lead=#${leadId ?? "none"}`,
    );
  }

  return jsonCors(req, {
    ok: true,
    leadId: leadId ?? undefined,
    crmSynced: leadId != null,
  });
}
