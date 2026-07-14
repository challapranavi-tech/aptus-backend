"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

function AutoFillBadge() {
  return (
    <span className="aptus-field__badge" title="Pre-filled from your resume">
      <svg viewBox="0 0 20 20" fill="currentColor" width="12" height="12" aria-hidden="true">
        <path d="M11.3 1.7a1 1 0 0 1 1.4 0l4.6 4.6a1 1 0 0 1 0 1.4l-8.9 8.9-5.9 1.3 1.3-5.9 8.9-8.9Z" />
      </svg>
      Auto-filled — review
    </span>
  );
}

interface FieldWrapProps {
  label: string;
  htmlFor?: string;
  error?: string;
  help?: string;
  autoFilled?: boolean;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function FieldWrap({
  label,
  htmlFor,
  error,
  help,
  autoFilled,
  required,
  children,
  className,
}: FieldWrapProps) {
  return (
    <div className={cn("aptus-field", className)} data-invalid={error ? "true" : undefined}>
      <label htmlFor={htmlFor}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
        {autoFilled && <AutoFillBadge />}
      </label>
      {help && <p className="aptus-field__help">{help}</p>}
      {children}
      {error && (
        <p className="aptus-field__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

interface TextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  error?: string;
  help?: string;
  autoFilled?: boolean;
  required?: boolean;
  inputMode?: "text" | "numeric" | "tel" | "email";
  className?: string;
  max?: string;
}

export function TextField({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  error,
  help,
  autoFilled,
  required,
  inputMode,
  className,
  max,
}: TextFieldProps) {
  return (
    <FieldWrap
      label={label}
      htmlFor={id}
      error={error}
      help={help}
      autoFilled={autoFilled}
      required={required}
      className={className}
    >
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        inputMode={inputMode}
        max={max}
        aria-invalid={error ? true : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
    </FieldWrap>
  );
}

interface TextAreaFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  help?: string;
  required?: boolean;
  rows?: number;
  className?: string;
}

export function TextAreaField({
  id,
  label,
  value,
  onChange,
  placeholder,
  error,
  help,
  required,
  rows = 4,
  className,
}: TextAreaFieldProps) {
  return (
    <FieldWrap
      label={label}
      htmlFor={id}
      error={error}
      help={help}
      required={required}
      className={className}
    >
      <textarea
        id={id}
        rows={rows}
        value={value}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
    </FieldWrap>
  );
}

interface SelectFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  placeholder?: string;
  error?: string;
  required?: boolean;
  className?: string;
}

export function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = "Select…",
  error,
  required,
  className,
}: SelectFieldProps) {
  return (
    <FieldWrap
      label={label}
      htmlFor={id}
      error={error}
      required={required}
      className={className}
    >
      <select
        id={id}
        value={value}
        aria-invalid={error ? true : undefined}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </FieldWrap>
  );
}
