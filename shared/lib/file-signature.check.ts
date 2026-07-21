/**
 * Runnable self-check for magic-byte file-type detection.
 * Run: npx --yes tsx shared/lib/file-signature.check.ts
 */
import assert from "node:assert/strict";
import {
  looksLikeOoxmlWord,
  mimeForFileKind,
  sniffFileKind,
  validateFileContent,
} from "./file-signature";

const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]);
const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
const webp = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50,
]);
const exe = new Uint8Array([0x4d, 0x5a, 0x90, 0x00]); // MZ (PE executable)
const svg = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"></svg>');

// Minimal ZIP local header + name "[Content_Types].xml" + "word/" marker in payload.
function zipWithNames(...names: string[]): Uint8Array {
  const parts: number[] = [];
  for (const name of names) {
    const nameBytes = [...new TextEncoder().encode(name)];
    // local file header
    parts.push(0x50, 0x4b, 0x03, 0x04);
    parts.push(...Array(22).fill(0));
    parts.push(nameBytes.length & 0xff, (nameBytes.length >> 8) & 0xff, 0, 0);
    parts.push(...nameBytes);
  }
  return new Uint8Array(parts);
}

const bareZip = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0, 0, 0, 0]);
const ooxml = zipWithNames("[Content_Types].xml", "word/document.xml");

assert.equal(sniffFileKind(pdf), "pdf");
assert.equal(sniffFileKind(bareZip), "zip");
assert.equal(sniffFileKind(png), "png");
assert.equal(sniffFileKind(jpeg), "jpeg");
assert.equal(sniffFileKind(webp), "webp");
assert.equal(sniffFileKind(exe), "executable");
assert.equal(sniffFileKind(svg), "svg");
assert.equal(mimeForFileKind("pdf"), "application/pdf");

assert.ok(looksLikeOoxmlWord(ooxml));
assert.ok(!looksLikeOoxmlWord(bareZip));

// Correct content passes.
assert.equal(
  validateFileContent("cv.pdf", pdf, [".pdf", ".doc", ".docx"], "Resume"),
  null,
);
assert.equal(
  validateFileContent("cv.docx", ooxml, [".pdf", ".doc", ".docx"], "Resume"),
  null,
);
assert.equal(
  validateFileContent("photo.png", png, [".png", ".jpg"], "Photo"),
  null,
);

// Spoofed: exe renamed to .pdf is rejected.
assert.ok(
  validateFileContent("malware.pdf", exe, [".pdf"], "Resume"),
  "spoofed pdf rejected",
);
assert.ok(
  validateFileContent("cv.exe", exe, [".pdf"], "Resume"),
  "bad extension rejected",
);
assert.ok(
  validateFileContent("fake.pdf", png, [".pdf"], "Resume"),
  "png-as-pdf rejected",
);
assert.ok(
  validateFileContent("x.docx", bareZip, [".docx"], "Resume"),
  "bare zip as docx rejected",
);
assert.ok(
  validateFileContent("icon.svg.png", png, [".png"], "Photo"),
  "dangerous compound extension rejected",
);
assert.ok(
  validateFileContent("evil.pdf", svg, [".pdf"], "Resume"),
  "svg-as-pdf rejected",
);

console.log("file-signature self-check passed");
