import { corsPreflight, jsonCors, withCors } from "@/lib/api-cors";
import { formatMuscatDateTime } from "@/lib/contact-routing";
import {
  contactEnquiryInbox,
  formatContactEnquiryEmail,
  formatEnquiryThankYouEmail,
} from "@/lib/enquiry-email";
import { requireJsonContentType, validationError } from "@/lib/api-validate";
import { isMailConfigured, sendEmail } from "@/lib/mail";
import { isOdooConfigured, registerWebsiteEnquiry } from "@/lib/odoo";
import {
  enforceKeyRateLimit,
  identityKey,
} from "@/lib/rate-limit-http";
import { parseEnquiryRequest } from "@shared/lib/enquiry-request";
import { NextRequest } from "next/server";

/** Allow Resend + Odoo on Vercel (default hobby limit is too short). */
export const maxDuration = 60;

/** Reject multi-MB JSON abuse before parse (contact forms are a few KB). */
const MAX_ENQUIRY_BODY_BYTES = 32 * 1024;

export async function OPTIONS(req: NextRequest) {
  return corsPreflight(req) ?? new Response(null, { status: 405 });
}

/**
 * Contact Form only → email (+ Odoo sequence/partner best-effort).
 * Request Quote stays on POST /api/contact — do not merge.
 *
 * Email is the hard dependency (like quote route). Odoo sync is best-effort:
 * missing config / sequence / partner write must not fail the user submission.
 */
export async function POST(req: NextRequest) {
  const preflight = corsPreflight(req);
  if (preflight) return preflight;

  const ctError = requireJsonContentType(req);
  if (ctError) {
    return validationError(ctError, (res) => withCors(res, req));
  }

  const contentLength = Number(req.headers.get("content-length") ?? "0");
  if (contentLength > MAX_ENQUIRY_BODY_BYTES) {
    return jsonCors(
      req,
      { error: "Request body too large." },
      { status: 413 },
    );
  }

  let raw: unknown;
  try {
    const text = await req.text();
    if (text.length > MAX_ENQUIRY_BODY_BYTES) {
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

  const parsed = parseEnquiryRequest(raw);
  if (!parsed.ok) {
    return validationError(parsed.errors, (res) => withCors(res, req));
  }

  const data = parsed.data;

  const emailLimited = await enforceKeyRateLimit(
    identityKey(data.email),
    "publicWriteIdentity",
    "enquiry",
    (res) => withCors(res, req),
  );
  if (emailLimited) return emailLimited;

  if (!isMailConfigured()) {
    console.error("[enquiry] RESEND_API_KEY is not configured.");
    return jsonCors(
      req,
      { error: "Email service is not configured. Please try again later." },
      { status: 500 },
    );
  }

  let enquiryRef: string | null = null;
  let partnerId: number | null = null;
  let odooSynced = false;

  if (isOdooConfigured()) {
    try {
      const registered = await registerWebsiteEnquiry(data);
      enquiryRef = registered.enquiryRef;
      partnerId = registered.partnerId;
      odooSynced = true;
      console.info(
        `[enquiry] odoo ok enquiryRef=${enquiryRef} partner=#${partnerId} created=${registered.created}`,
      );
    } catch (err) {
      const detail =
        err instanceof Error
          ? err.message
          : typeof err === "string"
            ? err
            : "unknown error";
      const odooData = (
        err as { odooData?: { message?: string; name?: string } }
      )?.odooData;
      console.error(
        "[enquiry] Odoo sequence/partner failed (email still sending):",
        detail,
        odooData ? JSON.stringify(odooData) : "",
      );
    }
  } else {
    console.warn(
      "[enquiry] Odoo not configured — sending email without enquiry reference",
    );
  }

  const mail = formatContactEnquiryEmail(data, enquiryRef);
  const to = contactEnquiryInbox();

  const result = await sendEmail({
    to,
    replyTo: data.email,
    subject: mail.subject,
    text: mail.text,
  });
  if (!result.ok) {
    console.error(
      `[enquiry] send failed enquiryRef=${enquiryRef ?? "none"} partner=${partnerId ?? "none"}:`,
      result.error,
    );
    return jsonCors(req, { error: "Failed to send." }, { status: 502 });
  }

  console.info(
    `[enquiry] sent enquiryRef=${enquiryRef ?? "none"} odooSynced=${odooSynced} to=${to}`,
  );

  const customerName = [data.first_name, data.last_name].filter(Boolean).join(" ");
  const thankYou = formatEnquiryThankYouEmail({
    customerName,
    enquiryId: enquiryRef?.trim() || "Pending",
    productName: "General Enquiry",
    enquiryDate: formatMuscatDateTime(),
    enquirySummary: data.message,
  });
  const thankYouResult = await sendEmail({
    to: data.email,
    subject: thankYou.subject,
    text: thankYou.text,
  });
  if (!thankYouResult.ok) {
    console.warn(
      `[enquiry] customer thank-you failed enquiryRef=${enquiryRef ?? "none"}:`,
      thankYouResult.error,
    );
  }

  return jsonCors(req, {
    ok: true,
    enquiryRef,
    partnerId,
    odooSynced,
  });
}
