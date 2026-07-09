import { corsPreflight, jsonCors } from "@/lib/api-cors";
import { getMailTransporter, mailFromAddress } from "@/lib/mail";
import {
  FORM_EXTENSIONS,
  RESUME_EXTENSIONS,
  validateFields,
  validateFile,
  type ApplicationFields,
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
    filename: file.name,
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
    return jsonCors(req, { error: "Invalid form submission." }, { status: 400 });
  }

  const fields: ApplicationFields = {
    fullName: String(form.get("fullName") ?? ""),
    email: String(form.get("email") ?? ""),
    phone: String(form.get("phone") ?? ""),
    position: String(form.get("position") ?? ""),
    experience: String(form.get("experience") ?? ""),
    location: String(form.get("location") ?? ""),
    coverMessage: String(form.get("coverMessage") ?? ""),
  };

  const resume = form.get("resume");
  const preInterviewForm = form.get("preInterviewForm");
  const resumeFile = resume instanceof File ? resume : null;
  const formFile = preInterviewForm instanceof File ? preInterviewForm : null;

  const errors: Record<string, string> = validateFields(fields);
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
    return jsonCors(
      req,
      { error: "Please fix the highlighted fields.", errors },
      { status: 400 },
    );
  }

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
