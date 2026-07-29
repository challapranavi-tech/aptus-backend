import { corsPreflight, jsonCors, withCors } from "@/lib/api-cors";
import {
  formatMuscatDateTime,
  resolveContactRouting,
} from "@/lib/contact-routing";
import { reportCrmLeadFailure } from "@/lib/crm-failure";
import { newQuoteRef } from "@/lib/crm-pending";
import { requireJsonContentType, validationError } from "@/lib/api-validate";
import { isMailConfigured, sendEmail } from "@/lib/mail";
import {
  createCrmLead,
  isOdooConfigured,
  nextRequestQuoteRef,
} from "@/lib/odoo";
import {
  enforceKeyRateLimit,
  identityKey,
} from "@/lib/rate-limit-http";
import { parseContactRequest } from "@shared/lib/contact-request";
import { NextRequest } from "next/server";

/** Allow email + Odoo CRM create on Vercel (default hobby limit is too short). */
export const maxDuration = 60;

/** Reject multi-MB JSON abuse before parse (quote forms are a few KB). */
const MAX_CONTACT_BODY_BYTES = 32 * 1024;

export async function OPTIONS(req: NextRequest) {
  return corsPreflight(req) ?? new Response(null, { status: 405 });
}

export async function POST(req: NextRequest) {
  const preflight = corsPreflight(req);
  if (preflight) return preflight;

  const ctError = requireJsonContentType(req);
  if (ctError) {
    return validationError(ctError, (res) => withCors(res, req));
  }

  const contentLength = Number(req.headers.get("content-length") ?? "0");
  if (contentLength > MAX_CONTACT_BODY_BYTES) {
    return jsonCors(
      req,
      { error: "Request body too large." },
      { status: 413 },
    );
  }

  let raw: unknown;
  try {
    const text = await req.text();
    if (text.length > MAX_CONTACT_BODY_BYTES) {
      return jsonCors(
        req,
        { error: "Request body too large." },
        { status: 413 },
      );
    }
    raw = JSON.parse(text) as unknown;
  } catch {
    return validationError(
      { _form: "Invalid JSON body." },
      (res) => withCors(res, req),
    );
  }

  const parsed = parseContactRequest(raw);
  if (!parsed.ok) {
    return validationError(parsed.errors, (res) => withCors(res, req));
  }

  const { first_name, last_name, email, company, phone, product, qty, message, category } =
    parsed.data;

  // IP limit is in middleware; email caps repeat abuse from rotating IPs.
  const emailLimited = await enforceKeyRateLimit(
    identityKey(email),
    "publicWriteIdentity",
    "contact",
    (res) => withCors(res, req),
  );
  if (emailLimited) return emailLimited;

  if (!isMailConfigured()) {
    console.error("[contact] RESEND_API_KEY is not configured.");
    return jsonCors(
      req,
      { error: "Email service is not configured. Please try again later." },
      { status: 500 },
    );
  }

  const routing = resolveContactRouting({
    product,
    categoryHint: category,
  });
  const name = [first_name, last_name].filter(Boolean).join(" ");
  const isQuote = Boolean(product && product !== "Others");

  // Quote requests: Odoo sequence request.quote (RQ-…). Fallback to JS Q-… if Odoo down.
  // Non-quote /api/contact traffic keeps the local Q-… ref (no CRM).
  let quoteRef: string;
  if (isQuote && isOdooConfigured()) {
    try {
      quoteRef = await nextRequestQuoteRef();
      console.info(`[contact] Odoo quoteRef=${quoteRef}`);
    } catch (err) {
      quoteRef = newQuoteRef();
      console.error(
        `[contact] request.quote sequence failed; using JS fallback quoteRef=${quoteRef}:`,
        err instanceof Error ? err.message : err,
      );
    }
  } else {
    quoteRef = newQuoteRef();
  }

  const crmInput = {
    firstName: first_name,
    lastName: last_name,
    company,
    email,
    phone,
    product,
    qty,
    categoryLabel: routing.categoryLabel,
    message,
    quoteRef,
  };

  const result = await sendEmail({
    to: routing.to,
    replyTo: email,
    subject: isQuote
      ? `New quote request ${quoteRef} from ${name} (${routing.categoryLabel})`
      : `New contact message ${quoteRef} from ${name}`,
    text: [
      `Quote Ref: ${quoteRef}`,
      `Customer Name: ${name}`,
      `Company Name: ${company}`,
      `Email: ${email}`,
      `Phone: ${phone}`,
      `Product Name: ${product || "—"}`,
      `QTY: ${qty || "—"}`,
      `Product Category: ${routing.categoryLabel}`,
      `Date & Time: ${formatMuscatDateTime()}`,
      `Source: Website – Request Quote`,
      "",
      message || "(no message)",
    ].join("\n"),
  });
  if (!result.ok) {
    console.error("[contact] send failed:", result.error);
    return jsonCors(req, { error: "Failed to send." }, { status: 502 });
  }

  // Quote requests only — plain contact CTAs must not create Odoo CRM records.
  let crmSynced = false;
  if (isQuote && isOdooConfigured()) {
    try {
      const leadId = await createCrmLead(crmInput);
      crmSynced = true;
      console.info(
        `[contact] crm.lead #${leadId} created quoteRef=${quoteRef}`,
      );
    } catch (err) {
      await reportCrmLeadFailure({
        quoteRef,
        input: crmInput,
        alertTo: routing.to,
        error: err,
      });
    }
  } else if (!isQuote) {
    console.info(
      `[contact] CRM skipped (not a quote product) quoteRef=${quoteRef} product=${product || "—"}`,
    );
  } else {
    console.warn(
      `[contact] CRM skipped (Odoo not configured) quoteRef=${quoteRef}`,
    );
  }

  return jsonCors(req, { ok: true, quoteRef, crmSynced });
}
