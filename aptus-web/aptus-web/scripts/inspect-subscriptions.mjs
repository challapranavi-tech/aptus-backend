/**
 * Inspect sale orders + won CRM opportunities for a portal partner.
 *
 * Usage:
 *   node scripts/inspect-subscriptions.mjs 16426
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const ENV_FILE = path.join(ROOT, ".env.local");

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

async function odooCall(model, method, body) {
  const baseUrl = (process.env.ODOO_BASE_URL ?? "").replace(/\/$/, "");
  const apiKey = process.env.ODOO_API_KEY ?? "";
  const db = process.env.ODOO_DB ?? "";
  const response = await fetch(`${baseUrl}/json/2/${model}/${method}`, {
    method: "POST",
    headers: {
      Authorization: `bearer ${apiKey}`,
      "Content-Type": "application/json",
      "X-Odoo-Database": db,
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`${model}.${method} (${response.status}): ${await response.text()}`);
  }
  return response.json();
}

function label(value) {
  return Array.isArray(value) ? `${value[0]} — ${value[1]}` : String(value ?? "—");
}

loadEnvFile(ENV_FILE);

const partnerId = Number(process.argv[2] || 16426);

console.log(`\n=== Partner ${partnerId} — sale orders (portal filter) ===\n`);

const portalOrders = await odooCall("sale.order", "search_read", {
  domain: [
    ["partner_id", "=", partnerId],
    ["origin", "ilike", "Aptus Customer Portal"],
  ],
  fields: [
    "name",
    "state",
    "subscription_state",
    "date_order",
    "next_invoice_date",
    "order_line",
    "origin",
  ],
  limit: 20,
  order: "id desc",
});

if (!portalOrders.length) {
  console.log("  (no portal-origin sale orders)");
} else {
  for (const order of portalOrders) {
    console.log(`${order.name} | state: ${order.state} | subscription_state: ${order.subscription_state ?? "—"}`);
    console.log(`  date_order: ${order.date_order} | next_invoice: ${order.next_invoice_date}`);
  }
}

console.log(`\n=== Partner ${partnerId} — ALL sale orders with subscription_state ===\n`);

const subOrders = await odooCall("sale.order", "search_read", {
  domain: [["partner_id", "=", partnerId]],
  fields: [
    "name",
    "state",
    "subscription_state",
    "date_order",
    "next_invoice_date",
    "origin",
    "order_line",
  ],
  limit: 30,
  order: "id desc",
});

for (const order of subOrders) {
  console.log(
    `${order.name} | state: ${order.state} | subscription: ${order.subscription_state ?? "—"} | origin: ${order.origin ?? "—"}`,
  );
}

console.log(`\n=== Partner ${partnerId} — order lines (serial_number) ===\n`);

const lineIds = [...new Set(subOrders.flatMap((o) => o.order_line ?? []))];
if (lineIds.length) {
  const lines = await odooCall("sale.order.line", "read", {
    ids: lineIds,
    fields: ["name", "product_id", "serial_number", "order_id"],
  });
  for (const line of lines) {
    console.log(
      `  ${label(line.product_id)} | serial: ${line.serial_number || "(empty)"} | order: ${label(line.order_id)}`,
    );
  }
}

console.log(`\n=== Partner ${partnerId} — CRM opportunities (portal + won) ===\n`);

const leads = await odooCall("crm.lead", "search_read", {
  domain: [
    ["partner_id", "=", partnerId],
    ["name", "ilike", "Portal"],
  ],
  fields: [
    "name",
    "type",
    "stage_id",
    "probability",
    "order_ids",
    "active",
  ],
  limit: 20,
  order: "id desc",
});

for (const lead of leads) {
  console.log(`${lead.name}`);
  console.log(`  stage: ${label(lead.stage_id)} | prob: ${lead.probability} | orders: ${lead.order_ids?.length ?? 0}`);
}

console.log(`\n=== Query used by portal (subscription_state = progress) ===\n`);

const active = await odooCall("sale.order", "search_read", {
  domain: [
    ["partner_id", "=", partnerId],
    ["subscription_state", "=", "progress"],
  ],
  fields: ["name", "subscription_state", "state"],
  limit: 10,
});

console.log(`  matches: ${active.length}`);
for (const order of active) {
  console.log(`  ${order.name} (${order.state})`);
}
