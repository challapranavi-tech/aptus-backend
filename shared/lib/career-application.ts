/**
 * Shared validation rules for the career application workflow.
 * Imported by both the client form (pre-submit UX) and the API route
 * (authoritative trust-boundary check) so the rules live in one place.
 */

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB per file

export const RESUME_EXTENSIONS = [".pdf", ".doc", ".docx"] as const;
export const FORM_EXTENSIONS = [".pdf", ".doc", ".docx"] as const;

export const RESUME_ACCEPT = RESUME_EXTENSIONS.join(",");
export const FORM_ACCEPT = FORM_EXTENSIONS.join(",");

/** Path (under /public) of the downloadable pre-interview form template. */
export const PRE_INTERVIEW_FORM_URL = "/Aptus-Pre-Interview-Form.doc";

export interface ApplicationFields {
  fullName: string;
  email: string;
  phone: string;
  position: string;
  experience: string;
  location: string;
  coverMessage?: string;
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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Returns a map of fieldKey -> error message. Empty object means valid. */
export function validateFields(
  fields: Partial<ApplicationFields>,
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const { key, label } of REQUIRED_TEXT_FIELDS) {
    if (!fields[key]?.trim()) {
      errors[key] = `${label} is required.`;
    }
  }

  if (fields.email?.trim() && !EMAIL_RE.test(fields.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  return errors;
}

export function hasAllowedExtension(
  fileName: string,
  allowed: readonly string[],
): boolean {
  const lower = fileName.toLowerCase();
  return allowed.some((ext) => lower.endsWith(ext));
}

/** Validates a single upload for presence, type and size. */
export function validateFile(
  file: { name: string; size: number } | null | undefined,
  allowed: readonly string[],
  label: string,
  required: boolean,
): string | null {
  if (!file || file.size === 0) {
    return required ? `${label} is required.` : null;
  }
  if (!hasAllowedExtension(file.name, allowed)) {
    return `${label} must be one of: ${allowed.join(", ")}`;
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return `${label} must be smaller than ${Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))} MB.`;
  }
  return null;
}
