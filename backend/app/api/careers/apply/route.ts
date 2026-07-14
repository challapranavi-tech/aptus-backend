import { archiveApplication } from "@/lib/application-archive";
import { corsPreflight, jsonCors, withCors } from "@/lib/api-cors";
import { createApplicant, isOdooConfigured } from "@/lib/odoo";
import { validationError } from "@/lib/api-validate";
import {
  hrEmail,
  isMailConfigured,
  MAX_TOTAL_ATTACHMENT_BYTES,
  sendEmail,
  type MailAttachment,
} from "@/lib/mail";
import { enforceKeyRateLimit, identityKey } from "@/lib/rate-limit-http";
import {
  DOC_EXTENSIONS,
  IMAGE_EXTENSIONS,
  RESUME_EXTENSIONS,
  parseApplicationFields,
  rejectUnknownFormKeys,
  sanitizeFilename,
  validateFile,
  validateImageFile,
  type ApplicationFields,
} from "@shared/lib/careers-application";
import { validateFileContent } from "@shared/lib/file-signature";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

const CERT_EXTENSIONS = [...DOC_EXTENSIONS, ...IMAGE_EXTENSIONS] as const;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function fileToAttachment(file: File): Promise<MailAttachment> {
  const buffer = Buffer.from(await file.arrayBuffer());
  return {
    filename: sanitizeFilename(file.name),
    content: buffer,
    contentType: file.type || "application/octet-stream",
  };
}

function filesFor(form: FormData, key: string): File[] {
  return form
    .getAll(key)
    .filter((v): v is File => v instanceof File && v.size > 0);
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

  const parsed = parseApplicationFields(form);
  const errors: Record<string, string> = parsed.ok ? {} : { ...parsed.errors };

  // ── Files ────────────────────────────────────────────────────────────────
  const resume = filesFor(form, "resume")[0] ?? null;
  const certificates = filesFor(form, "educationalCertificates");
  const passportCopy = filesFor(form, "passportCopy")[0] ?? null;
  const photograph = filesFor(form, "photograph")[0] ?? null;
  const appointmentLetter = filesFor(form, "appointmentLetter")[0] ?? null;
  const relievingLetter = filesFor(form, "relievingLetter")[0] ?? null;
  const latestPayslip = filesFor(form, "latestPayslip")[0] ?? null;

  const resumeErr = validateFile(resume, RESUME_EXTENSIONS, "Resume", true);
  if (resumeErr) errors.resume = resumeErr;

  if (certificates.length === 0) {
    errors.educationalCertificates = "At least one educational certificate is required.";
  } else {
    for (const c of certificates) {
      const e = validateFile(c, CERT_EXTENSIONS, "Educational certificate", true);
      if (e) errors.educationalCertificates = e;
    }
  }

  const passportErr = validateFile(
    passportCopy,
    [...DOC_EXTENSIONS, ...IMAGE_EXTENSIONS],
    "Passport copy",
    true, // passport copy is mandatory for all candidates
  );
  if (passportErr) errors.passportCopy = passportErr;

  const photoErr = validateImageFile(photograph, "Passport-size photograph", true);
  if (photoErr) errors.photograph = photoErr;

  const optionalDocs: Array<[File | null, string, string]> = [
    [appointmentLetter, "appointmentLetter", "Appointment letter"],
    [relievingLetter, "relievingLetter", "Relieving letter"],
    [latestPayslip, "latestPayslip", "Latest payslip"],
  ];
  for (const [file, key, label] of optionalDocs) {
    const e = validateFile(file, [...DOC_EXTENSIONS, ...IMAGE_EXTENSIONS], label, false);
    if (e) errors[key] = e;
  }

  // Education supporting docs: first is mandatory; extras optional.
  const eduDocs: Array<{ file: File; label: string }> = [];
  const edu0 = filesFor(form, "educationDoc_0")[0] ?? null;
  const edu0Err = validateFile(
    edu0,
    [...DOC_EXTENSIONS, ...IMAGE_EXTENSIONS],
    "Supporting document",
    true,
  );
  if (edu0Err) errors.educationDoc_0 = edu0Err;
  else if (edu0) eduDocs.push({ file: edu0, label: "Education supporting document 1" });

  for (let i = 1; i < 10; i++) {
    const f = filesFor(form, `educationDoc_${i}`)[0];
    if (!f) continue;
    const e = validateFile(
      f,
      [...DOC_EXTENSIONS, ...IMAGE_EXTENSIONS],
      `Education document ${i + 1}`,
      false,
    );
    if (e) errors[`educationDoc_${i}`] = e;
    else eduDocs.push({ file: f, label: `Education supporting document ${i + 1}` });
  }

  // security: content/magic-byte check — extension + MIME are spoofable, so
  // confirm the actual bytes match the declared type before we ever email the
  // file onward. Only run when no cheaper (extension/size) error already exists.
  if (Object.keys(errors).length === 0) {
    const contentTargets: Array<[File | null, readonly string[], string, string]> = [
      [resume, RESUME_EXTENSIONS, "Resume", "resume"],
      [passportCopy, [...DOC_EXTENSIONS, ...IMAGE_EXTENSIONS], "Passport copy", "passportCopy"],
      [photograph, IMAGE_EXTENSIONS, "Passport-size photograph", "photograph"],
      [appointmentLetter, [...DOC_EXTENSIONS, ...IMAGE_EXTENSIONS], "Appointment letter", "appointmentLetter"],
      [relievingLetter, [...DOC_EXTENSIONS, ...IMAGE_EXTENSIONS], "Relieving letter", "relievingLetter"],
      [latestPayslip, [...DOC_EXTENSIONS, ...IMAGE_EXTENSIONS], "Latest payslip", "latestPayslip"],
    ];
    for (const [file, exts, label, key] of contentTargets) {
      if (!file) continue;
      const header = new Uint8Array(await file.slice(0, 16).arrayBuffer());
      const e = validateFileContent(file.name, header, exts, label);
      if (e) errors[key] = e;
    }
    for (const c of certificates) {
      const header = new Uint8Array(await c.slice(0, 16).arrayBuffer());
      const e = validateFileContent(c.name, header, CERT_EXTENSIONS, "Educational certificate");
      if (e) errors.educationalCertificates = e;
    }
    for (let i = 0; i < eduDocs.length; i++) {
      const header = new Uint8Array(await eduDocs[i].file.slice(0, 16).arrayBuffer());
      const e = validateFileContent(
        eduDocs[i].file.name,
        header,
        [...DOC_EXTENSIONS, ...IMAGE_EXTENSIONS],
        `Education document ${i + 1}`,
      );
      if (e) errors[`educationDoc_${i}`] = e;
    }
  }

  if (Object.keys(errors).length > 0) {
    return validationError(errors, (res) => withCors(res, req));
  }

  const fields = parsed.ok ? parsed.data : null;
  if (!fields) {
    return validationError({ _form: "Validation failed." }, (res) => withCors(res, req));
  }

  const emailLimited = enforceKeyRateLimit(
    identityKey(fields.email),
    "publicWriteIdentity",
    "careers-apply",
    (res) => withCors(res, req),
  );
  if (emailLimited) return emailLimited;

  if (!isMailConfigured()) {
    console.error("[careers/apply] RESEND_API_KEY is not configured.");
    return jsonCors(
      req,
      { error: "Email service is not configured. Please try again later." },
      { status: 500 },
    );
  }

  const html = buildEmailHtml(fields);
  const text = buildEmailText(fields);

  const attachments: MailAttachment[] = [];
  if (resume) attachments.push(await fileToAttachment(resume));
  for (const c of certificates) attachments.push(await fileToAttachment(c));
  if (passportCopy) attachments.push(await fileToAttachment(passportCopy));
  if (photograph) attachments.push(await fileToAttachment(photograph));
  if (appointmentLetter) attachments.push(await fileToAttachment(appointmentLetter));
  if (relievingLetter) attachments.push(await fileToAttachment(relievingLetter));
  if (latestPayslip) attachments.push(await fileToAttachment(latestPayslip));
  for (const d of eduDocs) attachments.push(await fileToAttachment(d.file));

  // Reject over-limit submissions with a clear, actionable message instead of
  // the generic "could not send" 502 that Resend's size rejection would trigger.
  const totalAttachmentBytes = attachments.reduce(
    (n, a) => n + a.content.length,
    0,
  );
  if (totalAttachmentBytes > MAX_TOTAL_ATTACHMENT_BYTES) {
    const limitMb = Math.floor(MAX_TOTAL_ATTACHMENT_BYTES / (1024 * 1024));
    const totalMb = (totalAttachmentBytes / (1024 * 1024)).toFixed(1);
    return jsonCors(
      req,
      {
        error: `Your uploaded files total ${totalMb} MB, over the ${limitMb} MB limit for a single submission. Please reduce file sizes or remove optional documents and try again.`,
      },
      { status: 413 },
    );
  }

  // Persist a durable copy before emailing so a lost/spam-filtered email never
  // means a lost application. Best-effort: a disk failure must not block the
  // email, which is still the primary delivery path.
  try {
    const archived = await archiveApplication(fields, attachments);
    console.info("[careers/apply] archived application to", archived);
  } catch (err) {
    console.error("[careers/apply] failed to archive application:", err);
  }

  // Best-effort push into Odoo Recruitment (hr.applicant + attachments). Never
  // blocks the candidate: on failure we log and flag it in the HR email so the
  // archived copy + email still reach a human. jobId comes straight from the
  // listing and equals the Odoo hr.job id when Odoo is the live job source.
  let odooNoteHtml = "";
  let odooNoteText = "";
  const jobId = Number(fields.jobId);
  if (isOdooConfigured() && Number.isInteger(jobId) && jobId > 0) {
    try {
      const applicantId = await createApplicant(
        {
          candidateName: fields.candidateName,
          email: fields.email,
          phone: fields.phone,
          jobId,
        },
        attachments,
      );
      const base = process.env.ODOO_URL?.replace(/\/$/, "") ?? "";
      const link = `${base}/web#model=hr.applicant&id=${applicantId}&view_type=form`;
      odooNoteHtml = `<p style="font-family:Arial,sans-serif;font-size:13px;color:#047857">Synced to Odoo Recruitment — <a href="${escapeHtml(link)}">applicant #${applicantId}</a>.</p>`;
      odooNoteText = `\n\nSynced to Odoo Recruitment: applicant #${applicantId} (${link})`;
      console.info("[careers/apply] created hr.applicant", applicantId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[careers/apply] Odoo hr.applicant create failed:", msg);
      // ponytail: no retry queue yet — the flag below + archived copy are the
      // safety net. Upgrade path: enqueue {fields, blob ref} for background retry.
      odooNoteHtml = `<p style="font-family:Arial,sans-serif;font-size:13px;color:#b91c1c">⚠ Odoo sync failed — this application is NOT in Recruitment yet. All documents are attached to this email; please add it manually. (${escapeHtml(msg)})</p>`;
      odooNoteText = `\n\n[!] Odoo sync failed (${msg}). Application NOT in Recruitment — documents are attached to this email; add it manually.`;
    }
  }

  // HR notification is required for a successful application.
  const hrResult = await sendEmail({
    to: hrEmail(),
    replyTo: fields.email,
    subject: `Career Application — ${fields.candidateName} (${fields.appliedDesignation})`,
    text: text + odooNoteText,
    html: html + odooNoteHtml,
    attachments,
  });
  if (!hrResult.ok) {
    console.error("[careers/apply] HR email failed:", hrResult.error);
    return jsonCors(
      req,
      { error: "Could not send your application. Please try again later." },
      { status: 502 },
    );
  }

  // Applicant confirmation is best-effort — don't fail the submission if it bounces.
  const confirmResult = await sendEmail({
    to: fields.email,
    replyTo: hrEmail(),
    subject: `Application received — ${fields.appliedDesignation}`,
    text: buildConfirmationText(fields),
    html: buildConfirmationHtml(fields),
  });
  if (!confirmResult.ok) {
    console.warn(
      "[careers/apply] applicant confirmation failed (application still accepted):",
      confirmResult.error,
    );
  }

  return jsonCors(req, { ok: true });
}

function applicationRows(f: ApplicationFields): Array<[string, string]> {
  const org = (label: string, o: ApplicationFields["currentOrg"]) =>
    [
      `${label}`,
      `${o.name} — ${o.designation}, ${o.duration} (${o.totalYears} yrs)`,
    ] as [string, string];

  return [
    ["Date of Application", f.applicationDate],
    ["Applied Designation", f.appliedDesignation],
    ["Name of Candidate", f.candidateName],
    ["Email", f.email],
    ["Phone", f.phone],
    ["Total Years of Experience", f.totalYearsExperience],
    ["Date of Birth", f.dateOfBirth],
    org("Current Organization", f.currentOrg),
    org("Immediate Previous Organization", f.previousOrg1),
    org("Previous Organization", f.previousOrg2),
    [
      "Professional Qualification",
      `${f.professionalQualification} (${f.professionalQualificationYear})`,
    ],
    ["Graduation", `${f.graduation} (${f.graduationYear})`],
    [
      "Certifications",
      f.certifications
        .filter((c) => c.name)
        .map((c) => `${c.name} (${c.year})`)
        .join("; ") || "—",
    ],
    ["Reports To", f.reportsTo],
    ["Team Size", f.teamSize],
    ["Current Location", f.currentLocation],
    ["Family Details", f.familyDetails],
    ["Current CTC", f.currentCtc],
    ["Expected CTC", f.expectedCtc],
    ["Notice Period", f.noticePeriod],
    ["Passport Number", f.passportNumber],
    ["Passport Validity", f.passportValidity],
    ["Driving License", f.drivingLicense],
    [
      "Education Entries",
      f.educationEntries
        .filter((e) => e.name)
        .map((e) => `${e.name} — ${e.institution} (${e.year})`)
        .join("; ") || "—",
    ],
    ["Applied For (Job)", f.appliedDesignation],
  ];
}

function buildEmailHtml(f: ApplicationFields): string {
  const rows = applicationRows(f);
  return `
    <h2 style="font-family:Arial,sans-serif;color:#24648c">New Career Application</h2>
    <table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">
      ${rows
        .map(
          ([k, v]) =>
            `<tr><td style="padding:6px 12px;border:1px solid #e2e8f0;font-weight:600;background:#f8fafc;vertical-align:top">${escapeHtml(
              k,
            )}</td><td style="padding:6px 12px;border:1px solid #e2e8f0">${escapeHtml(
              v,
            )}</td></tr>`,
        )
        .join("")}
    </table>
    <p style="font-family:Arial,sans-serif;font-size:13px;color:#475569">
      Resume, certificates, photograph and any supporting documents are attached.
    </p>`;
}

function buildEmailText(f: ApplicationFields): string {
  return applicationRows(f)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
}

function buildConfirmationHtml(f: ApplicationFields): string {
  return `
    <p style="font-family:Arial,sans-serif;font-size:14px;color:#0f172a">
      Dear ${escapeHtml(f.candidateName)},
    </p>
    <p style="font-family:Arial,sans-serif;font-size:14px;color:#0f172a">
      Thank you for applying for the
      <strong>${escapeHtml(f.appliedDesignation)}</strong> position at Aptus Infotech.
      We have received your application and will review it shortly.
    </p>
    <p style="font-family:Arial,sans-serif;font-size:13px;color:#475569">
      If you have questions, you can reply to this email.
    </p>
    <p style="font-family:Arial,sans-serif;font-size:14px;color:#0f172a">
      Best regards,<br/>Aptus Infotech HR
    </p>`;
}

function buildConfirmationText(f: ApplicationFields): string {
  return [
    `Dear ${f.candidateName},`,
    "",
    `Thank you for applying for the ${f.appliedDesignation} position at Aptus Infotech.`,
    "We have received your application and will review it shortly.",
    "",
    "Best regards,",
    "Aptus Infotech HR",
  ].join("\n");
}
