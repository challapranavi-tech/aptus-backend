import fs from "fs";
import path from "path";

const root = "content/odoo-json";
const icons = new Set();
const images = new Set();
const slugs = new Set();

function walk(d) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, f.name);
    if (f.isDirectory()) walk(p);
    else if (f.name.endsWith(".json")) {
      slugs.add(f.name.replace(".json", ""));
      try {
        const str = fs.readFileSync(p, "utf8");
        for (const m of str.matchAll(/"icon"\s*:\s*"([^"]+)"/g)) icons.add(m[1]);
        for (const m of str.matchAll(/"imageSrc"\s*:\s*"([^"]+)"/g)) images.add(m[1]);
        for (const m of str.matchAll(/"src"\s*:\s*"([^"]+)"/g)) images.add(m[1]);
      } catch {
        /* skip */
      }
    }
  }
}
walk(root);

const autText = fs.readFileSync("data/autodesk-icons.ts", "utf8");
const elvText = fs.readFileSync("data/elv-icons.ts", "utf8");
const known = new Set([
  ...[...autText.matchAll(/"([^"]+)"\s*:\s*\{/g)].map((m) => m[1]),
  ...[...elvText.matchAll(/"([^"]+)"\s*:\s*\{/g)].map((m) => m[1]),
]);

const heroText = fs.readFileSync("data/software-product-media.ts", "utf8");
const heroKeys = new Set([...heroText.matchAll(/"([^"]+)"\s*:/g)].map((m) => m[1]));

const missingIcons = [...icons].filter((i) => !known.has(i)).sort();
const missingHero = [...slugs].filter((s) => !heroKeys.has(s)).sort();

const summary = { slugCount: slugs.size, iconCount: icons.size, missingIcons, missingHeroCount: missingHero.length, missingHero };

// Optional: node scripts/audit-assets.mjs --check-urls
if (process.argv.includes("--check-urls")) {
  const remote = [...images].filter((u) => u.startsWith("http"));
  const local = [...images].filter((u) => u.startsWith("/"));
  const badUrls = [];
  let ok = 0;
  for (const u of remote) {
    try {
      const r = await fetch(u, { method: "HEAD", redirect: "follow" });
      if (r.status >= 400) badUrls.push({ status: r.status, url: u });
      else ok++;
    } catch {
      badUrls.push({ status: "ERR", url: u });
    }
  }
  for (const u of local) {
    const file = path.join("../frontend/public", u.replace(/^\//, ""));
    if (fs.existsSync(file)) ok++;
    else badUrls.push({ status: "MISSING", url: u });
  }
  summary.imageUrls = { count: remote.length + local.length, ok, bad: badUrls.length, badUrls };
}

console.log(JSON.stringify(summary, null, 2));
