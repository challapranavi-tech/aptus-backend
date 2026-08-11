import { validateFileContent, FILE_CONTENT_PROBE_BYTES } from "@shared/lib/file-signature";
import { sanitizeFileName } from "./bank-transfer";

// ---------------------------------------------------------------------------
// Vercel Blob storage for payment proofs.
// Requires: BLOB_READ_WRITE_TOKEN env var (set in Vercel dashboard).
// On local / serverless without that token, falls back to an in-memory Map so
// the app still runs — files are lost on restart / cold start, which is fine
// for local testing; production must set the token (disk is read-only on Vercel).
// ---------------------------------------------------------------------------

export type StoredPaymentProof = {
  /** Blob URL (or in-memory key on local fallback). */
  filePath: string;
  /** Relative id used to fetch the file back via the protected download route. */
  storageKey: string;
  fileName: string;
  contentType: string;
  size: number;
};

// In-memory fallback / same-process cache (no Blob token, or just after put).
const localStore = new Map<string, { buffer: Buffer; contentType: string; fileName: string }>();

function isBlobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

/** Saves an uploaded proof file to Vercel Blob (or in-memory when no token). */
export async function savePaymentProofFile(
  orderId: string,
  file: File,
): Promise<StoredPaymentProof> {
  const safeOrderId = sanitizeOrderId(orderId);
  const originalName = file.name || "payment-proof.pdf";
  const safeName = sanitizeFileName(originalName);
  const storedName = `${Date.now()}-${safeName}`;
  const storageKey = `${safeOrderId}/${storedName}`;

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

  const contentType = file.type || "application/octet-stream";
  // Always cache in-process so the same request can re-read without another round-trip.
  localStore.set(storageKey, { buffer, contentType, fileName: originalName });

  if (isBlobConfigured()) {
    const { put } = await import("@vercel/blob");
    // Stable pathname so head(storageKey) round-trips; download route is auth-gated.
    const blob = await put(`payment-proofs/${storageKey}`, buffer, {
      access: "public",
      addRandomSuffix: false,
      contentType,
    });
    return {
      filePath: blob.url,
      storageKey,
      fileName: originalName,
      contentType,
      size: buffer.byteLength,
    };
  }

  return {
    filePath: `local:${storageKey}`,
    storageKey,
    fileName: originalName,
    contentType,
    size: buffer.byteLength,
  };
}

/** Returns the raw Buffer for a stored proof, or null if not found. */
export async function readPaymentProofBuffer(storageKey: string): Promise<Buffer | null> {
  const local = localStore.get(storageKey);
  if (local) return local.buffer;

  if (!isBlobConfigured()) return null;

  try {
    const { head } = await import("@vercel/blob");
    const meta = await head(`payment-proofs/${storageKey}`).catch(() => null);
    if (!meta) return null;

    const res = await fetch(meta.url);
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

/** Public Blob URL for a stored proof, or null when not on Blob / not found. */
export async function getPaymentProofUrl(storageKey: string): Promise<string | null> {
  if (!isBlobConfigured()) return null;
  try {
    const { head } = await import("@vercel/blob");
    const meta = await head(`payment-proofs/${storageKey}`).catch(() => null);
    return meta?.url ?? null;
  } catch {
    return null;
  }
}

const SAFE_ORDER_ID = /^[a-zA-Z0-9_-]{1,128}$/;

function sanitizeOrderId(orderId: string): string {
  const trimmed = orderId.trim();
  if (!SAFE_ORDER_ID.test(trimmed)) {
    throw new Error("Invalid order id for payment proof storage");
  }
  return trimmed;
}
