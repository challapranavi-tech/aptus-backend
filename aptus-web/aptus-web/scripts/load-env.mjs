import fs from "fs";

/**
 * Load variables from .env.local into process.env.
 * Always overrides existing values so file edits take effect in scripts.
 */
export function loadEnvLocal(rootDir) {
  const envFile = `${rootDir}/.env.local`;
  if (!fs.existsSync(envFile)) return false;

  for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
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
    process.env[key] = value;
  }

  return true;
}

export async function testOdooConnection() {
  const baseUrl = (process.env.ODOO_BASE_URL ?? "").replace(/\/$/, "");
  const apiKey = process.env.ODOO_API_KEY ?? "";
  const db = process.env.ODOO_DB ?? "";

  if (!baseUrl || !apiKey || !db) {
    return { ok: false, status: 0, message: "Missing ODOO_BASE_URL, OODO_API_KEY, or ODOO_DB" };
  }

  const response = await fetch(`${baseUrl}/json/2/res.partner/search_read`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "X-Odoo-Database": db,
    },
    body: JSON.stringify({ domain: [["id", ">", 0]], fields: ["name"], limit: 1 }),
  });

  const text = await response.text();
  if (!response.ok) {
    let message = text.slice(0, 200);
    try {
      const json = JSON.parse(text);
      message = json.message ?? message;
    } catch {
      /* keep raw snippet */
    }
    return { ok: false, status: response.status, message };
  }

  return { ok: true, status: response.status, message: "Connected" };
}
