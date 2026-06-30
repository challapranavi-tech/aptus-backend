/**
 * Seed Page Sections JSON on Software inner (product) pages.
 * Usage: node scripts/seed-software-inner-pages-json.mjs
 */

import path from "path";
import { fileURLToPath } from "url";
import { loadEnvLocal } from "./load-env.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

loadEnvLocal(ROOT);

const FIELD_NAME = process.env.ODOO_CMS_PAGE_JSON_FIELD?.trim() || "x_page_sections_json";

const PAGES = [
  { id: 175, url: "/etap", accent: "ETAP" },
  { id: 254, url: "/adobe-business-creative-solutions", accent: "Adobe Business & Creative Solutions" },
  { id: 255, url: "/adobe-acrobat-pro", accent: "Adobe Acrobat Pro" },
  { id: 256, url: "/adobe-illustrator", accent: "Adobe Illustrator" },
  { id: 257, url: "/adobe-photoshop", accent: "Adobe Photoshop" },
  { id: 258, url: "/adobe-premiere-pro", accent: "Adobe Premiere Pro" },
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

for (const page of PAGES) {
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

console.log("\nTest Adobe: http://localhost:3000/adobe");
console.log("Test inner: http://localhost:3000/adobe-photoshop");
