/**
 * Shared validation for the multi-step careers application workflow.
 * Client (UX) and API (trust boundary) import the same rules.
 *
 * Separate from the legacy single-step `career-application.ts` so the old
 * `/career` CMS form + `/api/career/apply` route keep working unchanged.
 */

import {
  EMAIL_RE,
  PHONE_RE,
  parseObject,
  sanitizeFilename,
  sanitizeText,
  type ObjectSchema,
  type ParseResult,
} from "./schema";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB per file

// Resend caps emails at 40MB after Base64 (~33% overhead). Leave headroom for HTML.
// ponytail: naive sum of raw bytes; upgrade if we hit edge cases with many small files.
export const MAX_TOTAL_ATTACHMENT_BYTES = 28 * 1024 * 1024; // 28 MB total per submission

export const RESUME_EXTENSIONS = [".pdf", ".doc", ".docx"] as const;
export const DOC_EXTENSIONS = [".pdf", ".doc", ".docx"] as const;
export const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"] as const;

export const RESUME_ACCEPT = RESUME_EXTENSIONS.join(",");
export const DOC_ACCEPT = DOC_EXTENSIONS.join(",");
export const IMAGE_ACCEPT = IMAGE_EXTENSIONS.join(",");

export const NOTICE_PERIOD_OPTIONS = [
  "Immediate",
  "15 days",
  "30 days",
  "60 days",
  "90 days",
] as const;

export const NA_HELPER =
  "Type 'Not Applicable' if this information is not applicable.";

export interface OrgTenure {
  name: string;
  designation: string;
  duration: string;
  totalYears: string;
}

export interface NamedYear {
  name: string;
  year: string;
}

export interface EducationEntry {
  name: string;
  institution: string;
  year: string;
}

export interface ApplicationFields {
  // A — Basic
  fullName: string;
  email: string;
  phone: string;
  // C — Pre-interview (also mirrors legacy position/experience/location)
  applicationDate: string;
  appliedDesignation: string;
  candidateName: string;
  totalYearsExperience: string;
  dateOfBirth: string;
  currentOrg: OrgTenure;
  previousOrg1: OrgTenure;
  previousOrg2: OrgTenure;
  professionalQualification: string;
  professionalQualificationYear: string;
  graduation: string;
  graduationYear: string;
  certifications: NamedYear[];
  reportsTo: string;
  teamSize: string;
  currentLocation: string;
  familyDetails: string;
  currentCtc: string;
  expectedCtc: string;
  noticePeriod: string;
  passportNumber: string;
  passportValidity: string;
  drivingLicense: string;
  // D
  educationEntries: EducationEntry[];
  // legacy aliases used in email subject / cross-links
  position: string;
  experience: string;
  location: string;
  coverMessage?: string;
  jobSlug?: string;
  jobId?: string;
}

export const EMPTY_ORG: OrgTenure = {
  name: "",
  designation: "",
  duration: "",
  totalYears: "",
};

export function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function emptyApplicationFields(
  partial?: Partial<ApplicationFields>,
): ApplicationFields {
  return {
    fullName: "",
    email: "",
    phone: "",
    applicationDate: todayISODate(),
    appliedDesignation: "",
    candidateName: "",
    totalYearsExperience: "",
    dateOfBirth: "",
    currentOrg: { ...EMPTY_ORG },
    previousOrg1: { ...EMPTY_ORG },
    previousOrg2: { ...EMPTY_ORG },
    professionalQualification: "",
    professionalQualificationYear: "",
    graduation: "",
    graduationYear: "",
    certifications: [{ name: "", year: "" }],
    reportsTo: "",
    teamSize: "",
    currentLocation: "",
    familyDetails: "",
    currentCtc: "",
    expectedCtc: "",
    noticePeriod: "",
    passportNumber: "",
    passportValidity: "",
    drivingLicense: "",
    educationEntries: [{ name: "", institution: "", year: "" }],
    position: "",
    experience: "",
    location: "",
    coverMessage: "",
    jobSlug: "",
    jobId: "",
    ...partial,
  };
}

/** Flat FormData keys (files handled separately). */
export const CAREER_FORM_KEYS = [
  "fullName",
  "email",
  "phone",
  "applicationDate",
  "appliedDesignation",
  "candidateName",
  "totalYearsExperience",
  "dateOfBirth",
  "currentOrg",
  "previousOrg1",
  "previousOrg2",
  "professionalQualification",
  "professionalQualificationYear",
  "graduation",
  "graduationYear",
  "certifications",
  "reportsTo",
  "teamSize",
  "currentLocation",
  "familyDetails",
  "currentCtc",
  "expectedCtc",
  "noticePeriod",
  "passportNumber",
  "passportValidity",
  "drivingLicense",
  "educationEntries",
  "position",
  "experience",
  "location",
  "coverMessage",
  "jobSlug",
  "jobId",
  "resume",
  "educationalCertificates",
  "passportCopy",
  "photograph",
  "appointmentLetter",
  "relievingLetter",
  "latestPayslip",
] as const;

const DOC_MIME_OK = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/octet-stream",
  "",
]);

const IMAGE_MIME_OK = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/octet-stream",
  "",
]);

function requireFilled(value: string | undefined, label: string): string | null {
  if (!value || !value.trim()) return `${label} is required.`;
  return null;
}

function parseOrg(
  raw: unknown,
  label: string,
): { org?: OrgTenure; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  let data: unknown = raw;
  if (typeof raw === "string") {
    try {
      data = JSON.parse(raw);
    } catch {
      return { errors: { [label]: `${label} is invalid.` } };
    }
  }
  if (!data || typeof data !== "object") {
    return { errors: { [label]: `${label} is required.` } };
  }
  const o = data as Record<string, unknown>;
  const org: OrgTenure = {
    name: sanitizeText(String(o.name ?? "")),
    designation: sanitizeText(String(o.designation ?? "")),
    duration: sanitizeText(String(o.duration ?? "")),
    totalYears: sanitizeText(String(o.totalYears ?? "")),
  };
  if (!org.name) errors[`${label}.name`] = `${label}: organization name is required.`;
  if (!org.designation) errors[`${label}.designation`] = `${label}: designation is required.`;
  if (!org.duration) errors[`${label}.duration`] = `${label}: duration is required.`;
  if (!org.totalYears) errors[`${label}.totalYears`] = `${label}: total years is required.`;
  return { org, errors };
}

function parseNamedYearList(
  raw: unknown,
  key: string,
): { list: NamedYear[]; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  let data: unknown = raw;
  if (typeof raw === "string") {
    try {
      data = JSON.parse(raw);
    } catch {
      return { list: [], errors: { [key]: "Invalid list." } };
    }
  }
  if (!Array.isArray(data)) return { list: [], errors: { [key]: "Invalid list." } };
  const list: NamedYear[] = data.map((item) => {
    const row = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    return {
      name: sanitizeText(String(row.name ?? "")),
      year: sanitizeText(String(row.year ?? "")),
    };
  });
  list.forEach((row, i) => {
    if (!row.name && !row.year) return;
    if (!row.name) errors[`${key}.${i}.name`] = "Certification name is required.";
    if (!row.year) errors[`${key}.${i}.year`] = "Year is required.";
  });
  return { list, errors };
}

function parseEducationList(
  raw: unknown,
): { list: EducationEntry[]; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  let data: unknown = raw;
  if (typeof raw === "string") {
    try {
      data = JSON.parse(raw);
    } catch {
      return { list: [], errors: { educationEntries: "Invalid education list." } };
    }
  }
  if (!Array.isArray(data) || data.length === 0) {
    return {
      list: [{ name: "", institution: "", year: "" }],
      errors: {
        "educationEntries.0.name": "Qualification / Certificate is required.",
        "educationEntries.0.institution": "Institution is required.",
        "educationEntries.0.year": "Year is required.",
      },
    };
  }
  const list: EducationEntry[] = data.map((item) => {
    const row = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    return {
      name: sanitizeText(String(row.name ?? "")),
      institution: sanitizeText(String(row.institution ?? "")),
      year: sanitizeText(String(row.year ?? "")),
    };
  });
  // At least one entry required; every present entry must be complete.
  // Extra rows are allowed via "+ Add".
  list.forEach((row, i) => {
    if (!row.name) errors[`educationEntries.${i}.name`] = "Qualification / Certificate is required.";
    if (!row.institution) errors[`educationEntries.${i}.institution`] = "Institution is required.";
    if (!row.year) errors[`educationEntries.${i}.year`] = "Year is required.";
  });
  return { list, errors };
}

const basicSchema: ObjectSchema<{
  fullName: string;
  email: string;
  phone: string;
}> = {
  fields: {
    fullName: { type: "string", required: true, min: 1, max: 120, label: "Full Name" },
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
  },
  rejectUnknown: false,
};

/** Step A client validation. */
export function validateBasic(
  fields: Partial<ApplicationFields>,
): Record<string, string> {
  const parsed = parseObject(
    {
      fullName: fields.fullName,
      email: fields.email,
      phone: fields.phone,
    },
    basicSchema,
  );
  return parsed.ok ? {} : parsed.errors;
}

/** Step C client validation. */
export function validatePreInterview(
  fields: Partial<ApplicationFields>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  const req = (key: keyof ApplicationFields, label: string) => {
    const e = requireFilled(fields[key] as string | undefined, label);
    if (e) errors[key] = e;
  };
  req("applicationDate", "Date of Application");
  req("appliedDesignation", "Applied Designation");
  req("candidateName", "Name of the Candidate");
  req("totalYearsExperience", "Total Years of Experience");
  req("dateOfBirth", "Date of Birth");
  req("professionalQualification", "Professional Qualification");
  req("professionalQualificationYear", "Professional Qualification Year");
  req("graduation", "Graduation");
  req("graduationYear", "Graduation Year");
  req("reportsTo", "Reports To");
  req("teamSize", "Team Size");
  req("currentLocation", "Current Location");
  // familyDetails & drivingLicense are optional.
  req("currentCtc", "Current CTC");
  req("expectedCtc", "Expected CTC");
  // security: allowlist — reject anything outside the known notice periods.
  if (!fields.noticePeriod || !fields.noticePeriod.trim()) {
    errors.noticePeriod = "Notice Period is required.";
  } else if (!NOTICE_PERIOD_OPTIONS.includes(fields.noticePeriod as (typeof NOTICE_PERIOD_OPTIONS)[number])) {
    errors.noticePeriod = "Select a valid notice period.";
  }
  req("passportNumber", "Passport Number");
  req("passportValidity", "Passport Validity");

  const c = parseOrg(fields.currentOrg ?? EMPTY_ORG, "Current Organization");
  Object.assign(errors, c.errors);
  const p1 = parseOrg(fields.previousOrg1 ?? EMPTY_ORG, "Immediate Previous Organization");
  Object.assign(errors, p1.errors);
  const p2 = parseOrg(fields.previousOrg2 ?? EMPTY_ORG, "Previous Organization");
  Object.assign(errors, p2.errors);

  const certs = parseNamedYearList(fields.certifications ?? [], "certifications");
  Object.assign(errors, certs.errors);

  if (fields.teamSize && !/^\d{1,4}$/.test(String(fields.teamSize).trim())) {
    errors.teamSize = "Enter a valid team size.";
  }
  if (
    fields.totalYearsExperience &&
    !/^[\w\s.+-]{1,40}$/.test(String(fields.totalYearsExperience).trim())
  ) {
    errors.totalYearsExperience = "Enter years of experience (e.g. 5 or 3-5).";
  }

  return errors;
}

/** Step D client validation. */
export function validateEducation(
  fields: Partial<ApplicationFields>,
): Record<string, string> {
  return parseEducationList(fields.educationEntries ?? []).errors;
}

/**
 * Full-field map for client pre-submit (steps A–D text).
 * Files validated separately via validateFile / validateImageFile.
 */
export function validateFields(
  fields: Partial<ApplicationFields>,
): Record<string, string> {
  return {
    ...validateBasic(fields),
    ...validatePreInterview(fields),
    ...validateEducation(fields),
  };
}

export function hasAllowedExtension(
  fileName: string,
  allowed: readonly string[],
): boolean {
  const lower = fileName.toLowerCase();
  return allowed.some((ext) => lower.endsWith(ext));
}

export function validateFile(
  file: { name: string; size: number; type?: string } | null | undefined,
  allowed: readonly string[],
  label: string,
  required: boolean,
  mimeOk: Set<string> = DOC_MIME_OK,
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
  if (file.type && !mimeOk.has(file.type)) {
    return `${label} has an unsupported file type.`;
  }
  return null;
}

export function validateImageFile(
  file: { name: string; size: number; type?: string } | null | undefined,
  label: string,
  required: boolean,
): string | null {
  return validateFile(file, IMAGE_EXTENSIONS, label, required, IMAGE_MIME_OK);
}

export function rejectUnknownFormKeys(
  keys: Iterable<string>,
): Record<string, string> {
  const allowed = new Set<string>(CAREER_FORM_KEYS);
  const errors: Record<string, string> = {};
  for (const key of keys) {
    if (key.startsWith("educationDoc_")) continue;
    if (!allowed.has(key as (typeof CAREER_FORM_KEYS)[number])) {
      errors[key] = "Unexpected field.";
    }
  }
  return errors;
}

function str(form: FormData | Record<string, unknown>, key: string): string {
  if (form instanceof FormData) {
    const v = form.get(key);
    return typeof v === "string" ? v : "";
  }
  const v = form[key];
  return v == null ? "" : String(v);
}

/** Authoritative parse at the API boundary. */
export function parseApplicationFields(
  input: FormData | Record<string, unknown>,
): ParseResult<ApplicationFields> {
  const get = (k: string) => str(input, k);

  const basic = parseObject(
    {
      fullName: get("fullName") || get("candidateName"),
      email: get("email"),
      phone: get("phone"),
    },
    basicSchema,
  );

  const errors: Record<string, string> = basic.ok ? {} : { ...basic.errors };

  const rawOf = (k: string): unknown =>
    input instanceof FormData ? input.get(k) : (input as Record<string, unknown>)[k];

  const c = parseOrg(rawOf("currentOrg") ?? "{}", "Current Organization");
  Object.assign(errors, c.errors);
  const p1 = parseOrg(rawOf("previousOrg1") ?? "{}", "Immediate Previous Organization");
  Object.assign(errors, p1.errors);
  const p2 = parseOrg(rawOf("previousOrg2") ?? "{}", "Previous Organization");
  Object.assign(errors, p2.errors);
  const certs = parseNamedYearList(rawOf("certifications") ?? "[]", "certifications");
  Object.assign(errors, certs.errors);
  const edu = parseEducationList(rawOf("educationEntries") ?? "[]");
  Object.assign(errors, edu.errors);

  const draft: ApplicationFields = emptyApplicationFields({
    fullName: basic.ok ? basic.data.fullName : get("fullName"),
    email: basic.ok ? basic.data.email : get("email"),
    phone: basic.ok ? basic.data.phone : get("phone"),
    applicationDate: sanitizeText(get("applicationDate") || todayISODate()),
    appliedDesignation: sanitizeText(get("appliedDesignation") || get("position")),
    candidateName: sanitizeText(get("candidateName") || get("fullName")),
    totalYearsExperience: sanitizeText(get("totalYearsExperience") || get("experience")),
    dateOfBirth: sanitizeText(get("dateOfBirth")),
    currentOrg: c.org ?? { ...EMPTY_ORG },
    previousOrg1: p1.org ?? { ...EMPTY_ORG },
    previousOrg2: p2.org ?? { ...EMPTY_ORG },
    professionalQualification: sanitizeText(get("professionalQualification")),
    professionalQualificationYear: sanitizeText(get("professionalQualificationYear")),
    graduation: sanitizeText(get("graduation")),
    graduationYear: sanitizeText(get("graduationYear")),
    certifications: certs.list.length ? certs.list : [{ name: "", year: "" }],
    reportsTo: sanitizeText(get("reportsTo")),
    teamSize: sanitizeText(get("teamSize")),
    currentLocation: sanitizeText(get("currentLocation") || get("location")),
    familyDetails: sanitizeText(get("familyDetails"), "multiline"),
    currentCtc: sanitizeText(get("currentCtc")),
    expectedCtc: sanitizeText(get("expectedCtc")),
    noticePeriod: sanitizeText(get("noticePeriod")),
    passportNumber: sanitizeText(get("passportNumber")),
    passportValidity: sanitizeText(get("passportValidity")),
    drivingLicense: sanitizeText(get("drivingLicense")),
    educationEntries: edu.list.length
      ? edu.list
      : [{ name: "", institution: "", year: "" }],
    position: sanitizeText(get("position") || get("appliedDesignation")),
    experience: sanitizeText(get("experience") || get("totalYearsExperience")),
    location: sanitizeText(get("location") || get("currentLocation")),
    coverMessage: sanitizeText(get("coverMessage"), "multiline") || undefined,
    jobSlug: sanitizeText(get("jobSlug")) || undefined,
    jobId: sanitizeText(get("jobId")) || undefined,
  });

  Object.assign(errors, validatePreInterview(draft));

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, data: draft };
}

export { sanitizeFilename, sanitizeText };
