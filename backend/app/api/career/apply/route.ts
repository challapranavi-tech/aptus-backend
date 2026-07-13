import { corsPreflight, jsonCors, withCors } from "@/lib/api-cors";
import { validationError } from "@/lib/api-validate";
import { getMailTransporter, mailFromAddress } from "@/lib/mail";
import {
  enforceKeyRateLimit,
  identityKey,
} from "@/lib/rate-limit-http";
import {
  FORM_EXTENSIONS,
  RESUME_EXTENSIONS,
  parseApplicationFields,
  rejectUnknownFormKeys,
  sanitizeFilename,
  validateFile,
} from "@shared/lib/career-application";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

const TO_EMAIL = process.env.CAREER_TO_EMAIL ?? "hr@aptusinfotech.com";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function fileToAttachment(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  return {
    filename: sanitizeFilename(file.name),
    content: buffer,
    contentType: file.type || "application/octet-stream",
  };
}

export async function OPTIONS(req: NextRequest) {
  return corsPreflight(req) ?? new Response(null, { status: 405 });
}

export async function POST(req: NextRequest) {
  const preflight = corsPreflight(req);
  if (preflight) return preflight;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return validationError(
      { _form: "Invalid form submission." },
      (res) => withCors(res, req),
    );
  }

  const unknown = rejectUnknownFormKeys(form.keys());
  if (Object.keys(unknown).length > 0) {
    return validationError(unknown, (res) => withCors(res, req));
  }

  const parsed = parseApplicationFields({
    fullName: form.get("fullName"),
    email: form.get("email"),
    phone: form.get("phone"),
    position: form.get("position"),
    experience: form.get("experience"),
    location: form.get("location"),
    coverMessage: form.get("coverMessage") ?? undefined,
  });

  const errors = parsed.ok ? {} : { ...parsed.errors };

  const resume = form.get("resume");
  const preInterviewForm = form.get("preInterviewForm");
  const resumeFile = resume instanceof File ? resume : null;
  const formFile = preInterviewForm instanceof File ? preInterviewForm : null;

  if (resume !== null && !(resume instanceof File)) {
    errors.resume = "Resume must be a file upload.";
  }
  if (preInterviewForm !== null && !(preInterviewForm instanceof File)) {
    errors.preInterviewForm = "Pre-interview form must be a file upload.";
  }

  const resumeError = validateFile(resumeFile, RESUME_EXTENSIONS, "Resume", true);
  if (resumeError) errors.resume = resumeError;
  const formError = validateFile(
    formFile,
    FORM_EXTENSIONS,
    "Pre-interview form",
    true,
  );
  if (formError) errors.preInterviewForm = formError;

  if (Object.keys(errors).length > 0) {
    return validationError(errors, (res) => withCors(res, req));
  }

  const fields = parsed.ok ? parsed.data : null;
  if (!fields) {
    return validationError(
      { _form: "Validation failed." },
      (res) => withCors(res, req),
    );
  }

  // IP limit is in middleware; email caps repeat abuse from rotating IPs.
  const emailLimited = enforceKeyRateLimit(
    identityKey(fields.email),
    "publicWriteIdentity",
    "career-apply",
    (res) => withCors(res, req),
  );
  if (emailLimited) return emailLimited;

  const transporter = getMailTransporter();
  if (!transporter) {
    console.error("[career/apply] SMTP env vars are not configured.");
    return jsonCors(
      req,
      { error: "Email service is not configured. Please try again later." },
      { status: 500 },
    );
  }

  const rows: Array<[string, string]> = [
    ["Full Name", fields.fullName],
    ["Email", fields.email],
    ["Phone", fields.phone],
    ["Position Applying For", fields.position],
    ["Years of Experience", fields.experience],
    ["Location", fields.location],
    ["Cover Message", fields.coverMessage?.trim() || "—"],
  ];

  const html = `
    <h2 style="font-family:Arial,sans-serif;color:#24648c">New Career Application</h2>
    <table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">
      ${rows
        .map(
          ([k, v]) =>
            `<tr><td style="padding:6px 12px;border:1px solid #e2e8f0;font-weight:600;background:#f8fafc">${escapeHtml(
              k,
            )}</td><td style="padding:6px 12px;border:1px solid #e2e8f0">${escapeHtml(
              v,
            )}</td></tr>`,
        )
        .join("")}
    </table>
    <p style="font-family:Arial,sans-serif;font-size:13px;color:#475569">
      Resume and completed pre-interview form are attached.
    </p>`;

  const text = rows.map(([k, v]) => `${k}: ${v}`).join("\n");

  try {
    await transporter.sendMail({
      from: mailFromAddress(),
      to: TO_EMAIL,
      replyTo: fields.email,
      subject: `Career Application — ${fields.fullName} (${fields.position})`,
      text,
      html,
      attachments: [
        await fileToAttachment(resumeFile!),
        await fileToAttachment(formFile!),
      ],
    });
  } catch (err) {
    console.error("[career/apply] send failed:", err);
    return jsonCors(
      req,
      { error: "Could not send your application. Please try again later." },
      { status: 502 },
    );
  }

  return jsonCors(req, { ok: true });
}
