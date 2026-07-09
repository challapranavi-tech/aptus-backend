import { corsPreflight, jsonCors } from "@/lib/api-cors";
import { getMailTransporter, mailFromAddress } from "@/lib/mail";
import { NextRequest } from "next/server";

export async function OPTIONS(req: NextRequest) {
  return corsPreflight(req) ?? new Response(null, { status: 405 });
}

export async function POST(req: NextRequest) {
  const preflight = corsPreflight(req);
  if (preflight) return preflight;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonCors(req, { error: "Invalid JSON body." }, { status: 400 });
  }

  const first_name = String(body.first_name ?? "").trim();
  const last_name = String(body.last_name ?? "").trim();
  const email = String(body.email ?? "").trim();
  const company = String(body.company ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const product = String(body.product ?? "").trim();
  const message = String(body.message ?? "").trim();

  if (!first_name || !email) {
    return jsonCors(
      req,
      { error: "First name and email are required." },
      { status: 400 },
    );
  }

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
        `Company: ${company || "—"}`,
        `Phone: ${phone || "—"}`,
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
