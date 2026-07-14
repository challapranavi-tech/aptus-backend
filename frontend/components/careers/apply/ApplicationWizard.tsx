"use client";

import { publicApiBase } from "@/lib/api-base";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  DOC_ACCEPT,
  IMAGE_ACCEPT,
  MAX_TOTAL_ATTACHMENT_BYTES,
  NA_HELPER,
  NOTICE_PERIOD_OPTIONS,
  RESUME_ACCEPT,
  RESUME_EXTENSIONS,
  emptyApplicationFields,
  validateBasic,
  validateEducation,
  validateFile,
  validateImageFile,
  validatePreInterview,
  type ApplicationFields,
  type EducationEntry,
  type NamedYear,
  type OrgTenure,
} from "@shared/lib/careers-application";
import type { CareerJob } from "@shared/lib/career-jobs";
import type { ResumeHints } from "@shared/lib/resume-parse";
import { useMemo, useRef, useState } from "react";
import { FileDropzone } from "./FileDropzone";
import { SelectField, TextAreaField, TextField } from "./fields";

const STEPS = [
  { key: "basic", label: "Basic Info", sub: "Your details" },
  { key: "resume", label: "Resume", sub: "Upload & auto-fill" },
  { key: "pre", label: "Pre-Interview", sub: "Background" },
  { key: "education", label: "Education", sub: "Qualifications" },
  { key: "attachments", label: "Attachments", sub: "Documents" },
  { key: "review", label: "Review", sub: "Submit" },
] as const;

interface FileState {
  resume: File | null;
  educationalCertificates: File[];
  passportCopy: File | null;
  photograph: File | null;
  appointmentLetter: File | null;
  relievingLetter: File | null;
  latestPayslip: File | null;
  educationDocs: (File | null)[];
}

const EMPTY_FILES: FileState = {
  resume: null,
  educationalCertificates: [],
  passportCopy: null,
  photograph: null,
  appointmentLetter: null,
  relievingLetter: null,
  latestPayslip: null,
  educationDocs: [null],
};

type Errors = Record<string, string>;

export function ApplicationWizard({ job }: { job: CareerJob }) {
  const [step, setStep] = useState(0);
  const [maxStep, setMaxStep] = useState(0);
  const [values, setValues] = useState<ApplicationFields>(() =>
    emptyApplicationFields({
      appliedDesignation: job.title,
      position: job.title,
      jobSlug: job.slug,
      jobId: job.id,
    }),
  );
  const [files, setFiles] = useState<FileState>(EMPTY_FILES);
  const [autoFilled, setAutoFilled] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Errors>({});
  const [submitState, setSubmitState] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [progress, setProgress] = useState(0);
  const [submitError, setSubmitError] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);

  const setValue = (key: keyof ApplicationFields, v: string) => {
    setValues((prev) => ({ ...prev, [key]: v }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
    if (autoFilled.has(key)) {
      setAutoFilled((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  const setOrg = (
    key: "currentOrg" | "previousOrg1" | "previousOrg2",
    patch: Partial<OrgTenure>,
  ) => {
    setValues((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  };

  const validateStep = (index: number): Errors => {
    switch (STEPS[index].key) {
      case "basic":
        return validateBasic(values);
      case "resume": {
        const e = validateFile(files.resume, RESUME_EXTENSIONS, "Resume", true);
        return e ? { resume: e } : {};
      }
      case "pre":
        return validatePreInterview(values);
      case "education": {
        const errs = validateEducation(values);
        if (!files.educationDocs[0]) {
          errs.educationDoc_0 = "Supporting document is required.";
        }
        return errs;
      }
      case "attachments": {
        const errs: Errors = {};
        if (files.educationalCertificates.length === 0)
          errs.educationalCertificates = "Upload at least one educational certificate.";
        if (!files.passportCopy)
          errs.passportCopy = "Passport copy is required.";
        const photoErr = validateImageFile(files.photograph, "Photograph", true);
        if (photoErr) errs.photograph = photoErr;
        return errs;
      }
      default:
        return {};
    }
  };

  const scrollTop = () =>
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const goTo = (index: number) => {
    setStep(index);
    setMaxStep((m) => Math.max(m, index));
    setShowSummary(false);
    scrollTop();
  };

  // Real-time validation: on blur, re-check the current step and surface the
  // error for just the blurred scalar field (field id === error key). Nested
  // groups (org/cert/education) validate on Continue.
  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    const id = (e.target as HTMLElement).id;
    if (!id) return;
    const stepErrors = validateStep(step);
    if (id in stepErrors || errors[id]) {
      setErrors((prev) => ({ ...prev, [id]: stepErrors[id] ?? "" }));
    }
  };

  const blockWithErrors = (e: Errors) => {
    setErrors(e);
    setShowSummary(true);
    scrollTop();
    // Move focus to the summary so screen readers announce the failure.
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

  const back = () => goTo(Math.max(step - 1, 0));

  // ── Resume auto-fill ──────────────────────────────────────────────────
  const [parsing, setParsing] = useState(false);
  const [parseNote, setParseNote] = useState<string | null>(null);

  const handleResume = async (list: File[]) => {
    const file = list[0] ?? null;
    setFiles((p) => ({ ...p, resume: file }));
    setErrors((p) => ({ ...p, resume: "" }));
    if (!file) return;
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
        // Auto-fill is best-effort; apply silently rather than promise a result.
        applyHints(hints);
        setParseNote(null);
      } else {
        setParseNote(
          "We couldn't read details automatically — no problem, just fill the fields manually.",
        );
      }
    } catch {
      setParseNote(
        "Auto-fill is unavailable right now — please continue and fill the fields manually.",
      );
    } finally {
      setParsing(false);
    }
  };

  const applyHints = (hints: ResumeHints) => {
    const filled = new Set(autoFilled);
    setValues((prev) => {
      const nextV = { ...prev };
      if (hints.fullName && !prev.fullName) {
        nextV.fullName = hints.fullName;
        nextV.candidateName = hints.fullName;
        filled.add("fullName");
        filled.add("candidateName");
      }
      if (hints.email && !prev.email) {
        nextV.email = hints.email;
        filled.add("email");
      }
      if (hints.phone && !prev.phone) {
        nextV.phone = hints.phone;
        filled.add("phone");
      }
      if (hints.experienceYears && !prev.totalYearsExperience) {
        nextV.totalYearsExperience = hints.experienceYears;
        filled.add("totalYearsExperience");
      }
      // Prefer a single auto-fill entry; extras stay available via "+ Add".
      if (hints.education?.length && prev.educationEntries.every((x) => !x.name)) {
        const e = hints.education[0];
        nextV.educationEntries = [
          {
            name: e.name,
            institution: e.institution ?? "",
            year: e.year ?? "",
          },
        ];
        filled.add("educationEntries");
      }
      return nextV;
    });
    setAutoFilled(filled);
  };

  // ── Education entries (Step D — at least one; can add more) ───────────
  const updateEducation = (i: number, patch: Partial<EducationEntry>) => {
    setValues((prev) => {
      const list = prev.educationEntries.map((e, idx) =>
        idx === i ? { ...e, ...patch } : e,
      );
      return { ...prev, educationEntries: list };
    });
    setErrors((p) => ({
      ...p,
      educationEntries: "",
      [`educationEntries.${i}.name`]: "",
      [`educationEntries.${i}.institution`]: "",
      [`educationEntries.${i}.year`]: "",
      ...(i === 0 ? { educationDoc_0: "" } : {}),
    }));
  };
  const addEducation = () => {
    setValues((prev) => ({
      ...prev,
      educationEntries: [...prev.educationEntries, { name: "", institution: "", year: "" }],
    }));
    setFiles((p) => ({ ...p, educationDocs: [...p.educationDocs, null] }));
  };
  const removeEducation = (i: number) => {
    // Keep at least one entry.
    if (values.educationEntries.length <= 1) return;
    setValues((prev) => ({
      ...prev,
      educationEntries: prev.educationEntries.filter((_, idx) => idx !== i),
    }));
    setFiles((p) => ({
      ...p,
      educationDocs: p.educationDocs.filter((_, idx) => idx !== i),
    }));
  };

  // ── Certifications (Step C) ───────────────────────────────────────────
  const updateCert = (i: number, patch: Partial<NamedYear>) => {
    setValues((prev) => ({
      ...prev,
      certifications: prev.certifications.map((c, idx) =>
        idx === i ? { ...c, ...patch } : c,
      ),
    }));
  };
  const addCert = () =>
    setValues((prev) => ({
      ...prev,
      certifications: [...prev.certifications, { name: "", year: "" }],
    }));
  const removeCert = (i: number) =>
    setValues((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((_, idx) => idx !== i),
    }));

  // ── Submit (Step F) ───────────────────────────────────────────────────
  const submit = () => {
    // Re-validate every gated step before final submission.
    const all: Errors = {
      ...validateStep(0),
      ...validateStep(1),
      ...validateStep(2),
      ...validateStep(3),
      ...validateStep(4),
    };
    if (Object.keys(all).length > 0) {
      // jump to the earliest failing step, then surface its summary
      for (let i = 0; i < STEPS.length; i++) {
        if (Object.keys(validateStep(i)).length > 0) {
          goTo(i);
          break;
        }
      }
      blockWithErrors(all);
      return;
    }

    // Mirror the server's total-attachment cap so oversized submissions fail
    // fast with a clear message instead of a slow upload ending in a 413.
    const totalUploadBytes = [
      files.resume,
      ...files.educationalCertificates,
      files.passportCopy,
      files.photograph,
      files.appointmentLetter,
      files.relievingLetter,
      files.latestPayslip,
      ...files.educationDocs,
    ].reduce((n, f) => n + (f?.size ?? 0), 0);
    if (totalUploadBytes > MAX_TOTAL_ATTACHMENT_BYTES) {
      const limitMb = Math.floor(MAX_TOTAL_ATTACHMENT_BYTES / (1024 * 1024));
      const totalMb = (totalUploadBytes / (1024 * 1024)).toFixed(1);
      goTo(4);
      blockWithErrors({
        _form: `Your files total ${totalMb} MB, over the ${limitMb} MB limit. Please reduce file sizes or remove optional documents and try again.`,
      });
      return;
    }

    const body = new FormData();
    const flat: Array<keyof ApplicationFields> = [
      "fullName", "email", "phone", "applicationDate",
      "appliedDesignation", "candidateName", "totalYearsExperience", "dateOfBirth",
      "professionalQualification", "professionalQualificationYear", "graduation",
      "graduationYear", "reportsTo", "teamSize", "currentLocation", "familyDetails",
      "currentCtc", "expectedCtc", "noticePeriod", "passportNumber",
      "passportValidity", "drivingLicense", "position", "experience", "location",
      "jobSlug", "jobId",
    ];
    for (const k of flat) body.append(k, String(values[k] ?? ""));
    body.append("currentOrg", JSON.stringify(values.currentOrg));
    body.append("previousOrg1", JSON.stringify(values.previousOrg1));
    body.append("previousOrg2", JSON.stringify(values.previousOrg2));
    body.append("certifications", JSON.stringify(values.certifications));
    body.append("educationEntries", JSON.stringify(values.educationEntries));

    if (files.resume) body.append("resume", files.resume);
    for (const c of files.educationalCertificates)
      body.append("educationalCertificates", c);
    if (files.passportCopy) body.append("passportCopy", files.passportCopy);
    if (files.photograph) body.append("photograph", files.photograph);
    if (files.appointmentLetter) body.append("appointmentLetter", files.appointmentLetter);
    if (files.relievingLetter) body.append("relievingLetter", files.relievingLetter);
    if (files.latestPayslip) body.append("latestPayslip", files.latestPayslip);
    files.educationDocs.forEach((f, i) => {
      if (f) body.append(`educationDoc_${i}`, f);
    });

    setSubmitState("submitting");
    setProgress(0);
    setSubmitError("");

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${publicApiBase()}/api/careers/apply`);
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setSubmitState("success");
        scrollTop();
        return;
      }
      let msg = "Something went wrong submitting your application.";
      let serverErrors: Errors | undefined;
      try {
        const data = JSON.parse(xhr.responseText);
        if (data.error) msg = data.error;
        if (data.errors) serverErrors = data.errors;
      } catch {
        /* keep default */
      }
      if (serverErrors) setErrors((p) => ({ ...p, ...serverErrors }));
      setSubmitState("error");
      setSubmitError(msg);
    };
    xhr.onerror = () => {
      setSubmitState("error");
      setSubmitError("Network error. Your details are safe — please retry.");
    };
    xhr.send(body);
  };

  const pct = useMemo(
    () => Math.round(((step + 1) / STEPS.length) * 100),
    [step],
  );

  if (submitState === "success") {
    return (
      <div className="aptus-apply__panel aptus-apply__result">
        <svg viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="2" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 12l3 3 5-6" />
        </svg>
        <h2>Application submitted</h2>
        <p className="aptus-apply__hint">
          Thank you, {values.candidateName || values.fullName}. Your application for{" "}
          <strong>{job.title}</strong> has been received. Our HR team will review it and
          reach out at <strong>{values.email}</strong> with next steps.
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
      {/* Step indicator */}
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
      >
        <div style={{ width: `${pct}%` }} />
      </div>

      <div className="aptus-apply__panel" onBlur={handleBlur}>
        {showSummary && (
          <div
            ref={summaryRef}
            className="aptus-banner aptus-banner--error"
            role="alert"
            tabIndex={-1}
          >
            <strong>Please fix the following before continuing:</strong>
            <ul className="mt-1 list-disc pl-5">
              {[...new Set(Object.values(errors).filter(Boolean))]
                .slice(0, 8)
                .map((msg, i) => (
                  <li key={i}>{msg}</li>
                ))}
            </ul>
          </div>
        )}

        {/* ── Step A ── */}
        {STEPS[step].key === "basic" && (
          <>
            <h2>Basic Information</h2>
            <p className="aptus-apply__hint">Let&apos;s start with how we can reach you.</p>
            <div className="aptus-apply__grid aptus-apply__grid--2">
              <TextField
                id="fullName"
                label="Full Name"
                required
                value={values.fullName}
                autoFilled={autoFilled.has("fullName")}
                error={errors.fullName}
                onChange={(v) => {
                  setValue("fullName", v);
                  setValue("candidateName", v);
                }}
              />
              <TextField
                id="email"
                label="Email"
                type="email"
                inputMode="email"
                required
                placeholder="you@example.com"
                value={values.email}
                autoFilled={autoFilled.has("email")}
                error={errors.email}
                onChange={(v) => setValue("email", v)}
              />
              <TextField
                id="phone"
                label="Phone Number"
                type="tel"
                inputMode="tel"
                required
                placeholder="+968 0000 0000"
                help="Include country code, e.g. +968."
                value={values.phone}
                autoFilled={autoFilled.has("phone")}
                error={errors.phone}
                onChange={(v) => setValue("phone", v)}
              />
            </div>
          </>
        )}

        {/* ── Step B ── */}
        {STEPS[step].key === "resume" && (
          <>
            <h2>Resume Upload</h2>
            <p className="aptus-apply__hint">
              Upload your resume and we&apos;ll try to pre-fill the next steps for you.
            </p>
            <FileDropzone
              accept={RESUME_ACCEPT}
              label="Resume (PDF, DOC, DOCX)"
              files={files.resume ? [files.resume] : []}
              error={errors.resume}
              onChange={handleResume}
              validate={(f) => validateFile(f, RESUME_EXTENSIONS, "Resume", true)}
            />
            {parsing && (
              <p className="aptus-apply__hint" aria-live="polite">
                Reading your resume…
              </p>
            )}
            {parseNote && (
              <div className="aptus-banner aptus-banner--success" role="status">
                {parseNote}
              </div>
            )}
          </>
        )}

        {/* ── Step C ── */}
        {STEPS[step].key === "pre" && (
          <>
            <h2>Pre-Interview Details</h2>
            <p className="aptus-apply__hint">
              Please provide your professional background. Fields marked optional still
              require a value — type &quot;Not Applicable&quot; where relevant.
            </p>

            <div className="aptus-apply__grid aptus-apply__grid--2">
              <TextField
                id="applicationDate"
                label="Date of Application"
                type="date"
                required
                value={values.applicationDate}
                error={errors.applicationDate}
                onChange={(v) => setValue("applicationDate", v)}
              />
              <TextField
                id="appliedDesignation"
                label="Applied Designation"
                required
                value={values.appliedDesignation}
                error={errors.appliedDesignation}
                onChange={(v) => setValue("appliedDesignation", v)}
              />
              <TextField
                id="candidateName"
                label="Name of the Candidate"
                required
                value={values.candidateName}
                autoFilled={autoFilled.has("candidateName")}
                error={errors.candidateName}
                onChange={(v) => setValue("candidateName", v)}
              />
              <TextField
                id="totalYearsExperience"
                label="Total Years of Experience"
                inputMode="numeric"
                required
                value={values.totalYearsExperience}
                autoFilled={autoFilled.has("totalYearsExperience")}
                error={errors.totalYearsExperience}
                onChange={(v) => setValue("totalYearsExperience", v)}
              />
              <TextField
                id="dateOfBirth"
                label="Date of Birth"
                type="date"
                required
                value={values.dateOfBirth}
                error={errors.dateOfBirth}
                onChange={(v) => setValue("dateOfBirth", v)}
              />
            </div>

            {(
              [
                ["currentOrg", "Current Organization"],
                ["previousOrg1", "Immediate Previous Organization"],
                ["previousOrg2", "Previous Organization"],
              ] as Array<["currentOrg" | "previousOrg1" | "previousOrg2", string]>
            ).map(([key, title]) => (
              <fieldset key={key} className="aptus-apply__group">
                <legend>{title}</legend>
                <p className="aptus-field__help">{NA_HELPER}</p>
                <div className="aptus-apply__grid aptus-apply__grid--2">
                  <TextField
                    id={`${key}-name`}
                    label="Organization Name"
                    required
                    value={values[key].name}
                    error={errors[`${title}.name`]}
                    onChange={(v) => setOrg(key, { name: v })}
                  />
                  <TextField
                    id={`${key}-designation`}
                    label="Designation"
                    required
                    value={values[key].designation}
                    error={errors[`${title}.designation`]}
                    onChange={(v) => setOrg(key, { designation: v })}
                  />
                  <TextField
                    id={`${key}-duration`}
                    label="Duration (Year–Year)"
                    placeholder="2020–2024"
                    required
                    value={values[key].duration}
                    error={errors[`${title}.duration`]}
                    onChange={(v) => setOrg(key, { duration: v })}
                  />
                  <TextField
                    id={`${key}-totalYears`}
                    label="Total Years"
                    inputMode="numeric"
                    required
                    value={values[key].totalYears}
                    error={errors[`${title}.totalYears`]}
                    onChange={(v) => setOrg(key, { totalYears: v })}
                  />
                </div>
              </fieldset>
            ))}

            <fieldset className="aptus-apply__group">
              <legend>Qualifications</legend>
              <div className="aptus-apply__grid aptus-apply__grid--2">
                <TextField
                  id="professionalQualification"
                  label="Professional Qualification"
                  required
                  value={values.professionalQualification}
                  error={errors.professionalQualification}
                  onChange={(v) => setValue("professionalQualification", v)}
                />
                <TextField
                  id="professionalQualificationYear"
                  label="Year"
                  inputMode="numeric"
                  required
                  value={values.professionalQualificationYear}
                  error={errors.professionalQualificationYear}
                  onChange={(v) => setValue("professionalQualificationYear", v)}
                />
                <TextField
                  id="graduation"
                  label="Graduation"
                  required
                  value={values.graduation}
                  error={errors.graduation}
                  onChange={(v) => setValue("graduation", v)}
                />
                <TextField
                  id="graduationYear"
                  label="Year"
                  inputMode="numeric"
                  required
                  value={values.graduationYear}
                  error={errors.graduationYear}
                  onChange={(v) => setValue("graduationYear", v)}
                />
              </div>

              <p className="aptus-field__help" style={{ marginTop: "0.75rem" }}>
                Certifications (add up to your relevant ones)
              </p>
              {values.certifications.map((c, i) => (
                <div key={i} className="aptus-repeat-entry">
                  {values.certifications.length > 1 && (
                    <button
                      type="button"
                      className="aptus-repeat-remove"
                      aria-label="Remove certification"
                      onClick={() => removeCert(i)}
                    >
                      ✕
                    </button>
                  )}
                  {/* <div className="aptus-apply__grid aptus-apply__grid--2">
                    <TextField
                      id={`cert-name-${i}`}
                      label="Certification"
                      value={c.name}
                      error={errors[`certifications.${i}.name`]}
                      onChange={(v) => updateCert(i, { name: v })}
                    />
                    <TextField
                      id={`cert-year-${i}`}
                      label="Year"
                      inputMode="numeric"
                      value={c.year}
                      error={errors[`certifications.${i}.year`]}
                      onChange={(v) => updateCert(i, { year: v })}
                    />
                  </div> */}
                </div>
              ))}
              <button type="button" className="aptus-add-btn" onClick={addCert}>
                + Add certification
              </button>
            </fieldset>

            <fieldset className="aptus-apply__group">
              <legend>Present Team Structure</legend>
              <div className="aptus-apply__grid aptus-apply__grid--2">
                <TextField
                  id="reportsTo"
                  label="Reports To"
                  required
                  value={values.reportsTo}
                  error={errors.reportsTo}
                  onChange={(v) => setValue("reportsTo", v)}
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
              </div>
            </fieldset>

            <div className="aptus-apply__grid aptus-apply__grid--2" style={{ marginTop: "1rem" }}>
              { <TextField
                id="currentLocation"
                label="Current Location"
                 required
                value={values.currentLocation}
                error={errors.currentLocation}
                onChange={(v) => setValue("currentLocation", v)}
              /> }
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
                id="currentCtc"
                label="Current CTC"
                inputMode="numeric"
                required
                value={values.currentCtc}
                error={errors.currentCtc}
                onChange={(v) => setValue("currentCtc", v)}
              />
              <TextField
                id="expectedCtc"
                label="Expected CTC"
                inputMode="numeric"
                required
                // help="Payslip is attached separately in Attachments."
                value={values.expectedCtc}
                error={errors.expectedCtc}
                onChange={(v) => setValue("expectedCtc", v)}
              />
              <TextField
                id="passportNumber"
                label="Passport Number"
                required
                value={values.passportNumber}
                error={errors.passportNumber}
                onChange={(v) => setValue("passportNumber", v)}
              />
              <TextField
                id="passportValidity"
                label="Passport Validity "
                placeholder="YYYY-MM-DD "
                required
                value={values.passportValidity}
                error={errors.passportValidity}
                onChange={(v) => setValue("passportValidity", v)}
              />
              <TextField
                id="drivingLicense"
                label="Driving License (optional)"
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
          </>
        )}

        {/* ── Step D ── */}
        {STEPS[step].key === "education" && (
          <>
            <h2>Education &amp; Certifications</h2>
            <p className="aptus-apply__hint">
              Add at least one qualification or certificate. You can attach a supporting
              document for each entry. Extra entries are optional via &quot;+ Add another&quot;.
            </p>
            {errors.educationEntries && (
              <div className="aptus-banner aptus-banner--error" role="alert">
                {errors.educationEntries}
              </div>
            )}
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
                    label="Qualification / Certificate"
                    required
                    value={e.name}
                    autoFilled={i === 0 && autoFilled.has("educationEntries")}
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
                  label={
                    i === 0
                      ? "Supporting document"
                      : "Supporting document (optional)"
                  }
                  files={files.educationDocs[i] ? [files.educationDocs[i] as File] : []}
                  error={i === 0 ? errors.educationDoc_0 : undefined}
                  onChange={(list) =>
                    setFiles((p) => ({
                      ...p,
                      educationDocs: p.educationDocs.map((d, idx) =>
                        idx === i ? list[0] ?? null : d,
                      ),
                    }))
                  }
                />
              </div>
            ))}
            <button type="button" className="aptus-add-btn" onClick={addEducation}>
              + Add another
            </button>
          </>
        )}

        {/* ── Step E ── */}
        {STEPS[step].key === "attachments" && (
          <>
            <h2>Attachments</h2>
            <p className="aptus-apply__hint">Upload the required documents below.</p>

            <fieldset className="aptus-apply__group">
              <legend>Required</legend>
              <FileDropzone
                accept={`${DOC_ACCEPT},${IMAGE_ACCEPT}`}
                label="Educational Certificate(s)"
                multiple
                files={files.educationalCertificates}
                error={errors.educationalCertificates}
                onChange={(list) =>
                  setFiles((p) => ({ ...p, educationalCertificates: list }))
                }
              />

              <div className="mt-4">
                <FileDropzone
                  accept={`${DOC_ACCEPT},${IMAGE_ACCEPT}`}
                  label="Passport Copy"
                  files={files.passportCopy ? [files.passportCopy] : []}
                  error={errors.passportCopy}
                  onChange={(list) =>
                    setFiles((p) => ({ ...p, passportCopy: list[0] ?? null }))
                  }
                />
              </div>

              <div className="mt-4">
                <FileDropzone
                  accept={IMAGE_ACCEPT}
                  label="Passport-size Photograph"
                  preview
                  hint="JPG, PNG or WEBP · up to 5 MB"
                  files={files.photograph ? [files.photograph] : []}
                  error={errors.photograph}
                  onChange={(list) =>
                    setFiles((p) => ({ ...p, photograph: list[0] ?? null }))
                  }
                  validate={(f) => validateImageFile(f, "Photograph", true)}
                />
              </div>
            </fieldset>

            <fieldset className="aptus-apply__group">
              <legend>Optional</legend>
              {(
                [
                  ["appointmentLetter", "Appointment Letter"],
                  ["relievingLetter", "Relieving Letter"],
                  ["latestPayslip", "Latest Payslip"],
                ] as Array<[keyof FileState, string]>
              ).map(([key, label]) => (
                <div key={key} className="mt-3">
                  <FileDropzone
                    accept={`${DOC_ACCEPT},${IMAGE_ACCEPT}`}
                    label={label}
                    files={(files[key] as File | null) ? [files[key] as File] : []}
                    onChange={(list) =>
                      setFiles((p) => ({ ...p, [key]: list[0] ?? null }))
                    }
                  />
                </div>
              ))}
            </fieldset>
          </>
        )}

        {/* ── Step F ── */}
        {STEPS[step].key === "review" && (
          <ReviewStep values={values} files={files} onEdit={goTo} />
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

      {/* Footer nav */}
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
          <Button type="button" onClick={submit} disabled={submitState === "submitting"}>
            {submitState === "submitting" ? "Submitting…" : "Submit Application"}
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

// ── Review step ───────────────────────────────────────────────────────────
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="aptus-review-row">
      <dt>{label}</dt>
      <dd>{value || "—"}</dd>
    </div>
  );
}

function ReviewStep({
  values,
  files,
  onEdit,
}: {
  values: ApplicationFields;
  files: FileState;
  onEdit: (step: number) => void;
}) {
  const fileName = (f: File | null) => (f ? f.name : "—");
  return (
    <>
      <h2>Review &amp; Submit</h2>
      <p className="aptus-apply__hint">
        Please review your details. Use Edit to jump back to any step.
      </p>

      <div className="aptus-review-group">
        <div className="aptus-review-group__head">
          <h3>Basic Information</h3>
          <button type="button" onClick={() => onEdit(0)}>Edit</button>
        </div>
        <dl>
          <Row label="Full Name" value={values.fullName} />
          <Row label="Email" value={values.email} />
          <Row label="Phone" value={values.phone} />
        </dl>
      </div>

      <div className="aptus-review-group">
        <div className="aptus-review-group__head">
          <h3>Pre-Interview</h3>
          <button type="button" onClick={() => onEdit(2)}>Edit</button>
        </div>
        <dl>
          <Row label="Applied Designation" value={values.appliedDesignation} />
          <Row label="Date of Application" value={values.applicationDate} />
          <Row label="Total Experience" value={values.totalYearsExperience} />
          <Row label="Date of Birth" value={values.dateOfBirth} />
          <Row
            label="Current Organization"
            value={`${values.currentOrg.name} — ${values.currentOrg.designation}`}
          />
          <Row label="Notice Period" value={values.noticePeriod} />
          <Row label="Current / Expected CTC" value={`${values.currentCtc} / ${values.expectedCtc}`} />
          <Row label="Passport Number" value={values.passportNumber} />
          <Row label="Driving License" value={values.drivingLicense} />
          <Row label="Family Details" value={values.familyDetails} />
        </dl>
      </div>

      <div className="aptus-review-group">
        <div className="aptus-review-group__head">
          <h3>Education</h3>
          <button type="button" onClick={() => onEdit(3)}>Edit</button>
        </div>
        <dl>
          {values.educationEntries
            .filter((e) => e.name)
            .map((e, i) => (
              <Row
                key={i}
                label={e.name}
                value={`${e.institution} (${e.year})`}
              />
            ))}
        </dl>
      </div>

      <div className="aptus-review-group">
        <div className="aptus-review-group__head">
          <h3>Attachments</h3>
          <button type="button" onClick={() => onEdit(4)}>Edit</button>
        </div>
        <dl>
          <Row label="Resume" value={fileName(files.resume)} />
          <Row
            label="Certificates"
            value={
              files.educationalCertificates.length
                ? files.educationalCertificates.map((f) => f.name).join(", ")
                : "—"
            }
          />
          <Row label="Passport Copy" value={fileName(files.passportCopy)} />
          <Row label="Photograph" value={fileName(files.photograph)} />
          <Row label="Appointment Letter" value={fileName(files.appointmentLetter)} />
          <Row label="Relieving Letter" value={fileName(files.relievingLetter)} />
          <Row label="Latest Payslip" value={fileName(files.latestPayslip)} />
        </dl>
      </div>
    </>
  );
}
