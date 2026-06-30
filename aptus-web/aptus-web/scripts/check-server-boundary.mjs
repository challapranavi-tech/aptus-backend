#!/usr/bin/env node
/**
 * Enforce server secret boundary — run after significant changes:
 *   npm run check:boundary
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "src");

const SECRET_PATTERNS = [
  /STRIPE_SECRET/,
  /JWT_SECRET/,
  /JWT_PRIVATE_KEY/,
  /SMTP_PASS/,
  /DATABASE_URL/,
  /ODOO_API_KEY/,
  /PII_ENCRYPTION_KEY/,
  /process\.env\.OTP_TEST_CODE/,
];

const ALLOWED_PREFIXES = [
  path.join(src, "app", "api") + path.sep,
  path.join(src, "lib", "server") + path.sep,
];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/\.(ts|tsx)$/.test(entry.name)) files.push(full);
  }
  return files;
}

function isAllowed(file) {
  return ALLOWED_PREFIXES.some((prefix) => file.startsWith(prefix));
}

function rel(file) {
  return path.relative(root, file).replace(/\\/g, "/");
}

const violations = [];

for (const file of walk(src)) {
  const content = fs.readFileSync(file, "utf8");
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/from\s+["']@\/lib\/server|from\s+["'].*lib\/server/.test(line)) {
      if (!isAllowed(file) && file !== path.join(src, "middleware.ts")) {
        violations.push(`${rel(file)}:${i + 1} imports lib/server outside allowed paths`);
      }
    }

    if (/NEXT_PUBLIC_/.test(line)) {
      violations.push(`${rel(file)}:${i + 1} uses NEXT_PUBLIC_`);
    }

    for (const pattern of SECRET_PATTERNS) {
      if (pattern.test(line) && !isAllowed(file)) {
        violations.push(`${rel(file)}:${i + 1} references secret env outside api/server`);
      }
    }
  }
}

if (violations.length) {
  console.error("Server boundary check FAILED:\n");
  for (const v of violations) console.error(`  - ${v}`);
  process.exit(1);
}

console.log("Server boundary check passed.");
