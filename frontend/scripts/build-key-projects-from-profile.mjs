/**
 * Build keyProjects for Solutions in Action from docx-tmp/projects.docx.
 * Uses document order: each project card is paired with the image next to it.
 *
 * Prerequisite: node frontend/scripts/extract-projects-docx.mjs
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const docxPath = path.join(root, "docx-tmp/projects.docx");
const imageSrcDir = path.join(root, "docx-tmp/projects-images");
const imageDestDir = path.join(root, "frontend/public/images/key-projects");
const caseStudiesPath = path.join(
  root,
  "backend/content/odoo-json/case-studies/aptus-case-studies.json",
);
const frontendCaseStudiesPath = path.join(root, "frontend/content/case-studies.json");

/** Card photos sit between tiny icons (~1–3KB) and page banners (~400KB+). */
const MIN_CARD_BYTES = 3500;
const MAX_CARD_BYTES = 200_000;

function decodeXml(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function normalize(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

function extFor(name) {
  return path.extname(name).slice(1).toLowerCase() || "jpg";
}

function isSkipLine(line) {
  return !line || /^Our Key Projects$/i.test(line);
}

/** Description / body lines (as used in this Word export). */
function isDescriptionLine(line) {
  return /^(We |For |In |A true |One of |Healthcare |Public Authority|Adobe.|Khazzan |PABX |UTAS |From early|Provided |Executed |Implemented |Our skilled|AV Video Set-up|\| PA Systems|Fiber To The Office \(FTTO\) Solution)/i.test(
    line,
  );
}

function isTitleContinuation(previous, current) {
  return (
    /(?:&|,|\|)\s*$/.test(previous.trim()) ||
    current.startsWith("|") ||
    (/^Sultanate of Oman$/i.test(current) && /^Ministry of Defense$/i.test(previous)) ||
    (/^Sohar University\.?$/i.test(current) && /Hostel for$/i.test(previous)) ||
    (/^Guest Management System$/i.test(current) && /Security &$/i.test(previous))
  );
}

function isDescContinuation(previous, current) {
  return (
    current.startsWith("|") ||
    /(?:&|,|\|)\s*$/.test(previous.trim()) ||
    (/^Sohar University\.?$/i.test(current) && /Hostel for$/i.test(previous))
  );
}

function dedupeConsecutive(lines) {
  const out = [];
  for (const line of lines) {
    if (out.length && normalize(out[out.length - 1]) === normalize(line)) continue;
    out.push(line);
  }
  return out;
}

function extractPairs(lines) {
  const deduped = dedupeConsecutive(lines);
  const pairs = [];
  let i = 0;

  while (i < deduped.length) {
    // Skip orphan description lines at boundaries.
    if (isDescriptionLine(deduped[i]) && !isTitleContinuation("", deduped[i])) {
      // Allow description-first cards only when next line looks like a short title? Skip for now.
      i += 1;
      continue;
    }

    const titleParts = [deduped[i]];
    i += 1;
    while (i < deduped.length && !isDescriptionLine(deduped[i]) && isTitleContinuation(titleParts.at(-1), deduped[i])) {
      titleParts.push(deduped[i]);
      i += 1;
    }

    // Special: "Steering Students..." title then "Executed..." desc then "Sohar University."
    // Special: title then description
    if (i >= deduped.length) break;

    if (!isDescriptionLine(deduped[i])) {
      // Two short title lines without desc yet — e.g. Ministry of Defense / Sultanate of Oman
      if (
        titleParts.length === 1 &&
        deduped[i].length < 40 &&
        !isDescriptionLine(deduped[i])
      ) {
        titleParts.push(deduped[i]);
        i += 1;
      } else {
        // Not a valid card — advance
        continue;
      }
    }

    if (i >= deduped.length || !isDescriptionLine(deduped[i])) continue;

    const descParts = [deduped[i]];
    i += 1;
    while (
      i < deduped.length &&
      (isDescContinuation(descParts.at(-1), deduped[i]) ||
        (isDescriptionLine(deduped[i]) &&
          descParts.length < 3 &&
          normalize(deduped[i]) !== normalize(titleParts[0])))
    ) {
      // Stop if this looks like the start of the duplicated card (same title again)
      if (normalize(deduped[i]) === normalize(titleParts.join(" "))) break;
      // Stop if next title-sized non-desc line arrives after we already have a full sentence desc
      if (
        !isDescriptionLine(deduped[i]) &&
        !isDescContinuation(descParts.at(-1), deduped[i])
      ) {
        break;
      }
      // Don't swallow the next card's title that was misclassified
      if (
        !isDescContinuation(descParts.at(-1), deduped[i]) &&
        isDescriptionLine(deduped[i]) &&
        descParts.length >= 1 &&
        deduped[i].length < 120 &&
        /^(Complete |Design |Network |Audio |Video |Software |Autodesk|Ministry |Fiber |IP CCTV|Trespass|Multi-functional|Promoted|Civil engineering|BIM |Guest |State of|The best|End-to-End|Barrier|Leveraging|Proper security|Attendance|Unlocking|Steering|SecurityInfrastructure|PA & AV|Networking)/i.test(
          deduped[i],
        )
      ) {
        break;
      }
      descParts.push(deduped[i]);
      i += 1;
    }

    // Attach trailing "Sohar University." to prior desc when present
    if (i < deduped.length && /^Sohar University\.?$/i.test(deduped[i])) {
      descParts.push(deduped[i]);
      i += 1;
    }

    const title = decodeXml(titleParts.join(" "));
    const description = decodeXml(descParts.join(" "));
    if (!title || !description) continue;

    // Skip immediate duplicate of previous card (Word page repeats)
    if (pairs.length && normalize(pairs.at(-1).title) === normalize(title)) continue;

    pairs.push({ title, description });
  }

  // Global title dedupe keep first
  const seen = new Set();
  return pairs.filter((pair) => {
    const key = normalize(pair.title);
    if (!key || seen.has(key)) return false;
    // Avoid ultra-generic duplicate "Complete ELV Solutions" collapsing distinct sites —
    // keep first only when titles match exactly; distinct titles already differ.
    seen.add(key);
    return true;
  });
}

function parseDocx() {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "pdocx-build-"));
  spawnSync(
    "powershell",
    [
      "-NoProfile",
      "-Command",
      `Copy-Item '${docxPath}' '${temp}/doc.zip'; Expand-Archive '${temp}/doc.zip' '${temp}/extracted' -Force`,
    ],
    { stdio: "pipe" },
  );

  const docXml = fs.readFileSync(path.join(temp, "extracted/word/document.xml"), "utf8");
  const relsXml = fs.readFileSync(
    path.join(temp, "extracted/word/_rels/document.xml.rels"),
    "utf8",
  );
  const relMap = Object.fromEntries(
    [...relsXml.matchAll(/Id="([^"]+)"[^>]*Target="([^"]+)"/g)].map((m) => [
      m[1],
      m[2].replace(/^.*\//, ""),
    ]),
  );
  const mediaSrc = path.join(temp, "extracted/word/media");
  const sizeOf = (name) => {
    const p = path.join(mediaSrc, name);
    return fs.existsSync(p) ? fs.statSync(p).size : 0;
  };
  const isCard = (name) => {
    if (!name?.startsWith("image")) return false;
    const size = sizeOf(name);
    return size >= MIN_CARD_BYTES && size <= MAX_CARD_BYTES;
  };

  const body = docXml.match(/<w:body[\s>]([\s\S]*)<\/w:body>/)?.[1] ?? docXml;
  const paras = [...body.matchAll(/<w:p[\s>][\s\S]*?<\/w:p>/g)].map((m) => m[0]);

  const cardImages = [];
  const textLines = [];

  for (const p of paras) {
    const texts = decodeXml(
      [...p.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)]
        .map((m) => m[1])
        .join(""),
    );
    const embeds = [...p.matchAll(/r:embed="([^"]+)"/g)].map((m) => m[1]);
    for (const id of embeds) {
      const file = relMap[id];
      if (isCard(file)) cardImages.push(file);
    }
    if (texts && !isSkipLine(texts)) textLines.push(texts);
  }

  // Ensure card images are available under projects-images/
  fs.mkdirSync(imageSrcDir, { recursive: true });
  const copied = new Set();
  for (const name of cardImages) {
    if (copied.has(name)) continue;
    copied.add(name);
    fs.copyFileSync(path.join(mediaSrc, name), path.join(imageSrcDir, name));
  }

  fs.rmSync(temp, { recursive: true, force: true });

  const pairs = extractPairs(textLines);
  const count = Math.min(pairs.length, cardImages.length);
  const projects = [];
  for (let i = 0; i < Math.max(pairs.length, cardImages.length); i += 1) {
    const pair = pairs[i];
    const image = cardImages[i] ?? cardImages[cardImages.length - 1];
    if (!pair || !image) continue;
    projects.push({ ...pair, image });
  }

  // If more pairs than images, still include remaining pairs with last/available images
  for (let i = cardImages.length; i < pairs.length; i += 1) {
    const image = cardImages[i % cardImages.length];
    projects.push({ ...pairs[i], image });
  }

  console.log(
    `Parsed ${pairs.length} project texts and ${cardImages.length} card images → ${projects.length} paired.`,
  );
  return { projects, pairs, cardImages, count };
}

function main() {
  if (!fs.existsSync(docxPath)) {
    console.error("Missing", docxPath);
    process.exit(1);
  }

  const { projects } = parseDocx();
  if (!projects.length) {
    console.error("No projects parsed.");
    process.exit(1);
  }

  fs.mkdirSync(imageDestDir, { recursive: true });
  for (const file of fs.readdirSync(imageDestDir)) {
    if (/^\d{2}-/.test(file)) fs.unlinkSync(path.join(imageDestDir, file));
  }

  const items = [];
  for (const project of projects) {
    const source = path.join(imageSrcDir, project.image);
    if (!fs.existsSync(source)) {
      console.warn("Missing", project.image, "for", project.title);
      continue;
    }
    const index = items.length + 1;
    const base = `${String(index).padStart(2, "0")}-${slugify(project.title)}.${extFor(project.image)}`;
    fs.copyFileSync(source, path.join(imageDestDir, base));
    items.push({
      title: project.title,
      description: project.description,
      imageSrc: `/images/key-projects/${base}`,
      imageAlt: project.title,
    });
  }

  const caseStudies = JSON.parse(fs.readFileSync(caseStudiesPath, "utf8"));
  delete caseStudies.painPoints;
  delete caseStudies.whyChoose;
  delete caseStudies.testimonials;
  delete caseStudies.partnerships;
  caseStudies.keyProjects = {
    id: "keyProjects",
    visible: true,
    title: { before: "Our", accent: "Key Projects" },
    items,
  };

  fs.writeFileSync(caseStudiesPath, `${JSON.stringify(caseStudies, null, 2)}\n`);
  fs.writeFileSync(frontendCaseStudiesPath, `${JSON.stringify(caseStudies, null, 2)}\n`);

  console.log(`Updated keyProjects (${items.length} items).`);
  items.forEach((item, i) => {
    console.log(
      `${String(i + 1).padStart(2, "0")} ${path.basename(item.imageSrc).slice(0, 42).padEnd(42)} | ${item.title.slice(0, 55)}`,
    );
  });
}

main();
