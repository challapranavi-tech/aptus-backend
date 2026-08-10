/**
 * Run every assert-based *.check.ts (shared + backend + frontend).
 * Exit non-zero on the first failure.
 */
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// security: frontend/lib/server/*.check.ts covers auth, payments, and rate
// limiting — those checks must actually run, not just exist on disk.
const roots = [path.join(root, "shared"), path.join(root, "backend"), path.join(root, "frontend")];
const tsxCli = require.resolve("tsx/cli");

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next") continue;
    const full = path.join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (name.endsWith(".check.ts")) out.push(full);
  }
  return out;
}

const checks = roots.flatMap((r) => walk(r)).sort();
if (checks.length === 0) {
  console.error("run-checks: no *.check.ts files found");
  process.exit(1);
}

console.log(`run-checks: ${checks.length} file(s)`);
for (const file of checks) {
  const rel = path.relative(root, file);
  // Backend/frontend checks import @/* and @shared/* — need their own tsconfig paths.
  const cwd = rel.startsWith(`backend${path.sep}`)
    ? path.join(root, "backend")
    : rel.startsWith(`frontend${path.sep}`)
      ? path.join(root, "frontend")
      : root;
  // Invoke via node + tsx/cli so paths with spaces work on Windows.
  const result = spawnSync(process.execPath, [tsxCli, file], {
    cwd,
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) {
    console.error(`FAIL ${rel}`);
    process.exit(result.status ?? 1);
  }
  console.log(`ok   ${rel}`);
}
