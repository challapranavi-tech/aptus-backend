/**
 * Seed full content into Odoo aptus.autodesk.product records.
 * Creates missing products and updates existing ones with full JSON content.
 *
 * Usage: node scripts/seed-autodesk-products.mjs
 *
 * Requires:
 * - ODOO_BASE_URL, ODOO_API_KEY, ODOO_DB in .env.local
 * - aptus_autodesk_product module installed on Odoo
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { loadEnvLocal } from "./load-env.mjs";
import { AUTODESK_PRODUCT_SEED } from "./autodesk-product-seed-data.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

loadEnvLocal(ROOT);

const MODEL =
  process.env.ODOO_AUTODESK_PRODUCT_MODEL?.trim() || "aptus.autodesk.product";

const EXPORT_DIR = path.join(ROOT, "content", "odoo-json", "autodesk");

const WRITE_FIELDS = [
  "name",
  "url_slug",
  "active",
  "is_published",
  "is_featured",
  "product_category",
  "product_badge",
  "hero_title",
  "hero_subtitle",
  "product_overview",
  "product_description",
  "highlights_json",
  "key_benefits_json",
  "features_json",
  "industry_applications_json",
  "media_json",
  "downloads_json",
  "faqs_json",
  "testimonials_json",
  "cta_text",
  "cta_button_label",
  "cta_button_url",
  "seo_title",
  "seo_description",
  "seo_keywords",
  "sequence",
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
  if (!response.ok) throw new Error(`${model}.${method} ${response.status}: ${text.slice(0, 500)}`);
  return JSON.parse(text);
}

async function findProductBySlug(slug) {
  const rows = await odooCall(MODEL, "search_read", {
    domain: [["url_slug", "=", slug]],
    fields: ["id", "url_slug", "name"],
    limit: 1,
  });
  return rows[0] ?? null;
}

function toOdooVals(seed) {
  const { related_slugs: _related, ...rest } = seed;
  return {
    ...rest,
    active: true,
  };
}

function exportJsonFiles() {
  fs.mkdirSync(EXPORT_DIR, { recursive: true });

  for (const seed of AUTODESK_PRODUCT_SEED) {
    const { related_slugs, ...exportBody } = seed;
    const filePath = path.join(EXPORT_DIR, `${seed.url_slug}.json`);
    fs.writeFileSync(filePath, JSON.stringify({ ...exportBody, related_slugs }, null, 2), "utf8");
  }

  fs.writeFileSync(
    path.join(EXPORT_DIR, "README.md"),
    `# Autodesk product JSON exports

Templates for \`aptus.autodesk.product\` records. Regenerate with:

\`\`\`bash
npm run cms:seed-autodesk-products
\`\`\`
`,
    "utf8",
  );

  console.log(`Exported ${AUTODESK_PRODUCT_SEED.length} JSON files → content/odoo-json/autodesk/`);
}

async function main() {
  console.log(`Seeding ${AUTODESK_PRODUCT_SEED.length} products on model: ${MODEL}\n`);

  exportJsonFiles();

  const slugToId = new Map();
  let created = 0;
  let updated = 0;

  for (const seed of AUTODESK_PRODUCT_SEED) {
    const vals = toOdooVals(seed);
    const existing = await findProductBySlug(seed.url_slug);

    if (existing) {
      await odooCall(MODEL, "write", { ids: [existing.id], vals });
      slugToId.set(seed.url_slug, existing.id);
      console.log(`Updated id=${existing.id}  /${seed.url_slug}  (${seed.name})`);
      updated += 1;
    } else {
      const id = await odooCall(MODEL, "create", { vals_list: [vals] });
      const recordId = Array.isArray(id) ? id[0] : id;
      slugToId.set(seed.url_slug, recordId);
      console.log(`Created id=${recordId}  /${seed.url_slug}  (${seed.name})`);
      created += 1;
    }
  }

  console.log("\nLinking related products…");
  let linked = 0;

  for (const seed of AUTODESK_PRODUCT_SEED) {
    const productId = slugToId.get(seed.url_slug);
    if (!productId || !seed.related_slugs?.length) continue;

    const relatedIds = seed.related_slugs
      .map((slug) => slugToId.get(slug))
      .filter((id) => id && id !== productId);

    if (!relatedIds.length) continue;

    await odooCall(MODEL, "write", {
      ids: [productId],
      vals: { related_product_ids: [[6, 0, relatedIds]] },
    });

    console.log(`  /${seed.url_slug} → ${seed.related_slugs.join(", ")}`);
    linked += 1;
  }

  console.log(`\nDone: ${created} created, ${updated} updated, ${linked} related-product links.`);
  console.log("Test: http://localhost:3000/autocad");
  console.log("API:  http://localhost:3000/api/products/autocad");
}

main().catch((error) => {
  console.error("\nSeed failed:", error.message);
  if (error.message.includes("aptus.autodesk.product") || error.message.includes("404")) {
    console.error("\nInstall the Odoo module first:");
    console.error("  odoo-modules/aptus_autodesk_product → Odoo addons path → Apps → Install");
  }
  process.exit(1);
});
