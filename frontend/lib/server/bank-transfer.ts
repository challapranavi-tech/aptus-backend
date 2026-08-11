import { createHash } from "crypto";
import { logger } from "./logger";

export type BankTransferDetails = {
  companyName: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  iban: string;
  swiftBic: string;
  branch?: string;
  currency: string;
};

/** Aptus Bank Muscat account — env vars override when set. */
const DEFAULT_BANK_TRANSFER_DETAILS: BankTransferDetails = {
  companyName: "ORIENTAL ORX INTER (APTUS INFOTECH)",
  bankName: "Bank Muscat",
  accountName: "ORIENTAL ORX INTER (APTUS INFOTECH)",
  accountNumber: "0342-00229626-0015",
  iban: "",
  swiftBic: "BMUSOMRXXXX",
  branch: "MBD South, Ruwi, Sultanate of Oman",
  currency: "OMR",
};

function readConfiguredBankTransferDetails(): BankTransferDetails | null {
  const bankName = process.env.BANK_TRANSFER_BANK_NAME?.trim();
  const accountName = process.env.BANK_TRANSFER_ACCOUNT_NAME?.trim();
  const accountNumber = process.env.BANK_TRANSFER_ACCOUNT_NUMBER?.trim();
  const swiftBic = process.env.BANK_TRANSFER_SWIFT?.trim();

  // ponytail: IBAN optional — production Bank Muscat account has none published yet
  if (!bankName || !accountName || !accountNumber || !swiftBic) {
    return null;
  }

  const companyName =
    process.env.BANK_TRANSFER_COMPANY_NAME?.trim() || accountName;

  return {
    companyName,
    bankName,
    accountName,
    accountNumber,
    iban: process.env.BANK_TRANSFER_IBAN?.trim() || "",
    swiftBic,
    branch: process.env.BANK_TRANSFER_BRANCH?.trim() || undefined,
    currency: process.env.BANK_TRANSFER_CURRENCY?.trim() || "OMR",
  };
}

/**
 * Company bank account customers are instructed to transfer payment to.
 * Prefers BANK_TRANSFER_* env vars; falls back to the Aptus Bank Muscat defaults.
 */
export function getBankTransferDetails(): BankTransferDetails {
  const configured = readConfiguredBankTransferDetails();
  if (configured) return configured;

  if (process.env.NODE_ENV === "production") {
    logger.info("Using default Bank Muscat transfer details (BANK_TRANSFER_* unset)", {
      action: "bank_transfer.default_details",
    });
  }
  return DEFAULT_BANK_TRANSFER_DETAILS;
}

/**
 * APT-YYYYMMDD-XXXX — the reference customers must quote on their bank transfer.
 * Derived from the order id so the checkout screen, the submitted order, and any
 * later reload all show the same value without needing to persist it first.
 */
export function deriveBankTransferReference(order: {
  id: string;
  createdAt?: string;
}): string {
  const parsed = order.createdAt ? new Date(order.createdAt) : new Date();
  const date = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const digest = createHash("sha256").update(order.id).digest("hex").slice(0, 8);
  const seq = String(parseInt(digest, 16) % 10_000).padStart(4, "0");
  return `APT-${y}${m}${d}-${seq}`;
}

export const PAYMENT_PROOF_MAX_BYTES = 4 * 1024 * 1024; // 4 MB — Vercel request body limit is ~4.5 MB

export const PAYMENT_PROOF_ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/pjpeg",
  "image/x-jpeg",
  "image/png",
];

export const PAYMENT_PROOF_ALLOWED_EXTENSIONS = ["pdf", "jpg", "jpeg", "jfif", "png"];

export function getFileExtension(fileName: string): string {
  const parts = fileName.trim().toLowerCase().split(".");
  return parts.length > 1 ? parts[parts.length - 1]! : "";
}

function normalizeProofMime(type: string): string {
  return (type || "").toLowerCase().split(";")[0]!.trim();
}

/**
 * Accept PDF/JPG/PNG by extension, or by MIME when the browser strips/omits the
 * filename (common with some mobile share sheets → name "blob" / empty).
 */
export function isAllowedPaymentProofFile(file: { type: string; name: string }): boolean {
  const extension = getFileExtension(file.name);
  const mime = normalizeProofMime(file.type);
  const mimeOk = PAYMENT_PROOF_ALLOWED_MIME_TYPES.includes(mime);
  const extensionOk = PAYMENT_PROOF_ALLOWED_EXTENSIONS.includes(extension);
  if (extensionOk) {
    return mimeOk || mime === "" || mime === "application/octet-stream";
  }
  // Mime-only fallback when the browser omitted a real extension (name "blob" / empty).
  // Do not accept evil.exe renamed with an image MIME.
  const bareName = !(file.name || "").includes(".");
  return bareName && mimeOk;
}

/** Ensure the stored name has an extension validateFileContent can map. */
export function ensurePaymentProofFileName(file: { name: string; type: string }): string {
  const raw = (file.name || "").trim() || "payment-proof";
  if (PAYMENT_PROOF_ALLOWED_EXTENSIONS.includes(getFileExtension(raw))) {
    // Normalize .jfif → .jpg for storage/sniff mapping.
    if (getFileExtension(raw) === "jfif") {
      return `${raw.slice(0, -5)}.jpg`;
    }
    return raw;
  }
  const mime = normalizeProofMime(file.type);
  if (mime === "application/pdf") return `${raw.replace(/\.[^.]+$/, "") || "payment-proof"}.pdf`;
  if (mime === "image/png") return `${raw.replace(/\.[^.]+$/, "") || "payment-proof"}.png`;
  if (
    mime === "image/jpeg" ||
    mime === "image/jpg" ||
    mime === "image/pjpeg" ||
    mime === "image/x-jpeg"
  ) {
    return `${raw.replace(/\.[^.]+$/, "") || "payment-proof"}.jpg`;
  }
  return raw;
}

/** Strip anything that isn't safe for a filesystem path segment. */
export function sanitizeFileName(fileName: string): string {
  const trimmed = fileName.trim().replace(/[^a-zA-Z0-9._-]/g, "_");
  return trimmed.slice(-120) || "payment-proof";
}
