import { corsPreflight, jsonCors, withCors } from "@/lib/api-cors";
import { requireJsonContentType, validationError } from "@/lib/api-validate";
import { getMailTransporter, mailFromAddress } from "@/lib/mail";
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

  const { first_name, last_name, email, company, phone, product, message } =
    parsed.data;

  // IP limit is in middleware; email caps repeat abuse from rotating IPs.
  const emailLimited = enforceKeyRateLimit(
    identityKey(email),
    "publicWriteIdentity",
    "contact",
    (res) => withCors(res, req),
  );
  if (emailLimited) return emailLimited;

  const transporter = getMailTransporter();
  if (!transporter) {
    console.error("[contact] SMTP env vars are not configured.");
    return jsonCors(
      req,
      { error: "Email service is not configured. Please try again later." },
      { status: 500 },
    );
  }

  const to = process.env.CONTACT_TO_EMAIL ?? "info@aptusinfotech.com";
  const name = [first_name, last_name].filter(Boolean).join(" ");

  try {
    await transporter.sendMail({
      from: mailFromAddress(),
      to,
      replyTo: email,
      subject: `New quote request from ${name}`,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        `Company: ${company}`,
        `Phone: ${phone}`,
        `Product: ${product || "—"}`,
        "",
        message || "(no message)",
      ].join("\n"),
    });
  } catch (err) {
    console.error("[contact] send failed:", err);
    return jsonCors(req, { error: "Failed to send." }, { status: 502 });
  }

  return jsonCors(req, { ok: true });
}
