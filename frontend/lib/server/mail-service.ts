import nodemailer from "nodemailer";
import { getOdooClient } from "./odoo/client";
import { logger } from "./logger";

export type SendEmailAttachment = {
  filename: string;
  content: Buffer;
  contentType?: string;
};

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  body: string;
  /** Optional HTML alternative (tables, line breaks). Text body remains the fallback. */
  html?: string;
  replyTo?: string;
  attachments?: SendEmailAttachment[];
};

export type SendEmailResult = {
  sent: boolean;
  channel: "resend" | "smtp" | "odoo" | "none";
  error?: string;
};

function mailFromAddress(): string | null {
  return (
    process.env.FROM_EMAIL?.trim() ||
    process.env.SMTP_FROM?.trim() ||
    process.env.ORDER_NOTIFICATION_FROM?.trim() ||
    null
  );
}

function getResendConfig(): { apiKey: string; from: string } | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = mailFromAddress();
  if (!apiKey || !from) return null;
  return { apiKey, from };
}

function getSmtpConfig(): {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
} | null {
  const host = process.env.SMTP_HOST?.trim();
  const from = mailFromAddress();
  if (!host || !from) return null;

  return {
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER?.trim() ?? "",
    pass: process.env.SMTP_PASS?.trim() ?? "",
    from,
  };
}

/** True when Resend or SMTP can send (used to decide whether test OTP is needed). */
export function isPortalMailConfigured(): boolean {
  return Boolean(getResendConfig() || getSmtpConfig());
}

async function sendViaResend(input: SendEmailInput): Promise<SendEmailResult> {
  const cfg = getResendConfig();
  if (!cfg) return { sent: false, channel: "none", error: "Resend not configured" };

  // ponytail: fetch Resend REST API — same provider as backend/lib/mail.ts, no extra frontend dep.
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: cfg.from,
      to: Array.isArray(input.to) ? input.to : [input.to],
      subject: input.subject,
      text: input.body,
      ...(input.html ? { html: input.html } : {}),
      reply_to: input.replyTo,
      attachments: input.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content.toString("base64"),
        content_type: a.contentType,
      })),
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    return {
      sent: false,
      channel: "resend",
      error: detail || `Resend HTTP ${response.status}`,
    };
  }

  return { sent: true, channel: "resend" };
}

async function sendViaSmtp(input: SendEmailInput): Promise<SendEmailResult> {
  const smtp = getSmtpConfig();
  if (!smtp) return { sent: false, channel: "none", error: "SMTP not configured" };

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: smtp.user ? { user: smtp.user, pass: smtp.pass } : undefined,
  });

  const recipients = Array.isArray(input.to) ? input.to.join(", ") : input.to;

  await transporter.sendMail({
    from: smtp.from,
    to: recipients,
    subject: input.subject,
    text: input.body,
    ...(input.html ? { html: input.html } : {}),
    replyTo: input.replyTo,
    attachments: input.attachments?.map((attachment) => ({
      filename: attachment.filename,
      content: attachment.content,
      contentType: attachment.contentType,
    })),
  });

  return { sent: true, channel: "smtp" };
}

async function sendViaOdoo(input: SendEmailInput): Promise<SendEmailResult> {
  const client = getOdooClient();
  if (!client) return { sent: false, channel: "none", error: "Odoo not configured" };

  const recipients = Array.isArray(input.to) ? input.to.join(", ") : input.to;
  const bodyHtml =
    input.html ??
    `<p>${input.body
      .split("\n")
      .map((line) => line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"))
      .join("<br/>")}</p>`;

  try {
    await client.create("mail.mail", {
      subject: input.subject,
      body_html: bodyHtml,
      email_to: recipients,
      auto_delete: false,
    });
    return { sent: true, channel: "odoo" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Odoo mail failed";
    return { sent: false, channel: "odoo", error: message };
  }
}

/**
 * Send portal notification email.
 * Prefer Resend (same as contact/quote on the backend), then SMTP, then Odoo.
 */
export async function sendPortalEmail(input: SendEmailInput): Promise<SendEmailResult> {
  if (getResendConfig()) {
    try {
      const result = await sendViaResend(input);
      if (result.sent) return result;
      logger.warn("Resend email failed, trying SMTP/Odoo", {
        error: result.error,
        subject: input.subject,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Resend send failed";
      logger.warn("Resend email threw, trying SMTP/Odoo", { error: message, subject: input.subject });
    }
  }

  if (getSmtpConfig()) {
    try {
      return await sendViaSmtp(input);
    } catch (error) {
      const message = error instanceof Error ? error.message : "SMTP send failed";
      logger.warn("SMTP email failed, trying Odoo mail", { error: message, subject: input.subject });
    }
  }

  const odooResult = await sendViaOdoo(input);
  if (odooResult.sent) return odooResult;

  logger.warn("Portal email not sent (configure RESEND_API_KEY, SMTP_*, or Odoo mail)", {
    subject: input.subject,
    to: input.to,
    error: odooResult.error,
  });

  return { sent: false, channel: "none", error: odooResult.error ?? "Email not configured" };
}
