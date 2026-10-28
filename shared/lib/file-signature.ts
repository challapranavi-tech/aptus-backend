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

import { hasAllowedExtension } from "./schema";

export type FileKind =
  | "pdf"
  | "ole-doc" // legacy .doc / .xls (OLE2 compound file)
  | "zip" // .docx and other OOXML (ZIP container)
  | "jpeg"
  | "png"
  | "webp"
  | "svg"
  | "executable"
  | "unknown";

/** Bytes to read for magic + light OOXML probes (Content_Types is usually first). */
export const FILE_CONTENT_PROBE_BYTES = 8192;

function startsWith(buf: Uint8Array, sig: number[], offset = 0): boolean {
  if (buf.length < offset + sig.length) return false;
  for (let i = 0; i < sig.length; i++) {
    if (buf[offset + i] !== sig[i]) return false;
  }
  return true;
}

function latin1Slice(buf: Uint8Array, max = FILE_CONTENT_PROBE_BYTES): string {
  const n = Math.min(buf.length, max);
  let s = "";
  for (let i = 0; i < n; i++) s += String.fromCharCode(buf[i]!);
  return s;
}

/** True when a ZIP probe looks like a Word OOXML package (not a random .zip/.jar). */
export function looksLikeOoxmlWord(buf: Uint8Array): boolean {
  const sample = latin1Slice(buf);
  return (
    sample.includes("[Content_Types].xml") &&
    (sample.includes("word/") || sample.includes("word\\"))
  );
}

function isSvgPayload(buf: Uint8Array): boolean {
  // Skip UTF-8 BOM + leading whitespace, then look for <svg / <?xml … <svg.
  let i = 0;
  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf)
    i = 3;
  while (i < buf.length && (buf[i]! === 0x20 || buf[i]! <= 0x0d)) i++;
  const head = latin1Slice(buf.subarray(i), 256).toLowerCase();
  if (head.startsWith("<svg")) return true;
  if (head.startsWith("<?xml") && head.includes("<svg")) return true;
  return false;
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
  // PE / DOS MZ — never accept as a document/image.
  if (startsWith(buf, [0x4d, 0x5a])) return "executable";
  // ELF
  if (startsWith(buf, [0x7f, 0x45, 0x4c, 0x46])) return "executable";
  if (isSvgPayload(buf)) return "svg";
  return "unknown";
}

/** Stable Content-Type from sniffed kind (ignore browser-supplied MIME). */
export function mimeForFileKind(kind: FileKind): string | null {
  switch (kind) {
    case "pdf":
      return "application/pdf";
    case "ole-doc":
      return "application/msword";
    case "zip":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    default:
      return null;
  }
}

/** Kinds we consider valid content for a given declared extension. */
const EXT_TO_KINDS: Record<string, FileKind[]> = {
  ".pdf": ["pdf"],
  // Word may save .doc as OLE or (rarely) as OOXML; accept both to avoid false rejects.
  ".doc": ["ole-doc", "zip"],
  ".docx": ["zip"],
  ".jpg": ["jpeg"],
  ".jpeg": ["jpeg"],
  ".jfif": ["jpeg"],
  ".png": ["png"],
  ".webp": ["webp"],
};

/**
 * Returns an error string when the file's actual bytes don't match its declared
 * extension, else null. `allowedExts` scopes which extensions are acceptable at
 * this call site (defence in depth alongside the extension allowlist).
 *
 * Pass ~8 KB (`FILE_CONTENT_PROBE_BYTES`) so OOXML packages can be distinguished
 * from arbitrary ZIP/JAR files renamed to `.docx`.
 */
export function validateFileContent(
  fileName: string,
  headerBytes: Uint8Array,
  allowedExts: readonly string[],
  label: string,
): string | null {
  if (!hasAllowedExtension(fileName, allowedExts)) {
    return `${label} must be one of: ${allowedExts.join(", ")}`;
  }

  const lower = fileName.toLowerCase();
  const ext = allowedExts.find((e) => lower.endsWith(e.toLowerCase()));
  if (!ext) return `${label} must be one of: ${allowedExts.join(", ")}`;

  const expected = EXT_TO_KINDS[ext];
  if (!expected) return null; // unknown mapping — extension check already passed

  const kind = sniffFileKind(headerBytes);
  if (kind === "svg" || kind === "executable") {
    return `${label} content does not match its file type.`;
  }
  if (!expected.includes(kind)) {
    // Do not leak the sniffed kind to the client — keep the message generic.
    return `${label} content does not match its file type.`;
  }

  // .docx (and OOXML-saved .doc) must look like Word packages, not a bare ZIP/JAR.
  if (kind === "zip" && (ext === ".docx" || ext === ".doc")) {
    if (!looksLikeOoxmlWord(headerBytes)) {
      return `${label} content does not match its file type.`;
    }
  }

  return null;
}
