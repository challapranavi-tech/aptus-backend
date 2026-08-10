import fs from "fs";
import path from "path";
import { validateFileContent, FILE_CONTENT_PROBE_BYTES } from "@shared/lib/file-signature";
import { sanitizeFileName } from "./bank-transfer";

const UPLOAD_DIR = path.join(process.cwd(), ".data", "payment-proofs");
const SAFE_ORDER_ID = /^[a-zA-Z0-9_-]{1,128}$/;

export type StoredPaymentProof = {
  /** Absolute path on disk. */
  filePath: string;
  /** Relative id used to fetch the file back via the protected download route. */
  storageKey: string;
  fileName: string;
  contentType: string;
  size: number;
};

function sanitizeOrderId(orderId: string): string {
  const trimmed = orderId.trim();
  if (!SAFE_ORDER_ID.test(trimmed)) {
    throw new Error("Invalid order id for payment proof storage");
  }
  return trimmed;
}

/** Saves an uploaded proof file under .data/payment-proofs/<orderId>/, outside /public so it is never served directly. */
export async function savePaymentProofFile(
  orderId: string,
  file: File,
): Promise<StoredPaymentProof> {
  const safeOrderId = sanitizeOrderId(orderId);
  const orderDir = path.join(UPLOAD_DIR, safeOrderId);
  fs.mkdirSync(orderDir, { recursive: true });

  const originalName = file.name || "payment-proof.pdf";
  const safeName = sanitizeFileName(originalName);
  const storedName = `${Date.now()}-${safeName}`;
  const filePath = path.join(orderDir, storedName);

  const buffer = Buffer.from(await file.arrayBuffer());
  const contentError = validateFileContent(
    originalName,
    buffer.subarray(0, FILE_CONTENT_PROBE_BYTES),
    [".pdf", ".jpg", ".jpeg", ".png"],
    "Payment proof",
  );
  if (contentError) {
    throw new Error(contentError);
  }

  fs.writeFileSync(filePath, buffer);

  return {
    filePath,
    storageKey: `${safeOrderId}/${storedName}`,
    fileName: originalName,
    contentType: file.type || "application/octet-stream",
    size: buffer.byteLength,
  };
}

export function resolvePaymentProofPath(storageKey: string): string | null {
  const parts = storageKey.split("/").filter(Boolean);
  if (parts.length !== 2) return null;
  const [orderId, fileName] = parts;
  if (!orderId || !fileName || !SAFE_ORDER_ID.test(orderId)) return null;
  if (fileName.includes("..") || fileName.includes("/") || fileName.includes("\\")) return null;
  const filePath = path.join(UPLOAD_DIR, orderId, fileName);
  return fs.existsSync(filePath) ? filePath : null;
}

export function readPaymentProofFile(storageKey: string): Buffer | null {
  const filePath = resolvePaymentProofPath(storageKey);
  if (!filePath) return null;
  try {
    return fs.readFileSync(filePath);
  } catch {
    return null;
  }
}
