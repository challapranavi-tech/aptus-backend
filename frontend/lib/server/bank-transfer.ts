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
};

// ponytail: dev-only sandbox account for local checkout UI — never used in production.
const DEV_BANK_TRANSFER_FIXTURE: BankTransferDetails = {
  companyName: "Aptus Infotech LLC",
  bankName: "Test Bank of Oman",
  accountName: "Aptus Infotech LLC",
  accountNumber: "123456789012345",
  iban: "OM1200012345678901234567",
  swiftBic: "TBOMOMMX",
  branch: "Muscat Main Branch",
};

function readConfiguredBankTransferDetails(): BankTransferDetails | null {
  const companyName = process.env.BANK_TRANSFER_COMPANY_NAME?.trim();
  const bankName = process.env.BANK_TRANSFER_BANK_NAME?.trim();
  const accountName = process.env.BANK_TRANSFER_ACCOUNT_NAME?.trim();
  const accountNumber = process.env.BANK_TRANSFER_ACCOUNT_NUMBER?.trim();
  const iban = process.env.BANK_TRANSFER_IBAN?.trim();
  const swiftBic = process.env.BANK_TRANSFER_SWIFT?.trim();

  if (!companyName || !bankName || !accountName || !accountNumber || !iban || !swiftBic) {
    return null;
  }

  return {
    companyName,
    bankName,
    accountName,
    accountNumber,
    iban,
    swiftBic,
    branch: process.env.BANK_TRANSFER_BRANCH?.trim() || undefined,
  };
}

/**
 * Company bank account customers are instructed to transfer payment to.
 * Production requires every BANK_TRANSFER_* variable. In non-production, a sandbox
 * fixture is returned when env vars are missing so checkout can be tested locally.
 */
export function getBankTransferDetails(): BankTransferDetails | null {
  const configured = readConfiguredBankTransferDetails();
  if (configured) return configured;

  if (process.env.NODE_ENV !== "production") {
    logger.warn("Using dev bank transfer fixture — set BANK_TRANSFER_* env vars for real account details", {
      action: "bank_transfer.dev_fixture",
    });
    return DEV_BANK_TRANSFER_FIXTURE;
  }

  logger.error("Bank transfer details are not configured", {
    action: "bank_transfer.not_configured",
    missing: [
      "BANK_TRANSFER_COMPANY_NAME",
      "BANK_TRANSFER_BANK_NAME",
      "BANK_TRANSFER_ACCOUNT_NAME",
      "BANK_TRANSFER_ACCOUNT_NUMBER",
      "BANK_TRANSFER_IBAN",
      "BANK_TRANSFER_SWIFT",
    ],
  });
  return null;
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

export const PAYMENT_PROOF_MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export const PAYMENT_PROOF_ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
];

export const PAYMENT_PROOF_ALLOWED_EXTENSIONS = ["pdf", "jpg", "jpeg", "png"];

export function getFileExtension(fileName: string): string {
  const parts = fileName.trim().toLowerCase().split(".");
  return parts.length > 1 ? parts[parts.length - 1] : "";
}

export function isAllowedPaymentProofFile(file: { type: string; name: string }): boolean {
  const extension = getFileExtension(file.name);
  const mime = (file.type || "").toLowerCase();
  const mimeOk = PAYMENT_PROOF_ALLOWED_MIME_TYPES.includes(mime);
  const extensionOk = PAYMENT_PROOF_ALLOWED_EXTENSIONS.includes(extension);
  // Browsers often send application/octet-stream (or empty) for PDFs — trust extension too.
  // Server still sniffs magic bytes before persisting.
  return extensionOk && (mimeOk || mime === "" || mime === "application/octet-stream");
}

/** Strip anything that isn't safe for a filesystem path segment. */
export function sanitizeFileName(fileName: string): string {
  const trimmed = fileName.trim().replace(/[^a-zA-Z0-9._-]/g, "_");
  return trimmed.slice(-120) || "payment-proof";
}
