import nodemailer from "nodemailer";

/**
 * SMTP credentials are server-only (SMTP_HOST / SMTP_USER / SMTP_PASS).
 * security: never expose these via NEXT_PUBLIC_* or return them in API errors.
 */
export function getMailTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return null;
  }

  const port = Number(SMTP_PORT ?? 587);
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

export function mailFromAddress(): string {
  return (
    process.env.SMTP_FROM ??
    process.env.CAREER_FROM_EMAIL ??
    process.env.SMTP_USER ??
    "no-reply@aptusinfotech.com"
  );
}
