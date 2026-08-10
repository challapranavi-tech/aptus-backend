"use client";

import { useRef, useState } from "react";
import {
  formatFileSize,
  isAllowedPaymentProofFile,
  PAYMENT_PROOF_ACCEPT,
  PAYMENT_PROOF_MAX_BYTES,
} from "@/lib/bank-transfer-client";

type PaymentProofUploadProps = {
  file: File | null;
  onFileSelected: (file: File | null) => void;
  uploadProgress?: number | null; // 0-100 while submitting, null when idle
  error?: string | null;
};

export function PaymentProofUpload({
  file,
  onFileSelected,
  uploadProgress,
  error,
}: PaymentProofUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  function validateAndSet(candidate: File | null) {
    if (!candidate) {
      onFileSelected(null);
      return;
    }
    if (!isAllowedPaymentProofFile(candidate)) {
      setLocalError("Unsupported file type. Please upload a PDF, JPG, JPEG, or PNG file.");
      return;
    }
    if (candidate.size > PAYMENT_PROOF_MAX_BYTES) {
      setLocalError("File is too large. Maximum size is 10 MB.");
      return;
    }
    setLocalError(null);
    onFileSelected(candidate);
  }

  const isUploading = uploadProgress != null && uploadProgress < 100;
  const isDone = uploadProgress === 100;
  const displayError = error ?? localError;

  return (
    <div className="aptus-proof-upload">
      <label className="aptus-proof-upload__field-label">
        Payment proof <span aria-hidden="true">*</span>
      </label>
      <div
        className={`aptus-proof-dropzone${dragActive ? " is-dragging" : ""}${file ? " has-file" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          validateAndSet(event.dataTransfer.files?.[0] ?? null);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={PAYMENT_PROOF_ACCEPT}
          hidden
          onChange={(event) => validateAndSet(event.target.files?.[0] ?? null)}
        />

        {!file ? (
          <div className="aptus-proof-dropzone__empty">
            <strong>Click to upload or drag and drop</strong>
            <small>PDF, JPG, JPEG or PNG — max 10 MB</small>
          </div>
        ) : (
          <div className="aptus-proof-dropzone__file">
            <div>
              <strong>{file.name}</strong>
              <small>{formatFileSize(file.size)}</small>
            </div>
            {!isUploading ? (
              <button
                type="button"
                className="aptus-proof-remove"
                onClick={(event) => {
                  event.stopPropagation();
                  onFileSelected(null);
                  if (inputRef.current) inputRef.current.value = "";
                }}
                aria-label="Remove file"
              >
                ×
              </button>
            ) : null}
          </div>
        )}

        {isUploading ? (
          <div className="aptus-proof-progress">
            <div className="aptus-proof-progress__bar" style={{ width: `${uploadProgress}%` }} />
          </div>
        ) : null}

        {isDone ? (
          <div className="aptus-proof-success">
            <span aria-hidden="true">✓</span> Upload complete
          </div>
        ) : null}
      </div>

      {displayError ? (
        <p className="aptus-proof-error" role="alert">
          {displayError}
        </p>
      ) : null}
    </div>
  );
}
