import { archiveApplication } from "@/lib/application-archive";
import { corsPreflight, jsonCors, withCors } from "@/lib/api-cors";
import { createApplicant, isOdooConfigured, parseSalaryExpected } from "@/lib/odoo";
import { validationError } from "@/lib/api-validate";
import {
  hrEmail,
  isMailConfigured,
  MAX_TOTAL_ATTACHMENT_BYTES,
  sendEmail,
  type MailAttachment,
} from "@/lib/mail";
import {
  enforceIpRateLimit,
  enforceKeyRateLimit,
  identityKey,
} from "@/lib/rate-limit-http";
import {
  DOC_EXTENSIONS,
  DOC_OR_IMAGE_MIME_OK,
  IMAGE_EXTENSIONS,
  RESUME_EXTENSIONS,
  parseApplicationFields,
  rejectUnknownFormKeys,
  sanitizeFilename,
  validateFile,
  validateImageFile,
  type ApplicationFields,
} from "@shared/lib/careers-application";
import {
  FILE_CONTENT_PROBE_BYTES,
  mimeForFileKind,
  sniffFileKind,
  validateFileContent,
} from "@shared/lib/file-signature";
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
  const kind = sniffFileKind(buffer.subarray(0, FILE_CONTENT_PROBE_BYTES));
  return {
    filename: sanitizeFilename(file.name),
    content: buffer,
    contentType:
      mimeForFileKind(kind) || file.type || "application/octet-stream",
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

  // IP limit lives here — this route is outside middleware so large multipart
  // bodies are not Edge-cloned (which 502s ~1MB+ before the function starts).
  const ipLimited = enforceIpRateLimit(
    req,
    "publicWrite",
    "careers-apply",
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

  // Certificates are optional — education supporting docs cover academics.
  if (certificates.length > 0) {
    for (const c of certificates) {
      const e = validateFile(
        c,
        CERT_EXTENSIONS,
        "Educational certificate",
        true,
        DOC_OR_IMAGE_MIME_OK,
      );
      if (e) errors.educationalCertificates = e;
    }
  }

  const passportErr = validateFile(
    passportCopy,
    [...DOC_EXTENSIONS, ...IMAGE_EXTENSIONS],
    "Passport copy",
    true, // passport copy is mandatory for all candidates
    DOC_OR_IMAGE_MIME_OK,
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
    const e = validateFile(
      file,
      [...DOC_EXTENSIONS, ...IMAGE_EXTENSIONS],
      label,
      false,
      DOC_OR_IMAGE_MIME_OK,
    );
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
    DOC_OR_IMAGE_MIME_OK,
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
      DOC_OR_IMAGE_MIME_OK,
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
      const header = new Uint8Array(
        await file.slice(0, FILE_CONTENT_PROBE_BYTES).arrayBuffer(),
      );
      const e = validateFileContent(file.name, header, exts, label);
      if (e) errors[key] = e;
    }
    for (const c of certificates) {
      const header = new Uint8Array(
        await c.slice(0, FILE_CONTENT_PROBE_BYTES).arrayBuffer(),
      );
      const e = validateFileContent(c.name, header, CERT_EXTENSIONS, "Educational certificate");
      if (e) errors.educationalCertificates = e;
    }
    for (let i = 0; i < eduDocs.length; i++) {
      const header = new Uint8Array(
        await eduDocs[i].file.slice(0, FILE_CONTENT_PROBE_BYTES).arrayBuffer(),
      );
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

  // Odoo Recruitment is the source of truth for applicants — refuse if unset.
  if (!isOdooConfigured()) {
    console.error("[careers/apply] Odoo is not configured.");
    return jsonCors(
      req,
      { error: "Applications are temporarily unavailable. Please try again later." },
      { status: 503 },
    );
  }

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
    const limitMb = "4.5";
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
  let archived: string | undefined;
  try {
    archived = await archiveApplication(fields, attachments);
    console.info("[careers/apply] archived application to", archived);
  } catch (err) {
    console.error("[careers/apply] failed to archive application:", err);
  }

  // Structured log — always runs so every application is traceable in server
  // logs even if Odoo or email fail. Never logs raw file content.
  console.info("[careers/apply] application received", {
    candidateName: fields.candidateName,
    email: fields.email,
    appliedDesignation: fields.appliedDesignation,
    totalYearsExperience: fields.totalYearsExperience,
    currentLocation: fields.currentLocation,
    teamSize: fields.teamSize,
    reportsTo: fields.reportsTo,
    currentCtc: fields.currentCtc,
    expectedCtc: fields.expectedCtc,
    noticePeriod: fields.noticePeriod,
    passportNumber: fields.passportNumber ? "provided" : "MISSING",
    dateOfBirth: fields.dateOfBirth ? "provided" : "MISSING",
    jobId: fields.jobId,
    fileCount: attachments.length,
  });

  // Odoo Recruitment is required — jobId must be a real published hr.job id.
  let odooNoteHtml = "";
  let odooNoteText = "";
  let odooSynced = false;
  const jobId = Number(fields.jobId);

  if (
    !Number.isInteger(jobId) ||
    jobId <= 0 ||
    !fields.candidateName.trim() ||
    !fields.email.trim()
  ) {
    console.error("[careers/apply] Odoo push refused — invalid jobId or identity");
    return jsonCors(
      req,
      {
        error:
          "This job is not available for applications. Please choose a published role from Careers.",
      },
      { status: 400 },
    );
  }

  try {
    const applicantId = await createApplicant(
      {
        candidateName: fields.candidateName,
        email: fields.email,
        phone: fields.phone,
        jobId,
        notesHtml: html,
        salaryExpected: parseSalaryExpected(fields.expectedCtc),
      },
      attachments,
    );
    odooSynced = true;
    const base = process.env.ODOO_URL?.replace(/\/$/, "") ?? "";
    const link = `${base}/web#model=hr.applicant&id=${applicantId}&view_type=form`;
    odooNoteHtml = `<p style="font-family:Arial,sans-serif;font-size:13px;color:#047857">Synced to Odoo Recruitment — <a href="${escapeHtml(link)}">applicant #${applicantId}</a>.</p>`;
    odooNoteText = `\n\nSynced to Odoo Recruitment: applicant #${applicantId} (${link})`;
    console.info("[careers/apply] created hr.applicant", applicantId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[careers/apply] Odoo hr.applicant create failed:", msg);
    // Still notify HR with attachments so nothing is silently lost.
    await sendEmail({
      to: hrEmail(),
      replyTo: fields.email,
      subject: `Career Application (ODOO FAILED) — ${fields.candidateName} (${fields.appliedDesignation})`,
      text:
        text +
        `\n\n[!] Odoo sync failed (${msg}). Application NOT in Recruitment.` +
        (archived ? ` Archive: ${archived}` : ""),
      html:
        html +
        `<p style="font-family:Arial,sans-serif;font-size:13px;color:#b91c1c">⚠ Odoo sync failed — application is NOT in Recruitment. (${escapeHtml(msg)})${archived ? ` Archive: <code>${escapeHtml(archived)}</code>` : ""}</p>`,
      attachments,
    }).catch(() => undefined);

    return jsonCors(
      req,
      {
        error:
          "We could not save your application to our recruitment system. Please try again in a few minutes.",
      },
      { status: 502 },
    );
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
    // Odoo already has the applicant — accept to avoid duplicate Odoo records on retry.
    if (odooSynced || archived) {
      console.warn(
        "[careers/apply] accepting application despite HR email failure (archive=%s odoo=%s)",
        Boolean(archived),
        odooSynced,
      );
      return jsonCors(req, {
        ok: true,
        warning: "email_pending",
      });
    }
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
    ...(f.coverMessage?.trim()
      ? ([["Cover Message", f.coverMessage.trim()]] as Array<[string, string]>)
      : []),
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
