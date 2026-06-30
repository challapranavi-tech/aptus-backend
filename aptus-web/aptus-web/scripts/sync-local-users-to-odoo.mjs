/**
 * Push accounts from .data/registered-users.json into Odoo staging (res.partner).
 *
 * Prerequisites:
 *   1. ODOO_API_KEY set in aptus-web/.env.local (Odoo → user menu → Account Security → API Keys)
 *   2. AUTH_DEMO_MODE=false in .env.local
 *   3. Restart dev server after changing env
 *
 * Run from aptus-web:
 *   npm run sync:odoo
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const USERS_FILE = path.join(ROOT, ".data", "registered-users.json");
const ENV_FILE = path.join(ROOT, ".env.local");

const PARTNER_FIELDS = ["name", "email", "phone", "street", "city", "country_id", "is_company"];

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

function requireEnv(name) {
  const value = (process.env[name] ?? "").trim();
  if (!value) {
    console.error(`Missing ${name}. Set it in .env.local before running this script.`);
    process.exit(1);
  }
  return value;
}

function isOdooConfigured() {
  const baseUrl = (process.env.ODOO_BASE_URL ?? "").replace(/\/$/, "");
  const apiKey = process.env.ODOO_API_KEY ?? "";
  const db = process.env.ODOO_DB ?? "";
  if (!baseUrl || !apiKey || !db) return false;
  if (apiKey === "placeholder" || apiKey === "placeholder-replace-with-real-key") return false;
  return true;
}

async function odooCall(baseUrl, apiKey, db, model, method, body) {
  const url = `${baseUrl}/json/2/${model}/${method}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `bearer ${apiKey}`,
      "Content-Type": "application/json",
      "X-Odoo-Database": db,
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Odoo ${model}.${method} (${response.status}): ${text}`);
  }
  return response.json();
}

async function findPartnerByEmail(baseUrl, apiKey, db, email) {
  const rows = await odooCall(baseUrl, apiKey, db, "res.partner", "search_read", {
    domain: [["email", "=", email.trim().toLowerCase()]],
    fields: PARTNER_FIELDS,
    limit: 1,
  });
  return rows[0] ?? null;
}

async function createPartner(baseUrl, apiKey, db, account) {
  const email = account.email.trim().toLowerCase();
  return odooCall(baseUrl, apiKey, db, "res.partner", "create", {
    vals_list: [
      {
        name: account.name,
        email,
        phone: account.phone ?? "",
        street: "",
        city: "",
        is_company: Boolean(account.company && account.company !== "New Customer"),
        customer_rank: 1,
      },
    ],
  });
}

function loadRegisteredUsers() {
  if (!fs.existsSync(USERS_FILE)) {
    console.log("No .data/registered-users.json — nothing to sync.");
    process.exit(0);
  }
  return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
}

function saveRegisteredUsers(data) {
  fs.mkdirSync(path.dirname(USERS_FILE), { recursive: true });
  fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2), "utf8");
}

async function main() {
  loadEnvFile(ENV_FILE);

  if (!isOdooConfigured()) {
    console.error(
      "Odoo is not configured. Add ODOO_API_KEY to .env.local, set AUTH_DEMO_MODE=false, then retry.",
    );
    process.exit(1);
  }

  const baseUrl = requireEnv("ODOO_BASE_URL").replace(/\/$/, "");
  const apiKey = requireEnv("ODOO_API_KEY");
  const db = requireEnv("ODOO_DB");

  const users = loadRegisteredUsers();
  const emails = Object.keys(users);
  if (emails.length === 0) {
    console.log("registered-users.json is empty — nothing to sync.");
    return;
  }

  console.log(`Syncing ${emails.length} local account(s) to Odoo (${db})…\n`);

  let updated = 0;
  for (const email of emails) {
    const account = users[email];
    if (account.partnerId) {
      console.log(`  skip ${email} — already linked (partner ${account.partnerId})`);
      continue;
    }

    let partnerId;
    const existing = await findPartnerByEmail(baseUrl, apiKey, db, email);
    if (existing) {
      partnerId = existing.id;
      console.log(`  link ${email} → existing contact #${partnerId} (${existing.name})`);
    } else {
      const created = await createPartner(baseUrl, apiKey, db, account);
      partnerId = Array.isArray(created) ? created[0] : created;
      console.log(`  create ${email} → new contact #${partnerId} (${account.name})`);
    }

    users[email] = {
      ...account,
      id: `partner-${partnerId}`,
      partnerId,
    };
    updated += 1;
  }

  if (updated > 0) {
    saveRegisteredUsers(users);
    console.log(`\nUpdated ${updated} account(s) in registered-users.json.`);
  }

  console.log("\nDone. In Odoo Contacts, search by Name or Email (not Address).");
  console.log("Restart npm run dev and confirm the login page shows “Odoo staging connected”.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
