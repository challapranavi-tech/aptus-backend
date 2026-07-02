import fs from "fs";
import path from "path";

const icons = new Set();
function walk(d) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, f.name);
    if (f.isDirectory()) walk(p);
    else if (f.name.endsWith(".json")) {
      const s = fs.readFileSync(p, "utf8");
      for (const m of s.matchAll(/"icon"\s*:\s*"([^"]+)"/g)) icons.add(m[1]);
    }
  }
}
walk("content/odoo-json");

const features = fs.readFileSync("../frontend/components/sections/Features.tsx", "utf8");
const hardcoded = new Set([...features.matchAll(/if \(name === "([^"]+)"/g)].map((m) => m[1]));
const aut = new Set([...fs.readFileSync("data/autodesk-icons.ts", "utf8").matchAll(/"([^"]+)"\s*:\s*\{/g)].map((m) => m[1]));
const elv = new Set([...fs.readFileSync("data/elv-icons.ts", "utf8").matchAll(/"([^"]+)"\s*:\s*\{/g)].map((m) => m[1]));

const unresolved = [...icons].filter((i) => !hardcoded.has(i) && !aut.has(i) && !elv.has(i)).sort();
console.log("icons in JSON:", icons.size);
console.log("unresolved by Features (would render empty):", unresolved.length);
console.log(unresolved.join(", "));
