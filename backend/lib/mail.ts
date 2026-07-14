import { MAX_TOTAL_ATTACHMENT_BYTES } from "@shared/lib/careers-application";
import { Resend } from "resend";

/**
 * Resend mail helper (server-only).
 * security: RESEND_API_KEY must never use NEXT_PUBLIC_* or appear in API errors.
 *
 * Env:
 *   RESEND_API_KEY — required (replace re_xxxxxxxxx with your real key)
 *   FROM_EMAIL     — verified sender, e.g. "Aptus Infotech <no-reply@yourdomain.com>"
 *   HR_EMAIL       — careers inbox (falls back to CAREER_TO_EMAIL)
 */

export type MailAttachment = {
  filename: string;
  content: Buffer;
  contentType?: string;
};

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  attachments?: MailAttachment[];
};

export type SendEmailResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

// Re-exported so mail callers (and mail.check.ts) keep a single import site.
export { MAX_TOTAL_ATTACHMENT_BYTES };

const MAX_ATTEMPTS = 3;

export function isMailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export function mailFromAddress(): string {
  return (
    process.env.FROM_EMAIL?.trim() ||
    process.env.SMTP_FROM?.trim() ||
    process.env.CAREER_FROM_EMAIL?.trim() ||
    "Aptus Infotech <no-reply@aptusinfotech.com>"
  );
}

export function hrEmail(): string {
  return (
    process.env.HR_EMAIL?.trim() ||
    process.env.CAREER_TO_EMAIL?.trim() ||
    "hr@aptusinfotech.com"
  );
}

/** Reject empty / oversized attachment payloads before calling Resend. */
export function validateAttachments(
  attachments: MailAttachment[],
): string | null {
  let total = 0;
  for (const a of attachments) {
    if (!a.filename?.trim()) return "Attachment is missing a filename.";
    if (!a.content?.length) return `Attachment "${a.filename}" is empty.`;
    total += a.content.length;
    if (total > MAX_TOTAL_ATTACHMENT_BYTES) {
      return "Total attachment size exceeds the email provider limit.";
    }
  }
  return null;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function isRetryable(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("rate limit") ||
    m.includes("timeout") ||
    m.includes("429") ||
    m.includes("500") ||
    m.includes("502") ||
    m.includes("503") ||
    m.includes("504") ||
    m.includes("econnreset") ||
    m.includes("fetch failed")
  );
}

/**
 * Send one email via Resend. Retries transient provider errors (rate limit / 5xx).
 * Callers should treat `{ ok: false }` as a soft failure and map to a user-safe response.
 */
export async function sendEmail(
  input: SendEmailInput,
): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY is not configured" };
  }

  const attachmentError = validateAttachments(input.attachments ?? []);
  if (attachmentError) {
    return { ok: false, error: attachmentError };
  }

  if (!input.html && !input.text) {
    return { ok: false, error: "Email body (html or text) is required" };
  }

  const resend = new Resend(apiKey);
  const attachments = input.attachments?.map((a) => ({
    filename: a.filename,
    content: a.content,
    contentType: a.contentType,
  }));
  // Resend's CreateEmailOptions is a discriminated union on html | text | react.
  const payload = input.html
    ? {
        from: mailFromAddress(),
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
        replyTo: input.replyTo,
        attachments,
      }
    : {
        from: mailFromAddress(),
        to: input.to,
        subject: input.subject,
        text: input.text as string,
        replyTo: input.replyTo,
        attachments,
      };

  let lastError = "Unknown email error";
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const { data, error } = await resend.emails.send(payload);
      if (error) {
        lastError = error.message || String(error);
        if (attempt < MAX_ATTEMPTS && isRetryable(lastError)) {
          console.warn(
            `[mail] Resend attempt ${attempt} failed (retrying):`,
            lastError,
          );
          await sleep(250 * 2 ** (attempt - 1));
          continue;
        }
        return { ok: false, error: lastError };
      }
      return { ok: true, id: data?.id };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      if (attempt < MAX_ATTEMPTS && isRetryable(lastError)) {
        console.warn(
          `[mail] Resend attempt ${attempt} threw (retrying):`,
          lastError,
        );
        await sleep(250 * 2 ** (attempt - 1));
        continue;
      }
      return { ok: false, error: lastError };
    }
  }

  return { ok: false, error: lastError };
}
