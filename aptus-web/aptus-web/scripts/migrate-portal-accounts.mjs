/**
 * One-time migration: registered-users.json → portal-accounts.json (hashed passwords).
 * Auto-runs on server start; use this script to migrate without starting the app.
 *
 *   npm run migrate:auth
 */

import fs from "fs";
import path from "path";
import { randomUUID, scryptSync, randomBytes } from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DATA_DIR = path.join(ROOT, ".data");
const ACCOUNTS_FILE = path.join(DATA_DIR, "portal-accounts.json");
const LEGACY_FILE = path.join(DATA_DIR, "registered-users.json");

const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64, SCRYPT_OPTIONS);
  return `scrypt:${salt.toString("base64")}:${hash.toString("base64")}`;
}

function accountId() {
  return `pa-${randomUUID()}`;
}

function loadJson(file) {
  if (!fs.existsSync(file)) return {};
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const accounts = loadJson(ACCOUNTS_FILE);
let migrated = 0;

if (fs.existsSync(LEGACY_FILE)) {
  const legacy = loadJson(LEGACY_FILE);
  for (const [key, row] of Object.entries(legacy)) {
    const email = (row.email || key).trim().toLowerCase();
    if (accounts[email]) continue;
    const { password, id: _id, partnerId, ...profile } = row;
    accounts[email] = {
      id: accountId(),
      email,
      passwordHash: hashPassword(password),
      partnerId,
      status: "active",
      createdAt: new Date().toISOString(),
      profile: { ...profile, email },
    };
    migrated += 1;
  }
  if (migrated > 0) {
    fs.renameSync(LEGACY_FILE, `${LEGACY_FILE}.migrated-${Date.now()}.bak`);
  }
}

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2), "utf8");

console.log(
  migrated > 0
    ? `Migrated ${migrated} account(s) to portal-accounts.json`
    : "No legacy accounts to migrate (already done or none found).",
);
