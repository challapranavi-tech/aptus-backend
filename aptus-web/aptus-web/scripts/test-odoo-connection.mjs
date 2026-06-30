/**
 * Quick Odoo connection test — reads .env.local and prints status only (no secrets).
 * Usage: node scripts/test-odoo-connection.mjs
 */

import path from "path";
import { fileURLToPath } from "url";
import { loadEnvLocal, testOdooConnection } from "./load-env.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
loadEnvLocal(root);

const baseUrl = process.env.ODOO_BASE_URL ?? "";
const db = process.env.ODOO_DB ?? "";
const keyLen = (process.env.ODOO_API_KEY ?? "").length;

console.log("ODOO_BASE_URL:", baseUrl);
console.log("ODOO_DB:", db);
console.log("ODOO_API_KEY length:", keyLen);

if (keyLen === 0) {
  console.error("\nFAIL: ODOO_API_KEY is empty in .env.local");
  process.exit(1);
}

const result = await testOdooConnection();
console.log("\nResult:", result.ok ? "OK" : "FAIL", `(${result.status})`, result.message);

process.exit(result.ok ? 0 : 1);
