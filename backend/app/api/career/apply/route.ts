import { corsPreflight, jsonCors, withCors } from "@/lib/api-cors";
import { validationError } from "@/lib/api-validate";
import { getPublishedJobById } from "@/lib/careers/jobs";
import {
  hrEmail,
  isMailConfigured,
  sendEmail,
  type MailAttachment,
} from "@/lib/mail";
import {
  enforceIpRateLimit,
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
import { MAX_TOTAL_ATTACHMENT_BYTES } from "@shared/lib/careers-application";
import {
  FILE_CONTENT_PROBE_BYTES,
  mimeForFileKind,
  sniffFileKind,
  validateFileContent,
} from "@shared/lib/file-signature";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

const JOB_UNAVAILABLE =
  "This job is not available for applications. Please choose a published role from Careers.";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function fileToAttachment(file: File): Promise<MailAttachment> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const kind = sniffFileKind(buffer.subarray(0, FILE_CONTENT_PROBE_BYTES));
  return {
    filename: sanitizeFilename(file.name),
    content: buffer,
    contentType:
      mimeForFileKind(kind) || file.type || "application/octet-stream",
  };
}

export async function OPTIONS(req: NextRequest) {
  return corsPreflight(req) ?? new Response(null, { status: 405 });
}

export async function POST(req: NextRequest) {
  const preflight = corsPreflight(req);
  if (preflight) return preflight;

  // Outside middleware matcher — see careers/apply. Keep IP limit in-handler.
  const ipLimited = await enforceIpRateLimit(
    req,
    "publicWrite",
    "career-apply",
    (res) => withCors(res, req),
  );
  if (ipLimited) return ipLimited;

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
    jobId: form.get("jobId"),
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

  // security: magic-byte + OOXML probe — extension/MIME alone are spoofable.
  if (Object.keys(errors).length === 0) {
    for (const [file, exts, label, key] of [
      [resumeFile, RESUME_EXTENSIONS, "Resume", "resume"],
      [formFile, FORM_EXTENSIONS, "Pre-interview form", "preInterviewForm"],
    ] as const) {
      if (!file) continue;
      const header = new Uint8Array(
        await file.slice(0, FILE_CONTENT_PROBE_BYTES).arrayBuffer(),
      );
      const e = validateFileContent(file.name, header, exts, label);
      if (e) errors[key] = e;
    }
  }

  if (Object.keys(errors).length === 0 && resumeFile && formFile) {
    const total = resumeFile.size + formFile.size;
    if (total > MAX_TOTAL_ATTACHMENT_BYTES) {
      errors._form = `Your uploaded files total ${(total / (1024 * 1024)).toFixed(1)} MB, over the ${(MAX_TOTAL_ATTACHMENT_BYTES / (1024 * 1024)).toFixed(1)} MB limit.`;
    }
  }

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

  const jobId = Number(fields.jobId);
  if (!Number.isInteger(jobId) || jobId <= 0) {
    return validationError(
      { jobId: JOB_UNAVAILABLE },
      (res) => withCors(res, req),
    );
  }

  let publishedJob;
  try {
    publishedJob = await getPublishedJobById(jobId);
  } catch (err) {
    console.error("[career/apply] published-job lookup failed:", err);
    return jsonCors(
      req,
      {
        error:
          "Applications are temporarily unavailable. Please try again later.",
      },
      { status: 503 },
    );
  }
  if (!publishedJob) {
    console.warn("[career/apply] rejected unpublished/unknown jobId", jobId);
    return validationError(
      { jobId: JOB_UNAVAILABLE },
      (res) => withCors(res, req),
    );
  }

  // Canonical title — free-text position must not invent unpublished roles.
  fields.position = publishedJob.title;

  // IP limit is in middleware; email caps repeat abuse from rotating IPs.
  const emailLimited = await enforceKeyRateLimit(
    identityKey(fields.email),
    "publicWriteIdentity",
    "career-apply",
    (res) => withCors(res, req),
  );
  if (emailLimited) return emailLimited;

  if (!isMailConfigured()) {
    console.error("[career/apply] RESEND_API_KEY is not configured.");
    return jsonCors(
      req,
      { error: "Email service is not configured. Please try again later." },
      { status: 500 },
    );
  }

  console.info("[career/apply] application received", {
    position: fields.position,
    jobId,
  });

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

  const hrResult = await sendEmail({
    to: hrEmail(),
    replyTo: fields.email,
    subject: `Career Application — ${fields.fullName} (${fields.position})`,
    text,
    html,
    attachments: [
      await fileToAttachment(resumeFile!),
      await fileToAttachment(formFile!),
    ],
  });
  if (!hrResult.ok) {
    console.error("[career/apply] send failed:", hrResult.error);
    return jsonCors(
      req,
      { error: "Could not send your application. Please try again later." },
      { status: 502 },
    );
  }

  return jsonCors(req, { ok: true });
}
