/**
 * Runnable self-check for resume text extraction.
 * Run: npx --yes tsx backend/lib/careers/extract-text.check.ts
 */
import assert from "node:assert/strict";
import zlib from "node:zlib";
import { extractResumeText } from "./extract-text";

/** Build a minimal stored-method (uncompressed) ZIP with one entry. */
function makeZip(
  name: string,
  content: string,
  declaredUncompSize?: number,
): Buffer {
  const nameBuf = Buffer.from(name, "utf8");
  const data = Buffer.from(content, "utf8");
  const crc = zlib.crc32 ? zlib.crc32(data) : 0;
  const size = declaredUncompSize ?? data.length;

  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(0, 6);
  local.writeUInt16LE(0, 8); // stored
  local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(data.length, 18);
  local.writeUInt32LE(size, 22);
  local.writeUInt16LE(nameBuf.length, 26);
  local.writeUInt16LE(0, 28);

  const localRecord = Buffer.concat([local, nameBuf, data]);

  const cen = Buffer.alloc(46);
  cen.writeUInt32LE(0x02014b50, 0);
  cen.writeUInt16LE(20, 4);
  cen.writeUInt16LE(20, 6);
  cen.writeUInt16LE(0, 8);
  cen.writeUInt16LE(0, 10); // stored
  cen.writeUInt32LE(crc, 16);
  cen.writeUInt32LE(data.length, 20);
  cen.writeUInt32LE(size, 24);
  cen.writeUInt16LE(nameBuf.length, 28);
  cen.writeUInt32LE(0, 42); // local header offset
  const cenRecord = Buffer.concat([cen, nameBuf]);

  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(1, 8);
  eocd.writeUInt16LE(1, 10);
  eocd.writeUInt32LE(cenRecord.length, 12);
  eocd.writeUInt32LE(localRecord.length, 16);

  return Buffer.concat([localRecord, cenRecord, eocd]);
}

const docxXml =
  '<?xml version="1.0"?><w:document><w:body>' +
  "<w:p><w:r><w:t>Jane Doe</w:t></w:r></w:p>" +
  "<w:p><w:r><w:t>jane@example.com</w:t></w:r></w:p>" +
  "</w:body></w:document>";

async function main() {
  const docx = makeZip("word/document.xml", docxXml);
  const text = await extractResumeText("resume.docx", docx);
  assert.ok(text.includes("Jane Doe"), "docx name extracted");
  assert.ok(text.includes("jane@example.com"), "docx email extracted");

  // Unknown/plain fallback still returns printable text.
  const plain = await extractResumeText("resume.txt", Buffer.from("Hello Resume 123"));
  assert.ok(plain.includes("Hello Resume"), "plain fallback works");

  // Corrupt input never throws.
  assert.equal(await extractResumeText("x.docx", Buffer.from("not a zip")), "");

  // Declared uncompressed size over the inflate cap → empty (zip-bomb guard).
  const bombXml = "x";
  const bomb = makeZip("word/document.xml", bombXml, 3 * 1024 * 1024);
  assert.equal(await extractResumeText("bomb.docx", bomb), "");

  console.log("extract-text self-check passed");
}

void main();
