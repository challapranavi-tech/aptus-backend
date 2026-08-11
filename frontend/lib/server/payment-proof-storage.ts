import { validateFileContent, FILE_CONTENT_PROBE_BYTES, sniffFileKind, mimeForFileKind } from "@shared/lib/file-signature";
import { ensurePaymentProofFileName, sanitizeFileName } from "./bank-transfer";

// ---------------------------------------------------------------------------
// Vercel Blob storage for payment proofs (PRIVATE store).
// Requires: BLOB_READ_WRITE_TOKEN (auto-injected when a private Blob store is
// linked). Bank slips are PII — put/get must use private access (public access
// against a private store caused the alpha UPLOAD_FAILED 500s).
// Local / no token: in-memory Map (lost on cold start; fine for local tests).
// On Vercel without a token, fail loud — disk is read-only there.
// ---------------------------------------------------------------------------

export type StoredPaymentProof = {
  /** Blob URL (or in-memory key on local fallback). Private URLs are not fetchable. */
  filePath: string;
  /** Relative id used to fetch the file back via the protected download route. */
  storageKey: string;
  fileName: string;
  contentType: string;
  size: number;
};

// In-memory fallback / same-process cache (no Blob token, or just after put).
const localStore = new Map<string, { buffer: Buffer; contentType: string; fileName: string }>();

const BLOB_PREFIX = "payment-proofs";

function isBlobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

function blobPathname(storageKey: string): string {
  return `${BLOB_PREFIX}/${storageKey}`;
}

/** Saves an uploaded proof file to Vercel Blob (or in-memory when no token). */
export async function savePaymentProofFile(
  orderId: string,
  file: File,
): Promise<StoredPaymentProof> {
  const safeOrderId = sanitizeOrderId(orderId);
  const originalName = ensurePaymentProofFileName(file);
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

  // Prefer sniffed MIME over browser-supplied type (phones often lie or omit it).
  const sniffed = mimeForFileKind(sniffFileKind(buffer.subarray(0, FILE_CONTENT_PROBE_BYTES)));
  const contentType = sniffed || file.type || "application/octet-stream";
  // Always cache in-process so the same request can re-read without another round-trip.
  localStore.set(storageKey, { buffer, contentType, fileName: originalName });

  if (isBlobConfigured()) {
    const { put } = await import("@vercel/blob");
    // Stable pathname so get(storageKey) round-trips; download route is auth-gated.
    const blob = await put(blobPathname(storageKey), buffer, {
      access: "private",
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

  // Vercel FS is read-only — without Blob the upload would vanish on cold start.
  if (process.env.VERCEL === "1") {
    localStore.delete(storageKey);
    throw new Error(
      "BLOB_READ_WRITE_TOKEN missing on Vercel — link a private Blob store for payment proofs.",
    );
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
    const { get } = await import("@vercel/blob");
    const result = await get(blobPathname(storageKey), {
      access: "private",
      useCache: false,
    });
    if (!result?.stream) return null;
    return Buffer.from(await new Response(result.stream).arrayBuffer());
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
