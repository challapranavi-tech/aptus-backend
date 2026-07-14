"use client";

import { cn } from "@/lib/utils";
import { MAX_UPLOAD_BYTES } from "@shared/lib/careers-application";
import { useId, useRef, useState } from "react";

function humanSize(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

interface FileCardProps {
  file: File;
  onRemove: () => void;
  preview?: boolean;
}

function FileCard({ file, onRemove, preview }: FileCardProps) {
  const isImage = preview && file.type.startsWith("image/");
  const url = isImage ? URL.createObjectURL(file) : null;
  return (
    <div className="aptus-filecard">
      {isImage && url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="Preview" onLoad={() => URL.revokeObjectURL(url)} />
      ) : (
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#248bcc" strokeWidth="2" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
        </svg>
      )}
      <span className="aptus-filecard__name">{file.name}</span>
      <span className="aptus-filecard__size">{humanSize(file.size)}</span>
      <button
        type="button"
        className="aptus-filecard__remove"
        onClick={onRemove}
        aria-label={`Remove ${file.name}`}
      >
        ✕
      </button>
    </div>
  );
}

interface FileDropzoneProps {
  id?: string;
  accept: string;
  label?: string;
  hint?: string;
  multiple?: boolean;
  preview?: boolean;
  error?: string;
  files: File[];
  onChange: (files: File[]) => void;
  /** Client-side validator per file; return error string or null. */
  validate?: (file: File) => string | null;
}

export function FileDropzone({
  id,
  accept,
  label,
  hint,
  multiple = false,
  preview = false,
  error,
  files,
  onChange,
  validate,
}: FileDropzoneProps) {
  const reactId = useId();
  const inputId = id ?? reactId;
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const accept_exts = accept.split(",").map((s) => s.trim().toLowerCase());

  const check = (file: File): string | null => {
    const okExt = accept_exts.some((e) => file.name.toLowerCase().endsWith(e));
    if (!okExt) return `${file.name}: type must be ${accept_exts.join(", ")}`;
    if (file.size > MAX_UPLOAD_BYTES)
      return `${file.name}: must be under ${Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))} MB`;
    return validate?.(file) ?? null;
  };

  const accept_files = (incoming: FileList | File[]) => {
    const list = Array.from(incoming);
    for (const f of list) {
      const err = check(f);
      if (err) {
        setLocalError(err);
        return;
      }
    }
    setLocalError(null);
    onChange(multiple ? [...files, ...list] : [list[0]]);
  };

  const shownError = error ?? localError ?? undefined;

  return (
    <div className="aptus-field" data-invalid={shownError ? "true" : undefined}>
      {label && <label htmlFor={inputId}>{label}</label>}
      <div
        className="aptus-dropzone"
        data-drag={drag || undefined}
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          if (e.dataTransfer.files?.length) accept_files(e.dataTransfer.files);
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <path d="M17 8l-5-5-5 5" />
          <path d="M12 3v12" />
        </svg>
        <div>
          <strong>Click to upload</strong> or drag and drop
        </div>
        <div className="aptus-dropzone__hint">
          {hint ?? `${accept_exts.join(", ")} · up to ${Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))} MB`}
        </div>
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="sr-only"
          style={{ display: "none" }}
          onChange={(e) => {
            if (e.target.files?.length) accept_files(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {files.map((f, i) => (
        <FileCard
          key={`${f.name}-${i}`}
          file={f}
          preview={preview}
          onRemove={() => onChange(files.filter((_, idx) => idx !== i))}
        />
      ))}

      {shownError && (
        <p className={cn("aptus-field__error")} role="alert">
          {shownError}
        </p>
      )}
    </div>
  );
}
