/** ponytail: fails if autodesk landing JSON loses required sections. */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const raw = JSON.parse(readFileSync(join(root, "content/odoo-json/autodesk.json"), "utf8"));

if (!raw.hero?.title?.accent) throw new Error("autodesk hero title missing");
if (raw.hero?.variant !== "software-landing") throw new Error("autodesk hero must use software-landing variant");
if (!Array.isArray(raw.cardSections) || raw.cardSections.length < 2) {
  throw new Error("autodesk expects products + why-aptus cardSections");
}
const products = raw.cardSections.find((s) => s.id === "products");
if (!products?.items?.length || products.items.length < 8) {
  throw new Error("autodesk products grid must list 8 products");
}
if (!raw.midCta?.heading || !raw.contactCta?.showForm) {
  throw new Error("autodesk midCta + contactCta form required");
}

console.log("autodesk JSON structure OK");
