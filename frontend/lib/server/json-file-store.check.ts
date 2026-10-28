/**
 * Self-check: a read-only filesystem (Vercel) must not turn a local JSON cache
 * write into a request failure, while real write errors still propagate.
 * Run: npx --yes tsx --tsconfig tsconfig.json lib/server/json-file-store.check.ts
 */
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import { writeJsonStore } from "./json-file-store";

const target = path.join(os.tmpdir(), "aptus-json-file-store.check.json");
const realWriteFileSync = fs.writeFileSync;

function failWith(code: string): void {
  fs.writeFileSync = () => {
    throw Object.assign(new Error(`simulated ${code}`), { code });
  };
}

try {
  writeJsonStore(target, { ok: true });
  assert.deepEqual(JSON.parse(fs.readFileSync(target, "utf8")), { ok: true });

  // Read-only serverless FS (Vercel mkdir often returns ENOENT) — skipped, not thrown.
  for (const code of ["EROFS", "EACCES", "EPERM", "ENOENT"]) {
    failWith(code);
    writeJsonStore(target, { ok: true });
  }

  // Anything else is a real failure and must surface.
  failWith("ENOSPC");
  assert.throws(() => writeJsonStore(target, { ok: true }), /simulated ENOSPC/);
} finally {
  fs.writeFileSync = realWriteFileSync;
  fs.rmSync(target, { force: true });
}

console.log("json-file-store.check: ok");
