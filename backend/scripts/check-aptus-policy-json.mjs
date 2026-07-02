/** ponytail: fails if aptus-policy JSON stops mapping to a single policy-panel section. */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const raw = JSON.parse(readFileSync(join(root, "content/odoo-json/aptus-policy.json"), "utf8"));

if (raw.intro?.variant !== "policy-panel") {
  throw new Error("aptus-policy intro must set variant policy-panel");
}
if (!Array.isArray(raw.featureRows) || raw.featureRows.length !== 3) {
  throw new Error("aptus-policy expects 3 qualification rows");
}
if (!raw.text?.title?.before || !raw.text?.paragraphs?.length) {
  throw new Error("aptus-policy privacy block missing");
}

console.log("aptus-policy JSON structure OK");
