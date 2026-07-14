/**
 * Content-based (magic-byte) file-type detection.
 *
 * security (OWASP — Unrestricted File Upload): file extensions and the
 * browser-supplied MIME type are both attacker-controlled and easily spoofed.
 * We additionally sniff the leading bytes so a `.pdf` that is actually an
 * executable/script is rejected at the trust boundary. This is a signature
 * check, not full content inspection — pair it with size limits + AV scanning
 * (ponytail: no AV here; add ClamAV/managed scanning before persisting files).
 */

export type FileKind =
  | "pdf"
  | "ole-doc" // legacy .doc / .xls (OLE2 compound file)
  | "zip" // .docx and other OOXML (ZIP container)
  | "jpeg"
  | "png"
  | "webp"
  | "unknown";

function startsWith(buf: Uint8Array, sig: number[], offset = 0): boolean {
  if (buf.length < offset + sig.length) return false;
  for (let i = 0; i < sig.length; i++) {
    if (buf[offset + i] !== sig[i]) return false;
  }
  return true;
}

/** Detect a file kind from its leading bytes. Pass at least the first 16 bytes. */
export function sniffFileKind(buf: Uint8Array): FileKind {
  if (startsWith(buf, [0x25, 0x50, 0x44, 0x46])) return "pdf"; // %PDF
  if (startsWith(buf, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]))
    return "ole-doc";
  if (
    startsWith(buf, [0x50, 0x4b, 0x03, 0x04]) || // PK\x03\x04
    startsWith(buf, [0x50, 0x4b, 0x05, 0x06]) ||
    startsWith(buf, [0x50, 0x4b, 0x07, 0x08])
  )
    return "zip";
  if (startsWith(buf, [0xff, 0xd8, 0xff])) return "jpeg";
  if (startsWith(buf, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    return "png";
  if (startsWith(buf, [0x52, 0x49, 0x46, 0x46]) && startsWith(buf, [0x57, 0x45, 0x42, 0x50], 8))
    return "webp"; // RIFF....WEBP
  return "unknown";
}

/** Kinds we consider valid content for a given declared extension. */
const EXT_TO_KINDS: Record<string, FileKind[]> = {
  ".pdf": ["pdf"],
  // Word may save .doc as OLE or (rarely) as OOXML; accept both to avoid false rejects.
  ".doc": ["ole-doc", "zip"],
  ".docx": ["zip"],
  ".jpg": ["jpeg"],
  ".jpeg": ["jpeg"],
  ".png": ["png"],
  ".webp": ["webp"],
};

/**
 * Returns an error string when the file's actual bytes don't match its declared
 * extension, else null. `allowedExts` scopes which extensions are acceptable at
 * this call site (defence in depth alongside the extension allowlist).
 */
export function validateFileContent(
  fileName: string,
  headerBytes: Uint8Array,
  allowedExts: readonly string[],
  label: string,
): string | null {
  const lower = fileName.toLowerCase();
  const ext = allowedExts.find((e) => lower.endsWith(e));
  if (!ext) return `${label} must be one of: ${allowedExts.join(", ")}`;

  const expected = EXT_TO_KINDS[ext];
  if (!expected) return null; // unknown mapping — extension check already passed

  const kind = sniffFileKind(headerBytes);
  if (!expected.includes(kind)) {
    // Do not leak the sniffed kind to the client — keep the message generic.
    return `${label} content does not match its file type.`;
  }
  return null;
}
