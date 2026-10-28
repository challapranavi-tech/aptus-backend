/**
 * Runnable self-check for the application archive (writes to a temp dir only).
 * Run: npx --yes tsx backend/lib/application-archive.check.ts
 */
import assert from "node:assert/strict";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { archiveApplication } from "./application-archive";

async function main() {
  // Exercise the local-disk path deterministically.
  delete process.env.BLOB_READ_WRITE_TOKEN;
  const tmp = await mkdtemp(path.join(tmpdir(), "aptus-archive-"));
  process.env.APPLICATION_ARCHIVE_DIR = tmp;

  const dir = await archiveApplication({ candidateName: "Jane Doe" }, [
    { filename: "cert.pdf", content: Buffer.from("a") },
    { filename: "cert.pdf", content: Buffer.from("b") }, // duplicate name
    { filename: "../evil.pdf", content: Buffer.from("c") }, // traversal attempt
  ]);

  // Archive dir lives under the configured root, named after the candidate.
  assert.ok(dir.startsWith(tmp));
  assert.match(path.basename(dir), /jane-doe$/);

  const entries = (await readdir(dir)).sort();
  assert.ok(entries.includes("application.json"));
  assert.ok(entries.includes("cert.pdf"));
  assert.ok(entries.includes("cert-1.pdf")); // duplicate de-duped
  assert.ok(entries.includes("evil.pdf")); // basename-stripped, stays in dir

  // Traversal must not escape into the parent root.
  const parent = (await readdir(tmp)).filter((n) => n.endsWith(".pdf"));
  assert.deepEqual(parent, []);

  const fields = JSON.parse(
    await readFile(path.join(dir, "application.json"), "utf8"),
  );
  assert.equal(fields.candidateName, "Jane Doe");

  await rm(tmp, { recursive: true, force: true });
  console.log("application-archive.check.ts: ok");
}

void main();
