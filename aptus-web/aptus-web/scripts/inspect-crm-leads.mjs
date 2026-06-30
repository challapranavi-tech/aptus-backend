/**
 * Inspect portal CRM records in Odoo staging.
 *
 * Usage (from aptus-web):
 *   node scripts/inspect-crm-leads.mjs
 *   node scripts/inspect-crm-leads.mjs 1052 1050
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
  return Array.isArray(value) ? `${value[0]} — ${value[1]}` : value;
}

loadEnvFile(ENV_FILE);

const ids = process.argv.slice(2).map(Number).filter(Boolean);

const portalLeads = await odooCall("crm.lead", "search_read", {
  domain: ids.length
    ? [["id", "in", ids]]
    : [
        ["name", "ilike", "Portal software order"],
        ["active", "=", true],
      ],
  fields: [
    "id",
    "name",
    "type",
    "active",
    "stage_id",
    "team_id",
    "company_id",
    "partner_id",
    "create_date",
  ],
  limit: ids.length || 15,
  order: "id desc",
});

console.log("\n=== Portal CRM records ===\n");
for (const lead of portalLeads) {
  console.log(`ID ${lead.id}: ${lead.name}`);
  console.log(`  type: ${lead.type} | active: ${lead.active}`);
  console.log(`  stage: ${label(lead.stage_id)}`);
  console.log(`  team:  ${label(lead.team_id)}`);
  console.log(`  company: ${label(lead.company_id)}`);
  console.log(`  partner: ${label(lead.partner_id)}`);
  console.log(`  created: ${lead.create_date}`);
  console.log("");
}

const teams = await odooCall("crm.team", "search_read", {
  domain: [["use_opportunities", "=", true]],
  fields: ["id", "name", "company_id", "sequence"],
  limit: 20,
});

console.log("=== CRM sales teams (use_opportunities) ===\n");
for (const team of teams.sort((a, b) => a.sequence - b.sequence)) {
  console.log(`  ${team.id}: ${team.name} (company: ${label(team.company_id)})`);
}

const stages = await odooCall("crm.stage", "search_read", {
  domain: [],
  fields: ["id", "name", "sequence", "team_ids", "is_won"],
  limit: 30,
});

console.log("\n=== CRM stages (first 30) ===\n");
for (const stage of stages.sort((a, b) => a.sequence - b.sequence)) {
  const teams = Array.isArray(stage.team_ids) ? stage.team_ids.join(", ") : stage.team_ids;
  console.log(`  ${stage.id}: ${stage.name} | teams: ${teams} | won: ${stage.is_won}`);
}
