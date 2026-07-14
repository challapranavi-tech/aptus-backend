/**
 * Best-effort plain-text extraction from resume uploads.
 *
 * PDF uses `unpdf` (serverless pdf.js — decodes real glyph-encoded text that a
 * naive byte scan cannot). DOCX uses stdlib `zlib` (reliable, no dep). Legacy
 * .doc / unknowns fall back to printable-run scraping. Auto-fill is optional,
 * so any failure returns "" and the flow proceeds to manual entry.
 */
import zlib from "zlib";

function readUInt16(buf: Buffer, off: number): number {
  return buf.readUInt16LE(off);
}
function readUInt32(buf: Buffer, off: number): number {
  return buf.readUInt32LE(off);
}

/** Pull word/document.xml out of a DOCX (ZIP) via the central directory. */
function extractDocxText(buf: Buffer): string {
  const EOCD_SIG = 0x06054b50;
  const CEN_SIG = 0x02014b50;

  // Find End Of Central Directory (search backwards, comment can trail it).
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0 && i > buf.length - 22 - 65536; i--) {
    if (readUInt32(buf, i) === EOCD_SIG) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) return "";

  let ptr = readUInt32(buf, eocd + 16); // central directory offset
  const count = readUInt16(buf, eocd + 10);

  for (let n = 0; n < count && ptr + 46 <= buf.length; n++) {
    if (readUInt32(buf, ptr) !== CEN_SIG) break;
    const method = readUInt16(buf, ptr + 10);
    const compSize = readUInt32(buf, ptr + 20);
    const fnLen = readUInt16(buf, ptr + 28);
    const extraLen = readUInt16(buf, ptr + 30);
    const commentLen = readUInt16(buf, ptr + 32);
    const localOff = readUInt32(buf, ptr + 42);
    const name = buf.toString("utf8", ptr + 46, ptr + 46 + fnLen);

    if (name === "word/document.xml") {
      const lfFnLen = readUInt16(buf, localOff + 26);
      const lfExtraLen = readUInt16(buf, localOff + 28);
      const dataStart = localOff + 30 + lfFnLen + lfExtraLen;
      const data = buf.subarray(dataStart, dataStart + compSize);
      let xml: Buffer;
      try {
        xml = method === 8 ? zlib.inflateRawSync(data) : data;
      } catch {
        return "";
      }
      return xmlToText(xml.toString("utf8"));
    }
    ptr += 46 + fnLen + extraLen + commentLen;
  }
  return "";
}

function xmlToText(xml: string): string {
  return xml
    .replace(/<\/w:p>/g, "\n")
    .replace(/<w:tab\/>/g, "\t")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function unescapePdfString(s: string): string {
  return s
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\");
}

/** Primary PDF extractor: unpdf (pdf.js) decodes real text + fonts. */
async function extractPdfTextViaUnpdf(buf: Buffer): Promise<string> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(buf));
  const { text } = await extractText(pdf, { mergePages: true });
  return (Array.isArray(text) ? text.join("\n") : text).trim();
}

/** Fallback PDF text: inflate FlateDecode streams, read () text operators. */
function extractPdfText(buf: Buffer): string {
  const chunks: string[] = [];

  // Try to inflate each stream; concatenate raw + inflated for text scanning.
  const raw = buf.toString("latin1");
  const streamRe = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let m: RegExpExecArray | null;
  while ((m = streamRe.exec(raw))) {
    const bytes = Buffer.from(m[1], "latin1");
    for (const fn of [zlib.inflateSync, zlib.inflateRawSync]) {
      try {
        chunks.push((fn as (b: Buffer) => Buffer)(bytes).toString("latin1"));
        break;
      } catch {
        /* not this codec */
      }
    }
  }
  chunks.push(raw); // some PDFs store uncompressed text

  const out: string[] = [];
  for (const content of chunks) {
    const textRe = /\((?:\\.|[^\\()])*\)/g;
    let t: RegExpExecArray | null;
    while ((t = textRe.exec(content))) {
      const piece = unescapePdfString(t[0].slice(1, -1));
      if (piece.trim()) out.push(piece);
    }
  }
  return out.join(" ").replace(/\s+\n/g, "\n").trim();
}

function scrapePrintable(buf: Buffer): string {
  return buf
    .toString("latin1")
    .replace(/[^\x09\x0a\x0d\x20-\x7e]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Route uploaded resume bytes to the right extractor by filename. */
export async function extractResumeText(
  fileName: string,
  buf: Buffer,
): Promise<string> {
  const lower = fileName.toLowerCase();
  try {
    if (lower.endsWith(".docx")) return extractDocxText(buf);
    if (lower.endsWith(".pdf")) {
      // Prefer the real pdf.js decode; fall back to the naive scan on failure.
      try {
        const text = await extractPdfTextViaUnpdf(buf);
        if (text) return text;
      } catch {
        /* fall through to naive extractor */
      }
      return extractPdfText(buf);
    }
    // .doc (legacy binary) and unknowns: grab printable runs as a last resort.
    return scrapePrintable(buf);
  } catch {
    return "";
  }
}
