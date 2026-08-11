/**
 * Client-safe bank-transfer / payment-proof helpers.
 * Server route keeps crypto-backed reference derivation in lib/server/bank-transfer.ts.
 */

/** Keep under Vercel's ~4.5 MB request-body limit so the upload reaches the route. */
export const PAYMENT_PROOF_MAX_BYTES = 4 * 1024 * 1024; // 4 MB

export const PAYMENT_PROOF_ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/pjpeg",
  "image/x-jpeg",
  "image/png",
];

export const PAYMENT_PROOF_ALLOWED_EXTENSIONS = ["pdf", "jpg", "jpeg", "jfif", "png"];

export const PAYMENT_PROOF_ACCEPT =
  ".pdf,.jpg,.jpeg,.jfif,.png,application/pdf,image/jpeg,image/png";

export function getFileExtension(fileName: string): string {
  const parts = fileName.trim().toLowerCase().split(".");
  return parts.length > 1 ? parts[parts.length - 1]! : "";
}

function normalizeProofMime(type: string): string {
  return (type || "").toLowerCase().split(";")[0]!.trim();
}

export function isAllowedPaymentProofFile(file: { type: string; name: string }): boolean {
  const extension = getFileExtension(file.name);
  const mime = normalizeProofMime(file.type);
  const mimeOk = PAYMENT_PROOF_ALLOWED_MIME_TYPES.includes(mime);
  const extensionOk = PAYMENT_PROOF_ALLOWED_EXTENSIONS.includes(extension);
  if (extensionOk) {
    return mimeOk || mime === "" || mime === "application/octet-stream";
  }
  const bareName = !(file.name || "").includes(".");
  return bareName && mimeOk;
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
