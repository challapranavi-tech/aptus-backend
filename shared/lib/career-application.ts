/**
 * Shared validation rules for the career application workflow.
 * Imported by both the client form (pre-submit UX) and the API route
 * (authoritative trust-boundary check) so the rules live in one place.
 */

import {
  EMAIL_RE,
  PHONE_RE,
  hasAllowedExtension,
  parseObject,
  sanitizeFilename,
  sanitizeText,
  type ObjectSchema,
  type ParseResult,
} from "./schema";

// Match Vercel serverless body ceiling (4.5MB) with multipart headroom.
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // 4 MB per file

export const RESUME_EXTENSIONS = [".pdf", ".doc", ".docx"] as const;
export const FORM_EXTENSIONS = [".pdf", ".doc", ".docx"] as const;

export const RESUME_ACCEPT = RESUME_EXTENSIONS.join(",");
export const FORM_ACCEPT = FORM_EXTENSIONS.join(",");

/** Path (under /public) of the downloadable pre-interview form template. */
export const PRE_INTERVIEW_FORM_URL = "/Aptus-Pre-Interview-Form.doc";

export const CAREER_FORM_KEYS = [
  "fullName",
  "email",
  "phone",
  "position",
  "experience",
  "location",
  "coverMessage",
  "jobId",
  "resume",
  "preInterviewForm",
] as const;

export interface ApplicationFields {
  fullName: string;
  email: string;
  phone: string;
  position: string;
  experience: string;
  location: string;
  coverMessage?: string;
  /** Published Odoo hr.job id — required at the API; selects the open role. */
  jobId?: string;
}

export const REQUIRED_TEXT_FIELDS: Array<{
  key: keyof ApplicationFields;
  label: string;
}> = [
  { key: "fullName", label: "Full Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone Number" },
  { key: "position", label: "Position Applying For" },
  { key: "experience", label: "Years of Experience" },
  { key: "location", label: "Location" },
];

const careerSchema: ObjectSchema<{
  fullName: string;
  email: string;
  phone: string;
  position: string;
  experience: string;
  location: string;
  coverMessage: string;
  jobId: string;
}> = {
  fields: {
    fullName: {
      type: "string",
      required: true,
      min: 1,
      max: 120,
      label: "Full Name",
    },
    email: {
      type: "string",
      required: true,
      max: 254,
      sanitize: "email",
      pattern: EMAIL_RE,
      patternMessage: "Enter a valid email address.",
      label: "Email",
    },
    phone: {
      type: "string",
      required: true,
      max: 30,
      pattern: PHONE_RE,
      patternMessage: "Enter a valid phone number.",
      label: "Phone Number",
    },
    position: {
      type: "string",
      required: true,
      min: 1,
      max: 120,
      label: "Position Applying For",
    },
    experience: {
      type: "string",
      required: true,
      min: 1,
      max: 40,
      pattern: /^[\w\s.+-]{1,40}$/,
      patternMessage: "Enter years of experience (e.g. 5 or 3-5).",
      label: "Years of Experience",
    },
    location: {
      type: "string",
      required: true,
      min: 1,
      max: 120,
      label: "Location",
    },
    coverMessage: {
      type: "string",
      required: false,
      max: 5000,
      sanitize: "multiline",
      label: "Cover Message",
    },
    jobId: {
      type: "string",
      required: true,
      min: 1,
      max: 20,
      pattern: /^[1-9]\d{0,18}$/,
      patternMessage:
        "This job is not available for applications. Please choose a published role from Careers.",
      label: "Position Applying For",
    },
  },
};

/** Returns a map of fieldKey -> error message. Empty object means valid. */
export function validateFields(
  fields: Partial<ApplicationFields>,
): Record<string, string> {
  const parsed = parseObject(
    {
      fullName: fields.fullName,
      email: fields.email,
      phone: fields.phone,
      position: fields.position,
      experience: fields.experience,
      location: fields.location,
      coverMessage: fields.coverMessage,
      jobId: fields.jobId,
    },
    { ...careerSchema, rejectUnknown: false },
  );
  return parsed.ok ? {} : parsed.errors;
}

/** Authoritative parse at the API boundary (unknown keys rejected by caller). */
export function parseApplicationFields(
  input: unknown,
): ParseResult<ApplicationFields> {
  const parsed = parseObject(input, careerSchema);
  if (!parsed.ok) return parsed;
  return {
    ok: true,
    data: {
      fullName: parsed.data.fullName,
      email: parsed.data.email,
      phone: parsed.data.phone,
      position: parsed.data.position,
      experience: parsed.data.experience,
      location: parsed.data.location,
      coverMessage: parsed.data.coverMessage || undefined,
      jobId: parsed.data.jobId,
    },
  };
}

export { hasAllowedExtension };

/** Validates a single upload for presence, type and size. */
export function validateFile(
  file: { name: string; size: number; type?: string } | null | undefined,
  allowed: readonly string[],
  label: string,
  required: boolean,
): string | null {
  if (!file || file.size === 0) {
    return required ? `${label} is required.` : null;
  }
  const safeName = sanitizeFilename(file.name);
  if (!hasAllowedExtension(safeName, allowed)) {
    return `${label} must be one of: ${allowed.join(", ")}`;
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return `${label} must be smaller than ${Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))} MB.`;
  }
  // Soft MIME check when the browser provides one.
  if (file.type) {
    const okMime =
      file.type === "application/pdf" ||
      file.type === "application/msword" ||
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.type === "application/octet-stream" ||
      file.type === "";
    if (!okMime) {
      return `${label} has an unsupported file type.`;
    }
  }
  return null;
}

export function rejectUnknownFormKeys(
  keys: Iterable<string>,
): Record<string, string> {
  const allowed = new Set<string>(CAREER_FORM_KEYS);
  const errors: Record<string, string> = {};
  for (const key of keys) {
    if (!allowed.has(key)) errors[key] = "Unexpected field.";
  }
  return errors;
}

export { sanitizeFilename, sanitizeText };
