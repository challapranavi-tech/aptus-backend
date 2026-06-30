/**
 * Seed Page Sections JSON on Software category hub pages in Odoo.
 * Usage: node scripts/seed-software-pages-json.mjs
 *
 * Inner product pages (AutoCAD, etc.) are seeded later — category hubs first.
 */

import path from "path";
import { fileURLToPath } from "url";
import { loadEnvLocal } from "./load-env.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

loadEnvLocal(ROOT);

const FIELD_NAME = process.env.ODOO_CMS_PAGE_JSON_FIELD?.trim() || "x_page_sections_json";

/** Category hubs with existing website.page rows on staging Odoo. */
const CATEGORIES = [
  { id: 162, url: "/autodesk", accent: "Autodesk" },
  { id: 177, url: "/adobe", accent: "Adobe" },
  { id: 279, url: "/oracle", accent: "Oracle" },
  { id: 178, url: "/microsoft", accent: "Microsoft" },
  { id: 180, url: "/multimedia-software-solutions", accent: "Multimedia" },
  { id: 179, url: "/cyber-security-solution", accent: "Cyber Security Solutions" },
];

async function odooCall(model, method, body) {
  const baseUrl = (process.env.ODOO_BASE_URL ?? "").replace(/\/$/, "");
  const response = await fetch(`${baseUrl}/json/2/${model}/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.ODOO_API_KEY ?? ""}`,
      "Content-Type": "application/json",
      "X-Odoo-Database": process.env.ODOO_DB ?? "",
    },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${response.status}: ${text.slice(0, 400)}`);
  return JSON.parse(text);
}

for (const page of CATEGORIES) {
  const jsonString = JSON.stringify(
    {
      hero: { id: "hero", title: { accent: page.accent } },
      showContactCta: true,
    },
    null,
    2,
  );
  await odooCall("website.page", "write", {
    ids: [page.id],
    vals: { [FIELD_NAME]: jsonString },
  });
  console.log(`Seeded ${FIELD_NAME} on id=${page.id} (${page.url})`);
}

console.log("\nCategory hubs seeded (6 with Odoo pages).");
console.log("Create Odoo pages for: /electrical-software, /quantity-takeoff, /structural-software, /educational-software, /edms");
console.log("Test: http://localhost:3000/autodesk");
