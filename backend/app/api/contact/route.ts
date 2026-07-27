import { corsPreflight, jsonCors, withCors } from "@/lib/api-cors";
import {
  formatMuscatDateTime,
  resolveContactRouting,
} from "@/lib/contact-routing";
import { requireJsonContentType, validationError } from "@/lib/api-validate";
import { isMailConfigured, sendEmail } from "@/lib/mail";
import {
  enforceKeyRateLimit,
  identityKey,
} from "@/lib/rate-limit-http";
import { parseContactRequest } from "@shared/lib/contact-request";
import { NextRequest } from "next/server";

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

  let raw: unknown;
  try {
    raw = await req.json();
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
  const emailLimited = enforceKeyRateLimit(
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

  const result = await sendEmail({
    to: routing.to,
    replyTo: email,
    subject: isQuote
      ? `New quote request from ${name} (${routing.categoryLabel})`
      : `New contact message from ${name}`,
    text: [
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

  return jsonCors(req, { ok: true });
}
