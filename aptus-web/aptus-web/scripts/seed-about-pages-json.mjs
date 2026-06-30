/**
 * Seed About Us section JSON on all about sub-pages in Odoo.
 * Usage: node scripts/seed-about-pages-json.mjs
 */

import path from "path";
import { fileURLToPath } from "url";
import { loadEnvLocal } from "./load-env.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

loadEnvLocal(ROOT);

const FIELD_NAME = process.env.ODOO_CMS_PAGE_JSON_FIELD?.trim() || "x_page_sections_json";

/** Odoo page id + default sections — keep in sync with about-pages-content.ts */
const PAGES = [
  {
    id: 249,
    url: "/our-story",
    sections: {
      hero: { id: "hero", title: { before: "Our", accent: "Pursuit" } },
      showKeyEnablers: true,
      showPartnerships: true,
    },
  },
  {
    id: 227,
    url: "/our-team",
    sections: {
      hero: { id: "hero", title: { before: "Management", accent: "Profile" } },
      team: { id: "team", eyebrow: "Our Team", title: { before: "Our core strength is our", accent: "team" } },
    },
  },
  {
    id: 165,
    url: "/aptus-policy",
    sections: {
      hero: { id: "hero", title: { before: "Modus", accent: "Operandi" } },
      showPartnerships: true,
    },
  },
  {
    id: 250,
    url: "/why-aptus-infotech",
    sections: {
      hero: { id: "hero", title: { before: "Why", accent: "Aptus Infotech" } },
      showPartnerships: true,
    },
  },
  {
    id: 251,
    url: "/winning-together",
    sections: {
      hero: { id: "hero", title: { accent: "Winning Together" } },
      showPartnerships: true,
    },
  },
  {
    id: 253,
    url: "/aptus-infotech-iso-certifications",
    sections: {
      hero: { id: "hero", title: { before: "Our", accent: "Certifications" } },
    },
  },
  {
    id: 209,
    url: "/career",
    sections: {
      hero: { id: "hero", title: { before: "Join Our Team at", accent: "Aptus Infotech" } },
    },
  },
  {
    id: 211,
    url: "/contact-us",
    sections: {
      contactInfo: { id: "contact", title: { before: "Company", accent: "Contact Information" } },
      showContactCta: false,
    },
  },
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
  const jsonString = JSON.stringify(page.sections, null, 2);
  await odooCall("website.page", "write", {
    ids: [page.id],
    vals: { [FIELD_NAME]: jsonString },
  });
  console.log(`Seeded ${FIELD_NAME} on id=${page.id} (${page.url})`);
}

console.log("\nAdd field via Studio: Page Sections JSON (Next.js)");
console.log("Test: http://localhost:3000/about-us and sub-pages");
