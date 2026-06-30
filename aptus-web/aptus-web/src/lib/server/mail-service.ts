import nodemailer from "nodemailer";
import { getOdooClient } from "./odoo/client";
import { logger } from "./logger";

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  body: string;
  replyTo?: string;
};

export type SendEmailResult = {
  sent: boolean;
  channel: "smtp" | "odoo" | "none";
  error?: string;
};

function getSmtpConfig(): {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
} | null {
  const host = process.env.SMTP_HOST?.trim();
  const from = process.env.SMTP_FROM?.trim() || process.env.ORDER_NOTIFICATION_FROM?.trim();
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
    replyTo: input.replyTo,
  });

  return { sent: true, channel: "smtp" };
}

async function sendViaOdoo(input: SendEmailInput): Promise<SendEmailResult> {
  const client = getOdooClient();
  if (!client) return { sent: false, channel: "none", error: "Odoo not configured" };

  const recipients = Array.isArray(input.to) ? input.to.join(", ") : input.to;
  const bodyHtml = input.body
    .split("\n")
    .map((line) => line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"))
    .join("<br/>");

  try {
    await client.create("mail.mail", {
      subject: input.subject,
      body_html: `<p>${bodyHtml}</p>`,
      email_to: recipients,
      auto_delete: false,
    });
    return { sent: true, channel: "odoo" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Odoo mail failed";
    return { sent: false, channel: "odoo", error: message };
  }
}

/** Send portal notification email via SMTP (preferred) or Odoo outgoing mail. */
export async function sendPortalEmail(input: SendEmailInput): Promise<SendEmailResult> {
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

  logger.warn("Portal email not sent (configure SMTP_* or Odoo mail)", {
    subject: input.subject,
    to: input.to,
    error: odooResult.error,
  });

  return { sent: false, channel: "none", error: odooResult.error ?? "Email not configured" };
}
