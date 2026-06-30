/** ponytail: fails if autocad product JSON loses required sections. */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const raw = JSON.parse(
  readFileSync(join(root, "content/odoo-json/autodesk/autocad.json"), "utf8"),
);

if (!raw.softwareInnerHero?.title) throw new Error("autocad softwareInnerHero title missing");
if (!Array.isArray(raw.cardSections) || raw.cardSections.length < 3) {
  throw new Error("autocad expects features + benefits + why-aptus cardSections");
}
if (!raw.testimonials?.items?.length) throw new Error("autocad testimonials required");
if (!raw.contactCta?.showForm) throw new Error("autocad contactCta form required");

console.log("autocad JSON structure OK");
