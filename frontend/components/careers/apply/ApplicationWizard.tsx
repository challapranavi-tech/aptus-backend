"use client";

import { publicApiBase } from "@/lib/api-base";
import { toE164, toLocalPhoneDigits } from "@/lib/phone";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  DOC_ACCEPT,
  IMAGE_ACCEPT,
  MAX_TOTAL_ATTACHMENT_BYTES,
  MAX_UPLOAD_BYTES,
  NA_HELPER,
  NOTICE_PERIOD_OPTIONS,
  RESUME_ACCEPT,
  RESUME_EXTENSIONS,
  emptyApplicationFields,
  validateFile,
  validateImageFile,
  type ApplicationFields,
  type EducationEntry,
  type OrgTenure,
} from "@shared/lib/careers-application";
import type { CareerJob } from "@shared/lib/career-jobs";
import type { ResumeHints } from "@shared/lib/resume-parse";
import { PERSON_NAME_RE, meaningfulTextError, personNameError } from "@shared/lib/schema";
import { useEffect, useMemo, useRef, useState } from "react";
import { FileDropzone } from "./FileDropzone";
import {
  APPLY_STEP_ERROR_HEADING,
  formatApplySubmitErrors,
} from "./apply-alerts";
import { SelectField, TextAreaField, TextField } from "./fields";

/**
 * 4-step flow:
 *   1. basics     – Resume + personal info
 *   2. experience – Orgs, qualifications, CTC, passport
 *   3. documents  – Photo, passport, payslip, employment docs (all optional)
 *   4. review     – Summary + submit
 *
 * UI-only state (first/last name, country code, dynamic orgs) is mapped onto
 * CAREER_FORM_KEYS on submit — never send unknown FormData keys.
 */
const STEPS = [
  { key: "basics", label: "Your Details", sub: "Resume & personal info" },
  { key: "experience", label: "Experience", sub: "Work history & details" },
  { key: "documents", label: "Documents", sub: "Upload supporting files" },
  { key: "review", label: "Review", sub: "Submit application" },
] as const;

export const COUNTRY_CODES = [
  { label: "🇴🇲 Oman (+968)", value: "+968", digits: 8 },
  { label: "🇮🇳 India (+91)", value: "+91", digits: 10 },
  { label: "🇦🇪 UAE (+971)", value: "+971", digits: 9 },
  { label: "🇸🇦 Saudi Arabia (+966)", value: "+966", digits: 9 },
  { label: "🇬🇧 UK (+44)", value: "+44", digits: 10 },
  { label: "🇺🇸 US (+1)", value: "+1", digits: 10 },
  { label: "🇵🇭 Philippines (+63)", value: "+63", digits: 10 },
  { label: "🇵🇰 Pakistan (+92)", value: "+92", digits: 10 },
  { label: "🇧🇩 Bangladesh (+880)", value: "+880", digits: 10 },
  { label: "🇳🇵 Nepal (+977)", value: "+977", digits: 10 },
];

const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "10minutemail.com",
  "throwaway.email",
  "yopmail.com",
  "trashmail.com",
  "fakeinbox.com",
  "sharklasers.com",
  "tempmail.com",
  "dispostable.com",
  "maildrop.cc",
  "getairmail.com",
  "mailnull.com",
  "spamgourmet.com",
  "trashmail.me",
  "discard.email",
  "getnada.com",
  "tempr.email",
  "spamex.com",
  "airmail.cc",
  "spam4.me",
]);

const NA = "Not Applicable";

function validateEmailAddress(email: string): string | null {
  const t = email.trim().toLowerCase();
  if (!t) return "Email is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(t))
    return "Enter a valid email address (e.g. name@example.com).";
  const [local, domain] = t.split("@");
  if (DISPOSABLE_DOMAINS.has(domain))
    return "Disposable email addresses are not accepted.";
  if (/[^aeiou\d._+\-]{8,}/i.test(local))
    return "This email looks invalid. Please enter a real address.";
  return null;
}

function validatePhoneNumber(phone: string, countryCode: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "Phone number is required.";
  const rule = COUNTRY_CODES.find((c) => c.value === countryCode);
  if (rule && digits.length !== rule.digits) {
    const name = rule.label.split(" ")[1];
    return `${name} numbers must be exactly ${rule.digits} digits (got ${digits.length}).`;
  }
  if (!rule && (digits.length < 7 || digits.length > 15))
    return "Enter a valid phone number (7–15 digits).";
  return null;
}

/** Parse DD-MM-YYYY into a local Date (or null). */
function parseDMY(value: string): Date | null {
  const m = value.trim().match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!m) return null;
  const dd = Number(m[1]);
  const mm = Number(m[2]);
  const yyyy = Number(m[3]);
  const d = new Date(yyyy, mm - 1, dd);
  if (
    Number.isNaN(d.getTime()) ||
    d.getFullYear() !== yyyy ||
    d.getMonth() !== mm - 1 ||
    d.getDate() !== dd
  ) {
    return null;
  }
  return d;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function todayDMY(): string {
  const d = new Date();
  return `${pad2(d.getDate())}-${pad2(d.getMonth() + 1)}-${d.getFullYear()}`;
}

/** Accept ISO from legacy defaults and normalize to DD-MM-YYYY. */
function toDMY(value: string): string {
  if (!value) return "";
  if (parseDMY(value)) return value.trim();
  const iso = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return `${iso[3]}-${iso[2]}-${iso[1]}`;
  return value.trim();
}

function validateDateDMY(
  value: string,
  label: string,
  opts?: { allowTodayOrPast?: boolean; mustBeFuture?: boolean; minAge?: number },
): string | null {
  if (!value) return `${label} is required.`;
  const date = parseDMY(value);
  if (!date) return `${label} must be DD-MM-YYYY.`;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (opts?.allowTodayOrPast && date > today)
    return `${label} cannot be in the future.`;
  if (opts?.mustBeFuture && date <= today)
    return `${label} must be a future date.`;
  if (opts?.minAge !== undefined) {
    const cutoff = new Date(today);
    cutoff.setFullYear(today.getFullYear() - opts.minAge);
    if (date > cutoff) return `You must be at least ${opts.minAge} years old.`;
  }
  return null;
}

/** First token → first name; remaining → last name.
 *  "Anagha R Senan" (middle initial) → First: Anagha, Last: Senan. */
function splitPersonName(full: string): { first: string; last: string } {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: "", last: "" };
  if (parts.length === 1) return { first: parts[0], last: "" };
  if (parts.length >= 3 && /^[A-Za-z]\.?$/.test(parts[1])) {
    return { first: parts[0], last: parts.slice(2).join(" ") };
  }
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

interface OrgEntry extends OrgTenure {
  id: string;
}

const emptyOrg = (): OrgEntry => ({
  id: Math.random().toString(36).slice(2),
  name: "",
  designation: "",
  duration: "",
  totalYears: "",
});

function tenureOnly(org: OrgTenure): OrgTenure {
  return {
    name: org.name,
    designation: org.designation,
    duration: org.duration,
    totalYears: org.totalYears,
  };
}

function naOrg(): OrgTenure {
  return { name: NA, designation: NA, duration: NA, totalYears: "0" };
}

interface FileState {
  resume: File | null;
  passportCopy: File | null;
  photograph: File | null;
  appointmentLetter: File | null;
  relievingLetter: File | null;
  latestPayslip: File | null;
  educationDocs: (File | null)[];
}

const EMPTY_FILES: FileState = {
  resume: null,
  passportCopy: null,
  photograph: null,
  appointmentLetter: null,
  relievingLetter: null,
  latestPayslip: null,
  educationDocs: [null],
};

type Errors = Record<string, string>;

/**
 * DD-MM-YYYY text field (matches other inputs). Optional calendar control is an
 * icon-sized overlay — never a second full-width <input type="date"> (browser
 * locale would show mm/dd/yyyy and break the grid).
 */
function DateField({
  id,
  label,
  required,
  help,
  value,
  error,
  onChange,
  autoFilled,
}: {
  id: string;
  label: string;
  required?: boolean;
  help?: string;
  value: string; // DD-MM-YYYY
  error?: string;
  onChange: (v: string) => void;
  autoFilled?: boolean;
}) {
  const display = toDMY(value);
  const isoForPicker = (() => {
    const d = parseDMY(display);
    if (!d) return "";
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  })();

  const formatTyped = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
  };

  return (
    <div
      className="aptus-field"
      data-invalid={error ? "true" : undefined}
      data-autofilled={autoFilled ? "true" : undefined}
    >
      <label htmlFor={id}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      {autoFilled && (
        <span className="aptus-field__badge" title="Pre-filled from your resume">
          Auto-filled — review
        </span>
      )}
      <div className="aptus-apply__date">
        <input
          id={id}
          type="text"
          inputMode="numeric"
          placeholder="DD-MM-YYYY"
          autoComplete="bday"
          maxLength={10}
          value={display}
          aria-invalid={error ? true : undefined}
          onChange={(e) => onChange(formatTyped(e.target.value))}
        />
        <label className="aptus-apply__date-cal" title="Open calendar">
          <span className="aptus-apply__date-cal-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M3 10h18M8 3v4M16 3v4" />
            </svg>
          </span>
          <input
            type="date"
            aria-label={`${label} calendar`}
            value={isoForPicker}
            onChange={(e) => {
              const raw = e.target.value;
              if (!raw) {
                onChange("");
                return;
              }
              const [y, m, d] = raw.split("-");
              onChange(`${d}-${m}-${y}`);
            }}
          />
        </label>
      </div>
      {help && <p className="aptus-field__help">{help}</p>}
      {error && (
        <p className="aptus-field__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/** Split dial-code from a resume phone into local digits for the country select. */
function splitPhone(
  rawPhone: string,
  fallbackCode: string,
): { countryCode: string; local: string } {
  const compact = rawPhone.replace(/[\s().-]/g, "");
  const withPlus = compact.startsWith("+") ? compact : `+${compact}`;
  const byCode = [...COUNTRY_CODES].sort(
    (a, b) => b.value.length - a.value.length,
  );
  for (const c of byCode) {
    if (withPlus.startsWith(c.value)) {
      const local = withPlus.slice(c.value.length).replace(/\D/g, "");
      if (local.length >= 6) return { countryCode: c.value, local };
    }
  }
  // Digits-only: try matching known CC prefixes (e.g. 9198… → +91).
  const digits = compact.replace(/\D/g, "");
  for (const c of byCode) {
    const cc = c.value.slice(1);
    if (digits.startsWith(cc) && digits.length === cc.length + c.digits) {
      return { countryCode: c.value, local: digits.slice(cc.length) };
    }
  }
  return {
    countryCode: fallbackCode,
    local: digits,
  };
}

function OrgBlock({
  index,
  org,
  errors,
  onChange,
  onRemove,
}: {
  index: number;
  org: OrgEntry;
  errors: Errors;
  onChange: (patch: Partial<OrgTenure>) => void;
  onRemove?: () => void;
}) {
  const label = index === 0 ? "Current Organization" : `Previous Organization ${index}`;
  const pfx = `org_${org.id}`;

  return (
    <fieldset className="aptus-apply__group" style={{ position: "relative" }}>
      <legend style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "1.5rem",
            height: "1.5rem",
            borderRadius: "50%",
            background: "var(--aptus-blue, #24648c)",
            color: "#fff",
            fontSize: "0.75rem",
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {index + 1}
        </span>
        {label}
      </legend>
      <p className="aptus-field__help">{NA_HELPER}</p>

      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${label}`}
          style={{
            position: "absolute",
            top: "0.75rem",
            right: "0.75rem",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#dc2626",
            fontSize: "1.1rem",
            lineHeight: 1,
            padding: "0.25rem",
          }}
        >
          ✕
        </button>
      )}

      <div className="aptus-apply__grid aptus-apply__grid--2">
        <TextField
          id={`${pfx}-name`}
          label="Organization Name"
          required
          value={org.name}
          error={errors[`${pfx}-name`]}
          onChange={(v) => onChange({ name: v })}
        />
        <TextField
          id={`${pfx}-designation`}
          label="Designation / Role"
          required
          value={org.designation}
          error={errors[`${pfx}-designation`]}
          onChange={(v) => onChange({ designation: v })}
        />
        <TextField
          id={`${pfx}-duration`}
          label="Duration"
          placeholder="e.g. 2020–2024 or Present"
          required
          value={org.duration}
          error={errors[`${pfx}-duration`]}
          onChange={(v) => onChange({ duration: v })}
        />
        <TextField
          id={`${pfx}-totalYears`}
          label="Total Years"
          inputMode="numeric"
          placeholder="e.g. 3.5"
          required
          value={org.totalYears}
          error={errors[`${pfx}-totalYears`]}
          onChange={(v) => onChange({ totalYears: v })}
        />
      </div>
    </fieldset>
  );
}

export function ApplicationWizard({ job }: { job: CareerJob }) {
  const [step, setStep] = useState(0);
  const [maxStep, setMaxStep] = useState(0);

  const [values, setValues] = useState<ApplicationFields>(() =>
    emptyApplicationFields({
      appliedDesignation: job.title,
      position: job.title,
      jobSlug: job.slug,
      jobId: job.id,
      applicationDate: todayDMY(),
    }),
  );

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [countryCode, setCountryCode] = useState("+968");
  const [orgs, setOrgs] = useState<OrgEntry[]>([emptyOrg()]);

  const [files, setFiles] = useState<FileState>(EMPTY_FILES);
  const [autoFilled, setAutoFilled] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Errors>({});

  const [submitState, setSubmitState] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [progress, setProgress] = useState(0);
  const [submitError, setSubmitError] = useState("");
  const [showSummary, setShowSummary] = useState(false);

  // Drop the submit banner once the applicant has cleared every field error
  // (e.g. by replacing a rejected file). Text fields clear via setValue;
  // file dropzones clear via clearFileError.
  useEffect(() => {
    if (submitState === "error" && !Object.values(errors).some(Boolean)) {
      setSubmitError("");
      setSubmitState("idle");
    }
  }, [errors, submitState]);

  const topRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const submittingRef = useRef(false);

  // scrollTop defined early so useEffect below can reference it.
  const scrollTop = () =>
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  // ── Re-validate all steps whenever the review step becomes active ────────────
  // Catches the case where a user navigated back via the step tabs or the
  // "Edit" buttons, cleared a required field, and jumped back to review
  // without going through "Continue" (which calls validateStep). Without this,
  // every browser can reach Submit with a step that was cleared after it was
  // originally validated.
  useEffect(() => {
    if (STEPS[step].key !== "review") return;
    const stepErrs = [0, 1, 2].map((i) => validateStep(i));
    const all: Errors = Object.assign({}, ...stepErrs);
    if (Object.keys(all).length > 0) {
      const firstBad = stepErrs.findIndex((e) => Object.keys(e).length > 0);
      setStep(firstBad >= 0 ? firstBad : 0);
      setMaxStep((m) => Math.max(m, firstBad >= 0 ? firstBad : 0));
      setErrors(all);
      setShowSummary(true);
      scrollTop();
      requestAnimationFrame(() => summaryRef.current?.focus());
    } else {
      setErrors({});
      setShowSummary(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Called after any file state change to warn immediately if the running
  // total would exceed MAX_TOTAL_ATTACHMENT_BYTES. Prevents the 413 on submit.
  // educationDocs cover educationalCertificates FormData keys (same files).
  const checkTotalAfterChange = (nextFiles: Partial<FileState>) => {
    const merged = { ...files, ...nextFiles };
    const total = [
      merged.resume,
      merged.passportCopy,
      merged.photograph,
      merged.appointmentLetter,
      merged.relievingLetter,
      merged.latestPayslip,
      ...(merged.educationDocs ?? []),
    ].reduce((n, f) => n + (f?.size ?? 0), 0);
    if (total > MAX_TOTAL_ATTACHMENT_BYTES) {
      const tot = (total / (1024 * 1024)).toFixed(1);
      setErrors((p) => ({
        ...p,
        _form: `Your files total ${tot} MB which exceeds the 4.5 MB limit. Remove or compress some files before submitting.`,
      }));
      setShowSummary(true);
      scrollTop();
    } else {
      setErrors((p) => {
        if (p._form?.includes("4.5 MB limit")) {
          const { _form: _, ...rest } = p;
          return rest;
        }
        return p;
      });
    }
  };

  const setValue = (key: keyof ApplicationFields, v: string) => {
    setValues((prev) => ({ ...prev, [key]: v }));
    if (errors[key]) setErrors((p) => ({ ...p, [key]: "" }));
    if (autoFilled.has(key)) {
      setAutoFilled((p) => {
        const n = new Set(p);
        n.delete(key);
        return n;
      });
    }
  };

  const clearFileError = (key: string) => {
    setErrors((p) => {
      if (!(key in p) || !p[key]) return p;
      const { [key]: _removed, ...rest } = p;
      return rest;
    });
  };

  const updateOrg = (index: number, patch: Partial<OrgTenure>) => {
    setOrgs((prev) => prev.map((o, i) => (i === index ? { ...o, ...patch } : o)));
    const pfx = `org_${orgs[index]?.id}`;
    const cleared: Errors = {};
    Object.keys(patch).forEach((k) => {
      cleared[`${pfx}-${k}`] = "";
    });
    setErrors((p) => ({ ...p, ...cleared }));
  };

  const addOrg = () => setOrgs((prev) => [...prev, emptyOrg()]);
  const removeOrg = (index: number) =>
    setOrgs((prev) => prev.filter((_, i) => i !== index));

  const updateEducation = (i: number, patch: Partial<EducationEntry>) => {
    setValues((prev) => ({
      ...prev,
      educationEntries: prev.educationEntries.map((e, idx) =>
        idx === i ? { ...e, ...patch } : e,
      ),
    }));
  };
  const addEducation = () => {
    setValues((prev) => ({
      ...prev,
      educationEntries: [
        ...prev.educationEntries,
        { name: "", institution: "", year: "" },
      ],
    }));
    setFiles((p) => ({ ...p, educationDocs: [...p.educationDocs, null] }));
  };
  const removeEducation = (i: number) => {
    setValues((prev) => ({
      ...prev,
      educationEntries: prev.educationEntries.filter((_, idx) => idx !== i),
    }));
    setFiles((p) => ({
      ...p,
      educationDocs: p.educationDocs.filter((_, idx) => idx !== i),
    }));
  };

  const validateStep = (index: number): Errors => {
    const errs: Errors = {};

    if (STEPS[index].key === "basics") {
      const firstErr = personNameError(firstName, "First name");
      if (firstErr) errs.firstName = firstErr;
      const lastErr = personNameError(lastName, "Last name");
      if (lastErr) errs.lastName = lastErr;

      const emailErr = validateEmailAddress(values.email);
      if (emailErr) errs.email = emailErr;

      const phoneErr = validatePhoneNumber(values.phone, countryCode);
      if (phoneErr) errs.phone = phoneErr;

      const locErr = meaningfulTextError(
        values.currentLocation,
        "Current Location",
      );
      if (locErr) errs.currentLocation = locErr;

      const dobErr = validateDateDMY(values.dateOfBirth, "Date of Birth", {
        allowTodayOrPast: true,
        minAge: 18,
      });
      if (dobErr) errs.dateOfBirth = dobErr;

      const resumeErr = validateFile(files.resume, RESUME_EXTENSIONS, "Resume", true);
      if (resumeErr) errs.resume = resumeErr;
    }

    if (STEPS[index].key === "experience") {
      const appDateErr = validateDateDMY(
        toDMY(values.applicationDate),
        "Date of Application",
        { allowTodayOrPast: true },
      );
      if (appDateErr) errs.applicationDate = appDateErr;

      if (!values.passportNumber.trim())
        errs.passportNumber = "Passport number is required.";
      else if (!/^[A-Z0-9]{6,15}$/i.test(values.passportNumber.trim())) {
        errs.passportNumber =
          "Please enter a valid passport number (ICAO standard: 6–15 uppercase letters and digits only, e.g. A12345678).";
      }
      const passportErr = validateDateDMY(
        values.passportValidity,
        "Passport Validity",
        { mustBeFuture: true },
      );
      if (passportErr) errs.passportValidity = passportErr;

      const yearsErr = meaningfulTextError(
        values.totalYearsExperience,
        "Total years of experience",
      );
      if (yearsErr) errs.totalYearsExperience = yearsErr;

      orgs.forEach((org) => {
        const pfx = `org_${org.id}`;
        const nameErr = meaningfulTextError(org.name, "Organization name");
        if (nameErr) errs[`${pfx}-name`] = nameErr;
        const desErr = meaningfulTextError(org.designation, "Designation");
        if (desErr) errs[`${pfx}-designation`] = desErr;
        const durErr = meaningfulTextError(org.duration, "Duration");
        if (durErr) errs[`${pfx}-duration`] = durErr;
        const totErr = meaningfulTextError(org.totalYears, "Total years");
        if (totErr) errs[`${pfx}-totalYears`] = totErr;
      });

      if (!values.noticePeriod) errs.noticePeriod = "Please select a notice period.";
      else if (
        !NOTICE_PERIOD_OPTIONS.includes(
          values.noticePeriod as (typeof NOTICE_PERIOD_OPTIONS)[number],
        )
      ) {
        errs.noticePeriod = "Select a valid notice period.";
      }
      const curCtcErr = meaningfulTextError(values.currentCtc, "Current CTC");
      if (curCtcErr) errs.currentCtc = curCtcErr;
      const expCtcErr = meaningfulTextError(values.expectedCtc, "Expected CTC");
      if (expCtcErr) errs.expectedCtc = expCtcErr;

      const reportsErr = meaningfulTextError(values.reportsTo, "Reports To");
      if (reportsErr) errs.reportsTo = reportsErr;
      if (!values.teamSize.trim()) errs.teamSize = "Team Size is required.";
      else if (!/^\d{1,4}$/.test(values.teamSize.trim()))
        errs.teamSize = "Enter a valid team size.";

      values.educationEntries.forEach((e, i) => {
        if (i === 0 || e.name || e.institution || e.year) {
          const qErr = meaningfulTextError(e.name, "Qualification");
          if (qErr) errs[`educationEntries.${i}.name`] = qErr;
          const iErr = meaningfulTextError(e.institution, "Institution");
          if (iErr) errs[`educationEntries.${i}.institution`] = iErr;
          const yErr = meaningfulTextError(e.year, "Year");
          if (yErr) errs[`educationEntries.${i}.year`] = yErr;
        }
      });
      files.educationDocs.forEach((f, i) => {
        if (f && f.size > MAX_UPLOAD_BYTES)
          errs[`educationDoc_${i}`] = "Each file must be under 0.8 MB (800 KB).";
      });
    }

    if (STEPS[index].key === "documents") {
      const photoErr = validateImageFile(files.photograph, "Photograph", false);
      if (photoErr) errs.photograph = photoErr;

      const checks: Array<[string, File | null]> = [
        ["passportCopy", files.passportCopy],
        ["photograph", files.photograph],
        ["latestPayslip", files.latestPayslip],
        ["appointmentLetter", files.appointmentLetter],
        ["relievingLetter", files.relievingLetter],
      ];
      checks.forEach(([key, f]) => {
        if (f && f.size > MAX_UPLOAD_BYTES)
          errs[key] = "Each file must be under 0.8 MB (800 KB).";
      });
    }

    return errs;
  };

  const goTo = (index: number) => {
    // When jumping TO the review step (step 3) via tab or Edit button,
    // re-run every step's validation so any data cleared after passing
    // "Continue" is caught before the user can hit Submit.
    if (index === STEPS.length - 1) {
      const all: Errors = {
        ...validateStep(0),
        ...validateStep(1),
        ...validateStep(2),
      };
      if (Object.keys(all).length > 0) {
        for (let i = 0; i < STEPS.length - 1; i++) {
          if (Object.keys(validateStep(i)).length > 0) {
            setStep(i);
            setMaxStep((m) => Math.max(m, i));
            setErrors(all);
            setShowSummary(true);
            scrollTop();
            requestAnimationFrame(() => summaryRef.current?.focus());
            return;
          }
        }
      }
    }
    setStep(index);
    setMaxStep((m) => Math.max(m, index));
    setShowSummary(false);
    scrollTop();
  };

  const blockWithErrors = (e: Errors) => {
    setErrors(e);
    setShowSummary(true);
    scrollTop();
    requestAnimationFrame(() => summaryRef.current?.focus());
  };

  const next = () => {
    const e = validateStep(step);
    if (Object.keys(e).length > 0) {
      blockWithErrors(e);
      return;
    }
    setErrors({});
    goTo(Math.min(step + 1, STEPS.length - 1));
  };

  const back = () => {
    // Allow leaving an incomplete step — validate only on Continue / Submit.
    setErrors({});
    goTo(Math.max(step - 1, 0));
  };

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    const id = (e.target as HTMLElement).id;
    if (!id) return;
    const stepErrors = validateStep(step);
    if (id in stepErrors || errors[id])
      setErrors((prev) => ({ ...prev, [id]: stepErrors[id] ?? "" }));
  };

  const [parsing, setParsing] = useState(false);
  const [parseNote, setParseNote] = useState<string | null>(null);

  const handleResume = async (list: File[]) => {
    const file = list[0] ?? null;
    setFiles((p) => ({ ...p, resume: file }));
    checkTotalAfterChange({ resume: file });
    clearFileError("resume");
    if (!file) return;

    if (file.size > MAX_UPLOAD_BYTES) {
      setErrors((p) => ({
        ...p,
        resume: "Resume must be under 0.8 MB (800 KB).",
      }));
      return;
    }

    setParsing(true);
    setParseNote(null);
    try {
      const body = new FormData();
      body.append("resume", file);
      const res = await fetch(`${publicApiBase()}/api/careers/parse-resume`, {
        method: "POST",
        body,
      });
      const data = (await res.json()) as { hints?: ResumeHints };
      const hints = data.hints;
      if (hints && hints.autoFilledKeys.length > 0) {
        applyHints(hints);
      } else {
        setParseNote(
          "Couldn't auto-read your resume — fill in the fields below manually.",
        );
      }
    } catch {
      setParseNote("Auto-fill unavailable — please fill in the fields manually.");
    } finally {
      setParsing(false);
    }
  };

  const applyHints = (hints: ResumeHints) => {
    const filled = new Set(autoFilled);
    const looksReal = (s: string) => {
      const t = s.trim();
      if (t.length < 2) return false;
      // Reject placeholder / mock junk candidates sometimes leave in resumes.
      if (/^(n\/?a|na|nil|none|test|xxx+|asdf|qwer|mock|sample|dummy)$/i.test(t))
        return false;
      return PERSON_NAME_RE.test(t);
    };

    // Only fill empty fields — never invent values when the parser found nothing.
    if (hints.fullName?.trim() && looksReal(hints.fullName) && !firstName.trim()) {
      const { first, last } = splitPersonName(hints.fullName);
      if (looksReal(first)) {
        setFirstName(first);
        setLastName(looksReal(last) ? last : "");
        filled.add("fullName");
        filled.add("firstName");
        if (looksReal(last)) filled.add("lastName");
      }
    }

    let localPhone: string | undefined;
    if (hints.phone) {
      const split = splitPhone(hints.phone, countryCode);
      if (split.local.length >= 7) {
        setCountryCode(split.countryCode);
        localPhone = split.local;
        filled.add("phone");
      }
    }

    setValues((prev) => {
      const next = { ...prev };
      if (hints.fullName?.trim() && looksReal(hints.fullName) && !prev.fullName.trim()) {
        next.fullName = hints.fullName.trim();
        next.candidateName = hints.fullName.trim();
      }
      if (hints.email && !prev.email.trim()) {
        next.email = hints.email;
        filled.add("email");
      }
      if (localPhone && !prev.phone.trim()) {
        next.phone = localPhone;
      }
      if (
        hints.experienceYears &&
        !prev.totalYearsExperience.trim() &&
        /^\d{1,2}(?:\.\d)?$/.test(hints.experienceYears)
      ) {
        next.totalYearsExperience = hints.experienceYears;
        filled.add("totalYearsExperience");
      }
      // Education parse is too noisy — leave Academic Details empty for the candidate.
      return next;
    });
    setAutoFilled(filled);
  };

  const submit = () => {
    if (submittingRef.current) return;

    const all: Errors = {
      ...validateStep(0),
      ...validateStep(1),
      ...validateStep(2),
    };
    if (Object.keys(all).length > 0) {
      for (let i = 0; i < STEPS.length - 1; i++) {
        if (Object.keys(validateStep(i)).length > 0) {
          goTo(i);
          break;
        }
      }
      blockWithErrors(all);
      return;
    }

    const totalBytes = [
      files.resume,
      files.passportCopy,
      files.photograph,
      files.appointmentLetter,
      files.relievingLetter,
      files.latestPayslip,
      ...files.educationDocs,
    ].reduce((n, f) => n + (f?.size ?? 0), 0);

    if (totalBytes > MAX_TOTAL_ATTACHMENT_BYTES) {
      const lim = "4.5";
      const tot = (totalBytes / (1024 * 1024)).toFixed(1);
      goTo(2);
      blockWithErrors({
        _form: `Files total ${tot} MB — over the ${lim} MB limit. Remove optional docs or reduce file sizes.`,
      });
      return;
    }

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    const phoneE164 = toE164(
      countryCode,
      values.phone,
      COUNTRY_CODES.find((c) => c.value === countryCode)?.digits,
    );

    const body = new FormData();
    body.append("fullName", fullName);
    body.append("candidateName", fullName);
    body.append("phone", phoneE164);

    // API expects exactly three org slots; pad extras with Not Applicable.
    body.append(
      "currentOrg",
      JSON.stringify(tenureOnly(orgs[0] ?? emptyOrg())),
    );
    body.append(
      "previousOrg1",
      JSON.stringify(orgs[1] ? tenureOnly(orgs[1]) : naOrg()),
    );
    body.append(
      "previousOrg2",
      JSON.stringify(orgs[2] ? tenureOnly(orgs[2]) : naOrg()),
    );

    const flat: Array<keyof ApplicationFields> = [
      "email",
      "appliedDesignation",
      "totalYearsExperience",
      "reportsTo",
      "teamSize",
      "currentLocation",
      "familyDetails",
      "currentCtc",
      "expectedCtc",
      "noticePeriod",
      "passportNumber",
      "drivingLicense",
      "position",
      "experience",
      "location",
      "jobSlug",
      "jobId",
    ];
    for (const k of flat) {
      if (k === "experience") {
        body.append(k, values.totalYearsExperience);
        continue;
      }
      if (k === "location") {
        body.append(k, values.currentLocation);
        continue;
      }
      body.append(k, String(values[k] ?? ""));
    }

    // API still expects legacy qualification fields — derive from Academic Details.
    const edu0 = values.educationEntries[0];
    const edu1 = values.educationEntries[1] ?? edu0;
    body.append("graduation", edu0?.name ?? "");
    body.append("graduationYear", edu0?.year ?? "");
    body.append("professionalQualification", edu1?.name ?? "");
    body.append("professionalQualificationYear", edu1?.year ?? "");

    body.append("certifications", JSON.stringify([{ name: "", year: "" }]));
    body.append("educationEntries", JSON.stringify(values.educationEntries));
    body.append("applicationDate", toDMY(values.applicationDate));
    body.append("dateOfBirth", toDMY(values.dateOfBirth));
    body.append("passportValidity", toDMY(values.passportValidity));

    if (files.resume) body.append("resume", files.resume);
    for (const d of files.educationDocs) {
      if (d) body.append("educationalCertificates", d);
    }
    if (files.passportCopy) body.append("passportCopy", files.passportCopy);
    if (files.photograph) body.append("photograph", files.photograph);
    if (files.appointmentLetter)
      body.append("appointmentLetter", files.appointmentLetter);
    if (files.relievingLetter)
      body.append("relievingLetter", files.relievingLetter);
    if (files.latestPayslip) body.append("latestPayslip", files.latestPayslip);
    files.educationDocs.forEach((f, i) => {
      if (f) body.append(`educationDoc_${i}`, f);
    });

    submittingRef.current = true;
    setSubmitState("submitting");
    setProgress(0);
    setSubmitError("");

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${publicApiBase()}/api/careers/apply`);
    xhr.timeout = 120_000;
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable)
        setProgress(Math.round((ev.loaded / ev.total) * 100));
    };
    xhr.onload = () => {
      submittingRef.current = false;
      if (xhr.status >= 200 && xhr.status < 300) {
        setSubmitState("success");
        scrollTop();
        return;
      }
      let msg = "Something went wrong. Please try again.";
      let serverErrors: Errors | undefined;
      try {
        const data = JSON.parse(xhr.responseText);
        // Temporary server debug field from careers/apply 502 path.
        if (data.debug) msg = `${data.error ?? msg} (${data.debug})`;
        else if (data.error) msg = data.error;
        if (data.errors && typeof data.errors === "object") {
          serverErrors = data.errors as Errors;
          const fieldMessages = Object.entries(serverErrors)
            .filter(([k]) => k !== "_form")
            .map(([, v]) => v)
            .filter(Boolean);
          const formMsg = (serverErrors._form as string | undefined) ?? "";
          if (fieldMessages.length > 0) {
            msg = formatApplySubmitErrors(
              fieldMessages.map(String),
              formMsg,
            );
          } else if (formMsg) {
            msg = formMsg;
          }
        }
      } catch {
        /* keep default */
      }
      if (serverErrors) setErrors((p) => ({ ...p, ...serverErrors }));
      setSubmitState("error");
      setSubmitError(msg);
    };
    xhr.onerror = () => {
      submittingRef.current = false;
      setSubmitState("error");
      setSubmitError("Network error — your details are safe. Please retry.");
    };
    xhr.ontimeout = () => {
      submittingRef.current = false;
      setSubmitState("error");
      setSubmitError(
        "The request timed out — your details are safe. Please try again.",
      );
    };
    xhr.send(body);
  };

  const pct = useMemo(
    () => Math.round(((step + 1) / STEPS.length) * 100),
    [step],
  );
  const selectedCountry = COUNTRY_CODES.find((c) => c.value === countryCode);

  if (submitState === "success") {
    return (
      <div className="aptus-apply__panel aptus-apply__result">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="#047857"
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M8 12l3 3 5-6" />
        </svg>
        <h2>Application submitted!</h2>
        <p className="aptus-apply__hint">
          Thank you, <strong>{firstName || values.candidateName}</strong>. Your
          application for <strong>{job.title}</strong> has been received. Our HR
          team will review it and reach out at <strong>{values.email}</strong>.
        </p>
        <div className="mt-4 flex justify-center gap-3">
          <Button href="/careers" variant="secondary">
            Browse more roles
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div ref={topRef}>
      <div className="aptus-apply__steps" role="tablist" aria-label="Application steps">
        {STEPS.map((s, i) => (
          <button
            key={s.key}
            type="button"
            className="aptus-apply__step"
            data-state={i === step ? "active" : i < maxStep ? "done" : undefined}
            aria-current={i === step ? "step" : undefined}
            onClick={() => i <= maxStep && goTo(i)}
          >
            Step {i + 1}
            <small>{s.label}</small>
          </button>
        ))}
      </div>
      <div
        className="aptus-apply__progress"
        role="progressbar"
        aria-valuenow={step + 1}
        aria-valuemin={1}
        aria-valuemax={STEPS.length}
        aria-label={`Step ${step + 1} of ${STEPS.length}`}
      >
        <div style={{ width: `${pct}%` }} />
      </div>

      <div className="aptus-apply__panel" onBlur={handleBlur}>
        {showSummary && Object.values(errors).some(Boolean) && (
          <div
            ref={summaryRef}
            className="aptus-banner aptus-banner--error"
            role="alert"
            tabIndex={-1}
          >
            <strong>{APPLY_STEP_ERROR_HEADING}</strong>
            <ul className="mt-1 list-disc pl-5">
              {[...new Set(Object.values(errors).filter(Boolean))]
                .slice(0, 6)
                .map((msg, i) => (
                  <li key={i}>{msg}</li>
                ))}
            </ul>
          </div>
        )}

        {STEPS[step].key === "basics" && (
          <>
            <h2>Your Details</h2>
            <p className="aptus-apply__hint">
              Upload your resume first — we&apos;ll try to fill in the fields
              automatically.
            </p>

            <div style={{ marginBottom: "1.5rem" }}>
              <FileDropzone
                accept={RESUME_ACCEPT}
                label="Resume (PDF, DOC, DOCX · max 0.8 MB)"
                files={files.resume ? [files.resume] : []}
                error={errors.resume}
                onChange={handleResume}
                validate={(f) => {
                  const e = validateFile(f, RESUME_EXTENSIONS, "Resume", true);
                  if (e) return e;
                  if (f.size > MAX_UPLOAD_BYTES)
                    return "Resume must be under 0.8 MB (800 KB).";
                  return null;
                }}
              />
              {parsing && (
                <p
                  className="aptus-apply__hint"
                  aria-live="polite"
                  style={{ marginTop: "0.5rem" }}
                >
                  Reading your resume…
                </p>
              )}
              {parseNote && (
                <div
                  className="aptus-banner aptus-banner--success"
                  role="status"
                  style={{ marginTop: "0.75rem" }}
                >
                  {parseNote}
                </div>
              )}
              {autoFilled.size > 0 && !parsing && (
                <p
                  className="aptus-apply__hint"
                  style={{ marginTop: "0.5rem", color: "#047857" }}
                >
                  We pre-filled some fields from your resume — check them below.
                </p>
              )}
            </div>

            <div className="aptus-apply__grid aptus-apply__grid--2">
              <TextField
                id="firstName"
                label="First Name"
                required
                value={firstName}
                autoFilled={autoFilled.has("firstName")}
                error={errors.firstName}
                onChange={(v) => {
                  setFirstName(v);
                  const full = `${v.trim()} ${lastName.trim()}`.trim();
                  setValue("fullName", full);
                  setValue("candidateName", full);
                  if (errors.firstName)
                    setErrors((p) => ({ ...p, firstName: "" }));
                  if (autoFilled.has("firstName")) {
                    setAutoFilled((p) => {
                      const n = new Set(p);
                      n.delete("firstName");
                      return n;
                    });
                  }
                }}
              />
              <TextField
                id="lastName"
                label="Last Name"
                required
                value={lastName}
                autoFilled={autoFilled.has("lastName")}
                error={errors.lastName}
                onChange={(v) => {
                  setLastName(v);
                  const full = `${firstName.trim()} ${v.trim()}`.trim();
                  setValue("fullName", full);
                  setValue("candidateName", full);
                  if (errors.lastName)
                    setErrors((p) => ({ ...p, lastName: "" }));
                  if (autoFilled.has("lastName")) {
                    setAutoFilled((p) => {
                      const n = new Set(p);
                      n.delete("lastName");
                      return n;
                    });
                  }
                }}
              />

              <div className="sm:col-span-2">
                <TextField
                  id="email"
                  label="Email Address"
                  type="email"
                  inputMode="email"
                  required
                  placeholder="you@example.com"
                  help="Use a personal or work email — disposable addresses are blocked."
                  value={values.email}
                  autoFilled={autoFilled.has("email")}
                  error={errors.email}
                  onChange={(v) => setValue("email", v)}
                />
              </div>

              <div className="sm:col-span-2">
                <div
                  className="aptus-field"
                  data-invalid={errors.phone ? "true" : undefined}
                  data-autofilled={autoFilled.has("phone") ? "true" : undefined}
                >
                  <label htmlFor="phone">
                    Phone Number <span aria-hidden="true">*</span>
                  </label>
                  {autoFilled.has("phone") && (
                    <span className="aptus-field__badge" title="Pre-filled from your resume">
                      Auto-filled — review
                    </span>
                  )}
                  <div className="aptus-apply__phone">
                    <select
                      id="countryCode"
                      value={countryCode}
                      onChange={(e) => {
                        setCountryCode(e.target.value);
                        setValue("phone", "");
                        setErrors((p) => ({ ...p, phone: "" }));
                      }}
                      aria-label="Country code"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    <input
                      id="phone"
                      type="tel"
                      inputMode="tel"
                      placeholder={
                        selectedCountry
                          ? `${selectedCountry.digits}-digit number`
                          : "Phone number"
                      }
                      value={values.phone}
                      aria-invalid={errors.phone ? true : undefined}
                      onChange={(e) =>
                        setValue(
                          "phone",
                          toLocalPhoneDigits(
                            e.target.value,
                            countryCode,
                            selectedCountry?.digits,
                          ),
                        )
                      }
                    />
                  </div>
                  {errors.phone && (
                    <p className="aptus-field__error" role="alert">
                      {errors.phone}
                    </p>
                  )}
                  {selectedCountry && !errors.phone && (
                    <p className="aptus-field__help">
                      Enter {selectedCountry.digits} digits — no country code
                      prefix needed
                    </p>
                  )}
                </div>
              </div>

              <TextField
                id="currentLocation"
                label="Current Location"
                required
                placeholder="City, Country"
                value={values.currentLocation}
                error={errors.currentLocation}
                onChange={(v) => setValue("currentLocation", v)}
              />

              <DateField
                id="dateOfBirth"
                label="Date of Birth"
                required
                value={values.dateOfBirth}
                error={errors.dateOfBirth}
                onChange={(v) => setValue("dateOfBirth", v)}
              />
            </div>
          </>
        )}

        {STEPS[step].key === "experience" && (
          <>
            <h2>Professional Experience</h2>
            <p className="aptus-apply__hint">
              Add your current role. Use &quot;Not Applicable&quot; if you&apos;re
              a fresher. Click <strong>+ Add Organization</strong> only if you
              have previous experience to add.
            </p>

            {orgs.map((org, i) => (
              <OrgBlock
                key={org.id}
                index={i}
                org={org}
                errors={errors}
                onChange={(patch) => updateOrg(i, patch)}
                onRemove={i > 0 ? () => removeOrg(i) : undefined}
              />
            ))}

            <button
              type="button"
              className="aptus-add-btn"
              onClick={addOrg}
              style={{ marginBottom: "1.5rem" }}
            >
              + Add Organization
            </button>

            <fieldset className="aptus-apply__group">
              <legend>Academic Details</legend>
              <p className="aptus-apply__hint">
                Add at least one qualification. Supporting documents are optional.
              </p>
              {values.educationEntries.map((e, i) => (
                <div key={i} className="aptus-repeat-entry">
                  {values.educationEntries.length > 1 && (
                    <button
                      type="button"
                      className="aptus-repeat-remove"
                      aria-label="Remove entry"
                      onClick={() => removeEducation(i)}
                    >
                      ✕
                    </button>
                  )}
                  <div className="aptus-apply__grid aptus-apply__grid--3">
                    <TextField
                      id={`edu-name-${i}`}
                      label="Qualification"
                      required
                      value={e.name}
                      error={errors[`educationEntries.${i}.name`]}
                      onChange={(v) => updateEducation(i, { name: v })}
                    />
                    <TextField
                      id={`edu-inst-${i}`}
                      label="Institution"
                      required
                      value={e.institution}
                      error={errors[`educationEntries.${i}.institution`]}
                      onChange={(v) => updateEducation(i, { institution: v })}
                    />
                    <TextField
                      id={`edu-year-${i}`}
                      label="Year"
                      inputMode="numeric"
                      required
                      value={e.year}
                      error={errors[`educationEntries.${i}.year`]}
                      onChange={(v) => updateEducation(i, { year: v })}
                    />
                  </div>
                  <FileDropzone
                    accept={`${DOC_ACCEPT},${IMAGE_ACCEPT}`}
                    label="Supporting document"
                    files={
                      files.educationDocs[i]
                        ? [files.educationDocs[i] as File]
                        : []
                    }
                    error={errors[`educationDoc_${i}`]}
                    onChange={(list) => {
                      const updated = files.educationDocs.map((d, idx) =>
                        idx === i ? list[0] ?? null : d,
                      );
                      setFiles((p) => ({ ...p, educationDocs: updated }));
                      checkTotalAfterChange({ educationDocs: updated });
                      clearFileError(`educationDoc_${i}`);
                    }}
                    validate={(f) =>
                      f.size > MAX_UPLOAD_BYTES
                        ? "Each file must be under 0.8 MB (800 KB)."
                        : null
                    }
                  />
                </div>
              ))}
              <button type="button" className="aptus-add-btn" onClick={addEducation}>
                + Add Academic Details
              </button>
            </fieldset>

            <fieldset className="aptus-apply__group">
              <legend>Present Team Structure</legend>
              <p className="aptus-field__help">{NA_HELPER}</p>
              <div className="aptus-apply__grid aptus-apply__grid--2">
                <TextField
                  id="reportsTo"
                  label="Reports To"
                  required
                  value={values.reportsTo}
                  error={errors.reportsTo}
                  onChange={(v) => setValue("reportsTo", v)}
                />
                <DateField
                  id="applicationDate"
                  label="Date of Application"
                  required
                  value={toDMY(values.applicationDate)}
                  error={errors.applicationDate}
                  onChange={(v) => setValue("applicationDate", v)}
                />
                <TextField
                  id="teamSize"
                  label="Team Size"
                  inputMode="numeric"
                  required
                  value={values.teamSize}
                  error={errors.teamSize}
                  onChange={(v) => setValue("teamSize", v)}
                />
                <TextField
                  id="totalYearsExperience"
                  label="Total Years of Experience"
                  inputMode="numeric"
                  required
                  placeholder="e.g. 5 or 2.5"
                  value={values.totalYearsExperience}
                  autoFilled={autoFilled.has("totalYearsExperience")}
                  error={errors.totalYearsExperience}
                  onChange={(v) => setValue("totalYearsExperience", v)}
                />
                <TextField
                  id="currentCtc"
                  label="Current CTC (OMR)"
                  inputMode="numeric"
                  required
                  value={values.currentCtc}
                  error={errors.currentCtc}
                  onChange={(v) => setValue("currentCtc", v)}
                />
                <TextField
                  id="expectedCtc"
                  label="Expected CTC (OMR)"
                  inputMode="numeric"
                  required
                  value={values.expectedCtc}
                  error={errors.expectedCtc}
                  onChange={(v) => setValue("expectedCtc", v)}
                />
                <TextField
                  id="passportNumber"
                  label="Passport Number"
                  required
                  placeholder="e.g. A12345678"
                  help="6–15 uppercase letters and digits, no spaces (ICAO standard)."
                  value={values.passportNumber}
                  error={errors.passportNumber}
                  onChange={(v) => setValue("passportNumber", v.toUpperCase())}
                />
                <DateField
                  id="passportValidity"
                  label="Passport Validity"
                  required
                  value={values.passportValidity}
                  error={errors.passportValidity}
                  onChange={(v) => setValue("passportValidity", v)}
                />
                <SelectField
                  id="noticePeriod"
                  label="Notice Period"
                  required
                  options={NOTICE_PERIOD_OPTIONS}
                  value={values.noticePeriod}
                  error={errors.noticePeriod}
                  onChange={(v) => setValue("noticePeriod", v)}
                />
                <TextField
                  id="drivingLicense"
                  label="Driving License"
                  placeholder="Optional"
                  value={values.drivingLicense}
                  error={errors.drivingLicense}
                  onChange={(v) => setValue("drivingLicense", v)}
                />
              </div>
              <TextAreaField
                id="familyDetails"
                label="Family Details (optional)"
                className="mt-4"
                value={values.familyDetails}
                error={errors.familyDetails}
                onChange={(v) => setValue("familyDetails", v)}
              />
            </fieldset>
          </>
        )}

        {STEPS[step].key === "documents" && (
          <>
            <h2>Documents</h2>
            <p className="aptus-apply__hint">
              Max 0.8 MB (800 KB) per file. All uploads are optional.
            </p>

            <div style={{ marginBottom: "0.75rem" }}>
              <FileDropzone
                accept={IMAGE_ACCEPT}
                label="Passport-size Photograph"
                preview
                hint="JPG, PNG or WEBP · up to 0.8 MB (800 KB)"
                files={files.photograph ? [files.photograph] : []}
                error={errors.photograph}
                onChange={(list) => {
                  const photograph = list[0] ?? null;
                  setFiles((p) => ({ ...p, photograph }));
                  checkTotalAfterChange({ photograph });
                  clearFileError("photograph");
                }}
                validate={(f) => validateImageFile(f, "Photograph", false)}
              />
            </div>

            {(
              [
                ["passportCopy", "Passport Copy"],
                ["latestPayslip", "Payslip"],
                ["appointmentLetter", "Appointment Letter"],
                ["relievingLetter", "Relieving Letter"],
              ] as Array<[keyof FileState, string]>
            ).map(([key, label]) => (
              <div key={key} style={{ marginBottom: "0.75rem" }}>
                <FileDropzone
                  accept={`${DOC_ACCEPT},${IMAGE_ACCEPT}`}
                  label={label}
                  files={
                    (files[key] as File | null) ? [files[key] as File] : []
                  }
                  error={errors[key]}
                  onChange={(list) => {
                    const next = list[0] ?? null;
                    const update = { [key]: next } as Partial<FileState>;
                    setFiles((p) => ({ ...p, ...update }));
                    checkTotalAfterChange(update);
                    clearFileError(key);
                  }}
                  validate={(f) =>
                    f.size > MAX_UPLOAD_BYTES
                      ? "Each file must be under 0.8 MB (800 KB)."
                      : null
                  }
                />
              </div>
            ))}
          </>
        )}

        {STEPS[step].key === "review" && (
          <ReviewStep
            firstName={firstName}
            lastName={lastName}
            countryCode={countryCode}
            orgs={orgs}
            values={values}
            files={files}
            onEdit={goTo}
          />
        )}

        {submitState === "submitting" && (
          <div className="mt-4" aria-live="polite">
            <div className="aptus-fileprogress">
              <div style={{ width: `${progress}%` }} />
            </div>
            <p className="aptus-apply__hint" style={{ textAlign: "center" }}>
              Submitting… {progress}%
            </p>
          </div>
        )}
        {submitState === "error" && submitError && (
          <div className="aptus-banner aptus-banner--error" role="alert">
            {submitError}
          </div>
        )}
      </div>

      <div className="aptus-apply__nav">
        <Button
          type="button"
          variant="ghost"
          onClick={back}
          className={cn(step === 0 && "invisible")}
        >
          Back
        </Button>
        {STEPS[step].key === "review" ? (
          <Button
            type="button"
            onClick={submit}
            disabled={submitState === "submitting"}
          >
            {submitState === "submitting"
              ? "Submitting…"
              : "Submit Application"}
          </Button>
        ) : (
          <Button type="button" onClick={next}>
            Continue
          </Button>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="aptus-review-row">
      <dt>{label}</dt>
      <dd>{value || "—"}</dd>
    </div>
  );
}

function ReviewStep({
  firstName,
  lastName,
  countryCode,
  orgs,
  values,
  files,
  onEdit,
}: {
  firstName: string;
  lastName: string;
  countryCode: string;
  orgs: OrgEntry[];
  values: ApplicationFields;
  files: FileState;
  onEdit: (step: number) => void;
}) {
  const fileName = (f: File | null) => (f ? f.name : "—");
  const country = COUNTRY_CODES.find((c) => c.value === countryCode);

  return (
    <>
      <h2>Review &amp; Submit</h2>
      <p className="aptus-apply__hint">
        Check your details before submitting. Use Edit to go back.
      </p>

      <div className="aptus-review-group">
        <div className="aptus-review-group__head">
          <h3>Personal Information</h3>
          <button type="button" onClick={() => onEdit(0)}>
            Edit
          </button>
        </div>
        <dl>
          <Row label="Name" value={`${firstName} ${lastName}`.trim()} />
          <Row label="Email" value={values.email} />
          <Row
            label="Phone"
            value={`${countryCode} ${values.phone}${country ? ` (${country.label.split(" ")[1]})` : ""}`}
          />
          <Row label="Location" value={values.currentLocation} />
          <Row label="Date of Birth" value={values.dateOfBirth} />
        </dl>
      </div>

      <div className="aptus-review-group">
        <div className="aptus-review-group__head">
          <h3>Experience</h3>
          <button type="button" onClick={() => onEdit(1)}>
            Edit
          </button>
        </div>
        <dl>
          {orgs.map((org, i) => (
            <Row
              key={org.id}
              label={
                i === 0 ? "Current Organization" : `Previous Organization ${i}`
              }
              value={`${org.name} — ${org.designation} (${org.duration})`}
            />
          ))}
          <Row label="Total Experience" value={values.totalYearsExperience} />
          <Row label="Reports To" value={values.reportsTo} />
          <Row label="Team Size" value={values.teamSize} />
          <Row label="Notice Period" value={values.noticePeriod} />
          <Row
            label="Current / Expected CTC (OMR)"
            value={`${values.currentCtc} / ${values.expectedCtc}`}
          />
          <Row label="Passport Number" value={values.passportNumber} />
          <Row label="Passport Validity" value={values.passportValidity} />
        </dl>
      </div>

      <div className="aptus-review-group">
        <div className="aptus-review-group__head">
          <h3>Education &amp; Documents</h3>
          <button type="button" onClick={() => onEdit(1)}>
            Edit
          </button>
        </div>
        <dl>
          <Row
            label="Education"
            value={
              values.educationEntries
                .filter((e) => e.name)
                .map((e) => `${e.name} — ${e.institution} (${e.year})`)
                .join("; ") || "—"
            }
          />
          <Row label="Resume" value={fileName(files.resume)} />
          <Row label="Passport Copy" value={fileName(files.passportCopy)} />
          <Row label="Photograph" value={fileName(files.photograph)} />
          <Row label="Payslip" value={fileName(files.latestPayslip)} />
          <Row
            label="Appointment Letter"
            value={fileName(files.appointmentLetter)}
          />
          <Row
            label="Relieving Letter"
            value={fileName(files.relievingLetter)}
          />
        </dl>
      </div>
    </>
  );
}
