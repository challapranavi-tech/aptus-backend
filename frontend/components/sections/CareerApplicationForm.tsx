"use client";

import {
  FORM_ACCEPT,
  FORM_EXTENSIONS,
  MAX_UPLOAD_BYTES,
  PRE_INTERVIEW_FORM_URL,
  RESUME_ACCEPT,
  RESUME_EXTENSIONS,
  validateFields,
  validateFile,
  type ApplicationFields,
} from "@shared/lib/career-application";
import { publicApiBase } from "@/lib/api-base";
import { cn } from "@/lib/utils";
import { useRef, useState } from "react";

type Status = "idle" | "uploading" | "success" | "error";

const LABEL = "aptus-career-form-label";
const INPUT = "mt-0 w-full px-4 py-3 aptus-career-form-input";

interface Props {
  submitLabel?: string;
}

const EMPTY: ApplicationFields = {
  fullName: "",
  email: "",
  phone: "",
  position: "",
  experience: "",
  location: "",
  coverMessage: "",
};

export function CareerApplicationForm({ submitLabel }: Props) {
  const [fields, setFields] = useState<ApplicationFields>(EMPTY);
  const [resume, setResume] = useState<File | null>(null);
  const [formFile, setFormFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const resumeRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLInputElement>(null);

  const setField = (key: keyof ApplicationFields, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const validate = (): boolean => {
    const next = validateFields(fields);
    const resumeErr = validateFile(resume, RESUME_EXTENSIONS, "Resume", true);
    if (resumeErr) next.resume = resumeErr;
    const formErr = validateFile(
      formFile,
      FORM_EXTENSIONS,
      "Pre-interview form",
      true,
    );
    if (formErr) next.preInterviewForm = formErr;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "uploading") return;
    if (!validate()) {
      setStatus("error");
      setMessage("Please review and correct the highlighted fields before submitting.");
      return;
    }

    const body = new FormData();
    (Object.keys(fields) as Array<keyof ApplicationFields>).forEach((k) =>
      body.append(k, fields[k] ?? ""),
    );
    if (resume) body.append("resume", resume);
    if (formFile) body.append("preInterviewForm", formFile);

    setStatus("uploading");
    setProgress(0);
    setMessage("");

    // XHR (not fetch) so we can surface real upload progress to the candidate.
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${publicApiBase()}/api/career/apply`);
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) {
        setProgress(Math.round((ev.loaded / ev.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setStatus("success");
        setMessage(
          "Thank you for your application! We've received it successfully. Our HR team will review your application and contact you if your profile is shortlisted.",
        );
        setFields(EMPTY);
        setResume(null);
        setFormFile(null);
        if (resumeRef.current) resumeRef.current.value = "";
        if (formRef.current) formRef.current.value = "";
        setErrors({});
        return;
      }
      let serverErrors: Record<string, string> | undefined;
      let msg = "Something went wrong. Please try again.";
      try {
        const data = JSON.parse(xhr.responseText);
        if (data.errors) serverErrors = data.errors;
        if (data.error) msg = data.error;
      } catch {
        /* keep default message */
      }
      if (serverErrors) setErrors(serverErrors);
      setStatus("error");
      setMessage(msg);
    };
    xhr.onerror = () => {
      setStatus("error");
      setMessage("Network error. Please check your connection and try again.");
    };
    xhr.send(body);
  };

  const err = (key: string) =>
    errors[key] ? (
      <span className="mt-1 block text-sm font-medium text-red-600">
        {errors[key]}
      </span>
    ) : null;

  const fileHint = (file: File | null) =>
    file ? (
      <span className="mt-1 block text-sm text-black/70">
        {file.name} · {(file.size / (1024 * 1024)).toFixed(2)} MB
      </span>
    ) : null;

  return (
    <form
      data-cta-animate
      className="relative mt-8 w-full text-left"
      onSubmit={handleSubmit}
      noValidate
    >
      {/* Pre-interview form download + upload */}
      <div className="mb-8 rounded-2xl bg-white/70 p-5 sm:p-6">
        <h3 className="aptus-career-form-label !text-2xl !font-semibold">
          Pre-Interview Form
        </h3>
        <p className="mt-1 text-base text-black/80">
          Download the form, fill in your details, then upload the completed
          copy below.
        </p>
        <a
          href={PRE_INTERVIEW_FORM_URL}
          download
          className="aptus-iso-download-btn mt-4"
        >
          Download Pre-Interview Form
        </a>
        <label className="mt-5 block aptus-career-form-label">
          Upload Completed Pre-Interview Form *
          <input
            ref={formRef}
            type="file"
            accept={FORM_ACCEPT}
            className={cn(INPUT, "py-2")}
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setFormFile(f);
              setErrors((prev) => ({ ...prev, preInterviewForm: "" }));
            }}
          />
        </label>
        {fileHint(formFile)}
        {err("preInterviewForm")}
      </div>

      <div className="grid gap-[20px] sm:grid-cols-2 sm:gap-[30px]">
        <label className={LABEL}>
          Full Name *
          <input
            type="text"
            value={fields.fullName}
            onChange={(e) => setField("fullName", e.target.value)}
            placeholder="Full Name"
            className={INPUT}
          />
          {err("fullName")}
        </label>
        <label className={LABEL}>
          Email *
          <input
            type="email"
            value={fields.email}
            onChange={(e) => setField("email", e.target.value)}
            placeholder="you@example.com"
            className={INPUT}
          />
          {err("email")}
        </label>
        <label className={LABEL}>
          Phone Number *
          <input
            type="tel"
            value={fields.phone}
            onChange={(e) => setField("phone", e.target.value)}
            placeholder="+968 0000 0000"
            className={INPUT}
          />
          {err("phone")}
        </label>
        <label className={LABEL}>
          Position Applying For *
          <input
            type="text"
            value={fields.position}
            onChange={(e) => setField("position", e.target.value)}
            placeholder="e.g. Software Engineer"
            className={INPUT}
          />
          {err("position")}
        </label>
        <label className={LABEL}>
          Years of Experience *
          <input
            type="text"
            inputMode="numeric"
            value={fields.experience}
            onChange={(e) => setField("experience", e.target.value)}
            placeholder="e.g. 3"
            className={INPUT}
          />
          {err("experience")}
        </label>
        <label className={LABEL}>
          Location *
          <input
            type="text"
            value={fields.location}
            onChange={(e) => setField("location", e.target.value)}
            placeholder="City, Country"
            className={INPUT}
          />
          {err("location")}
        </label>
        <label className={`${LABEL} sm:col-span-2`}>
          Upload Resume * (PDF, DOC, DOCX — max{" "}
          {Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))} MB)
          <input
            ref={resumeRef}
            type="file"
            accept={RESUME_ACCEPT}
            className={cn(INPUT, "py-2")}
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setResume(f);
              setErrors((prev) => ({ ...prev, resume: "" }));
            }}
          />
          {fileHint(resume)}
          {err("resume")}
        </label>
        <label className={`${LABEL} sm:col-span-2`}>
          Cover Message (optional)
          <textarea
            rows={4}
            value={fields.coverMessage}
            onChange={(e) => setField("coverMessage", e.target.value)}
            placeholder="Tell us why you'd be a great fit"
            className={INPUT}
          />
        </label>
      </div>

      {status === "uploading" && (
        <div className="mt-6" aria-live="polite">
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/60">
            <div
              className="h-full rounded-full bg-brand-blue transition-all duration-200"
              style={{ width: `${progress}%`, backgroundColor: "#24648c" }}
            />
          </div>
          <p className="mt-2 text-center text-sm font-medium text-black/80">
            Uploading… {progress}%
          </p>
        </div>
      )}

      {status === "success" && (
        <p
          className="mt-6 rounded-xl bg-green-600/10 px-4 py-3 text-center text-base font-semibold text-green-800"
          role="status"
        >
          {message}
        </p>
      )}

      {status === "error" && message && (
        <p
          className="mt-6 rounded-xl bg-red-600/10 px-4 py-3 text-center text-base font-semibold text-red-700"
          role="alert"
        >
          {message}
        </p>
      )}

      <div className="mt-8 text-center">
        <button
          type="submit"
          className="aptus-form-submit"
          disabled={status === "uploading"}
        >
          {status === "uploading"
            ? "Submitting…"
            : (submitLabel ?? "Submit Application")}
        </button>
      </div>
    </form>
  );
}
