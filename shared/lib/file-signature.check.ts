/**
 * Runnable self-check for magic-byte file-type detection.
 * Run: npx --yes tsx shared/lib/file-signature.check.ts
 */
import assert from "node:assert/strict";
import { sniffFileKind, validateFileContent } from "./file-signature";

const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]);
const docx = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0, 0]);
const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
const webp = new Uint8Array([0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50]);
const exe = new Uint8Array([0x4d, 0x5a, 0x90, 0x00]); // MZ (PE executable)

assert.equal(sniffFileKind(pdf), "pdf");
assert.equal(sniffFileKind(docx), "zip");
assert.equal(sniffFileKind(png), "png");
assert.equal(sniffFileKind(jpeg), "jpeg");
assert.equal(sniffFileKind(webp), "webp");
assert.equal(sniffFileKind(exe), "unknown");

// Correct content passes.
assert.equal(validateFileContent("cv.pdf", pdf, [".pdf", ".doc", ".docx"], "Resume"), null);
assert.equal(validateFileContent("cv.docx", docx, [".pdf", ".doc", ".docx"], "Resume"), null);
assert.equal(validateFileContent("photo.png", png, [".png", ".jpg"], "Photo"), null);

// Spoofed: exe renamed to .pdf is rejected.
assert.ok(validateFileContent("malware.pdf", exe, [".pdf"], "Resume"), "spoofed pdf rejected");
// Disallowed extension rejected before sniffing.
assert.ok(validateFileContent("cv.exe", exe, [".pdf"], "Resume"), "bad extension rejected");
// Image bytes uploaded as .pdf rejected.
assert.ok(validateFileContent("fake.pdf", png, [".pdf"], "Resume"), "png-as-pdf rejected");

console.log("file-signature self-check passed");
