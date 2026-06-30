/**
 * Purge Odoo + local portal data for a demo account (keeps login in portal-accounts.json).
 *
 * Usage:
 *   node scripts/purge-demo-account.mjs demo@aptusinfotech.com
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DATA_DIR = path.join(ROOT, ".data");
const ENV_FILE = path.join(ROOT, ".env.local");

const emailArg = (process.argv[2] ?? "").trim().toLowerCase();
if (!emailArg) {
  console.error("Usage: node scripts/purge-demo-account.mjs <email>");
  process.exit(1);
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

async function odooCall(model, method, body) {
  const baseUrl = (process.env.ODOO_BASE_URL ?? "").replace(/\/$/, "");
  const response = await fetch(`${baseUrl}/json/2/${model}/${method}`, {
    method: "POST",
    headers: {
      Authorization: `bearer ${process.env.ODOO_API_KEY}`,
      "Content-Type": "application/json",
      "X-Odoo-Database": process.env.ODOO_DB,
    },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${model}.${method} (${response.status}): ${text.slice(0, 400)}`);
  }
  return text ? JSON.parse(text) : null;
}

async function tryOdoo(model, method, body) {
  try {
    return { ok: true, result: await odooCall(model, method, body) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

loadEnvFile(ENV_FILE);

const accountsPath = path.join(DATA_DIR, "portal-accounts.json");
const accounts = readJson(accountsPath, {});
const account = accounts[emailArg];

if (!account) {
  console.error(`No portal account found for ${emailArg}`);
  process.exit(1);
}

const userId = account.id;
const partnerId = account.partnerId;

console.log(`\nPurging data for ${emailArg}`);
console.log(`  portal user: ${userId}`);
console.log(`  Odoo partner: ${partnerId ?? "(none)"}\n`);

if (partnerId) {
  const leads = await odooCall("crm.lead", "search_read", {
    domain: [["partner_id", "=", partnerId]],
    fields: ["id", "name", "type", "stage_id"],
    limit: 200,
  });

  console.log(`CRM leads to remove: ${leads.length}`);
  if (leads.length) {
    for (const lead of leads) {
      console.log(`  - [${lead.id}] ${lead.name}`);
    }
    const unlinkLeads = await tryOdoo("crm.lead", "unlink", { ids: leads.map((l) => l.id) });
    console.log(unlinkLeads.ok ? `  ✓ CRM leads deleted` : `  ✗ CRM unlink failed: ${unlinkLeads.error}`);
  }

  const orders = await odooCall("sale.order", "search_read", {
    domain: [["partner_id", "=", partnerId]],
    fields: ["id", "name", "state", "subscription_state", "origin"],
    limit: 200,
  });

  console.log(`\nSale orders to remove: ${orders.length}`);
  for (const order of orders) {
    console.log(`  - [${order.id}] ${order.name} (${order.state}, sub: ${order.subscription_state || "—"})`);

    if (order.subscription_state && String(order.subscription_state).includes("progress")) {
      await tryOdoo("sale.order", "set_close", { ids: [order.id] });
      await tryOdoo("sale.order", "write", {
        ids: [order.id],
        vals: { subscription_state: "6_churn" },
      });
    }

    if (!["cancel", "done"].includes(order.state)) {
      await tryOdoo("sale.order", "action_cancel", { ids: [order.id] });
    }

    let unlink = await tryOdoo("sale.order", "unlink", { ids: [order.id] });
    if (!unlink.ok && order.state === "sale") {
      unlink = await tryOdoo("sale.order", "unlink", { ids: [order.id] });
    }
    if (!unlink.ok) {
      console.log(`    ✗ Odoo blocks hard delete on confirmed orders (cancelled/churn only)`);
    } else {
      console.log(`    ✓ deleted`);
    }
  }

  const remainingOrders = await odooCall("sale.order", "search_read", {
    domain: [["partner_id", "=", partnerId]],
    fields: ["id", "name", "state", "subscription_state"],
    limit: 20,
  });
  if (remainingOrders.length) {
    console.log(`\nRemaining sale orders (${remainingOrders.length}):`);
    for (const order of remainingOrders) {
      console.log(`  - [${order.id}] ${order.name} state=${order.state} sub=${order.subscription_state || "—"}`);
    }
  }
}

// Local .data cleanup
const auditPath = path.join(DATA_DIR, "audit-log.jsonl");
if (fs.existsSync(auditPath)) {
  const lines = fs.readFileSync(auditPath, "utf8").split(/\r?\n/).filter(Boolean);
  const kept = lines.filter((line) => {
    try {
      const row = JSON.parse(line);
      return row.actorId !== userId;
    } catch {
      return true;
    }
  });
  fs.writeFileSync(auditPath, kept.length ? `${kept.join("\n")}\n` : "", "utf8");
  console.log(`\nAudit log: removed ${lines.length - kept.length} entries`);
}

const paymentsPath = path.join(DATA_DIR, "payments.json");
const payments = readJson(paymentsPath, {});
const paymentIds = Object.keys(payments);
let paymentsRemoved = 0;
for (const id of paymentIds) {
  if (payments[id]?.userId === userId) {
    delete payments[id];
    paymentsRemoved += 1;
  }
}
writeJson(paymentsPath, payments);
console.log(`Payments: removed ${paymentsRemoved} records`);

const tokensPath = path.join(DATA_DIR, "refresh-tokens.json");
const tokens = readJson(tokensPath, {});
const tokenIds = Object.keys(tokens);
let tokensRemoved = 0;
for (const id of tokenIds) {
  if (tokens[id]?.userId === userId) {
    delete tokens[id];
    tokensRemoved += 1;
  }
}
writeJson(tokensPath, tokens);
console.log(`Refresh tokens: removed ${tokensRemoved} records`);

const ordersPath = path.join(DATA_DIR, "portal-orders.json");
const ordersStore = readJson(ordersPath, { orders: [] });
const beforeOrders = Array.isArray(ordersStore.orders) ? ordersStore.orders.length : 0;
ordersStore.orders = (ordersStore.orders ?? []).filter(
  (order) => order.actorId !== userId && order.partnerId !== partnerId,
);
writeJson(ordersPath, ordersStore);
console.log(`Portal orders: removed ${beforeOrders - ordersStore.orders.length} records`);

console.log("\nDone. Portal login preserved — clear browser localStorage for this user if the UI still shows stale cards.");
console.log("  Keys to remove in DevTools → Application → Local Storage:");
console.log("    aptusPortalSession");
console.log("    aptusPortalProfile");
console.log("    aptusPortalSubscriptionState");
