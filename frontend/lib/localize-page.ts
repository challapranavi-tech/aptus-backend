import type { Locale } from "@/lib/locale";
import { translateToArabic } from "@/lib/translate-text";
import type { Page } from "@/types";

/** Brand / product tokens that must stay Latin in Arabic pages. */
const DO_NOT_TRANSLATE = [
  "Aptus Infotech",
  "Aptus",
  "Autodesk",
  "AutoCAD",
  "Revit",
  "Civil 3D",
  "Navisworks",
  "Adobe",
  "Photoshop",
  "Illustrator",
  "Premiere Pro",
  "Acrobat",
  "Oracle",
  "Primavera",
  "Aconex",
  "Microsoft",
  "Power BI",
  "ANSYS",
  "ETAP",
  "Odoo",
  "Fortinet",
  "Sophos",
  "SonicWall",
  "Kaspersky",
  "Bluebeam",
  "Enscape",
  "SketchUp",
  "Sketchup",
  "Twinmotion",
  "V-Ray",
  "MATLAB",
  "Matlab",
  "Turnitin",
  "IBM SPSS",
  "Prokon",
  "Nitro",
  "Chaos Corona",
  "Luminon",
  "RIB CostX",
  "Planswift",
  "Cubicost",
  "SpectroNova",
  "InfoDrainage",
  "InfoWater",
  "InfoWorks",
  "BIM Collaborate",
  "3ds Max",
  "UPS",
  "CCTV",
  "SMATV",
  "IPTV",
  "ELV",
  "ISO",
  "OMR",
  "VAT",
].sort((a, b) => b.length - a.length);

const SKIP_KEYS = new Set([
  "id",
  "type",
  "order",
  "src",
  "href",
  "url",
  "slug",
  "image",
  "imageSrc",
  "logoSrc",
  "icon",
  "iconSrc",
  "poster",
  "video",
  "videoSrc",
  "bgImage",
  "backgroundImage",
  "className",
  "variant",
  "layout",
  "align",
  "theme",
  "color",
  "email",
  "phone",
  "tel",
  "whatsapp",
]);

function shouldSkipKey(key: string): boolean {
  const lower = key.toLowerCase();
  if (SKIP_KEYS.has(lower)) return true;
  if (lower.endsWith("href") || lower.endsWith("src") || lower.endsWith("url")) {
    return true;
  }
  if (lower.includes("image") || lower.includes("icon")) return true;
  return false;
}

function looksTranslatable(value: string): boolean {
  const v = value.trim();
  if (v.length < 2) return false;
  if (/^https?:\/\//i.test(v)) return false;
  if (/^mailto:/i.test(v) || /^tel:/i.test(v)) return false;
  if (/^\/[\w\-./?#=&%]+$/.test(v)) return false;
  if (/^[\d\s+()\-./]+$/.test(v)) return false;
  if (/^#[0-9a-f]{3,8}$/i.test(v)) return false;
  if (!/[a-zA-Z]/.test(v)) return false; // already non-Latin / symbols
  return true;
}

function protectBrands(text: string): { masked: string; tokens: string[] } {
  let masked = text;
  const tokens: string[] = [];
  for (const brand of DO_NOT_TRANSLATE) {
    if (!masked.includes(brand)) continue;
    const token = `__APTUS_BRAND_${tokens.length}__`;
    tokens.push(brand);
    masked = masked.split(brand).join(token);
  }
  return { masked, tokens };
}

function restoreBrands(text: string, tokens: string[]): string {
  let out = text;
  tokens.forEach((brand, i) => {
    out = out.split(`__APTUS_BRAND_${i}__`).join(brand);
  });
  return out;
}

type WalkHit = { path: Array<string | number>; value: string };

function collectStrings(value: unknown, path: Array<string | number>, out: WalkHit[]) {
  if (typeof value === "string") {
    if (looksTranslatable(value)) out.push({ path, value });
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, i) => collectStrings(item, [...path, i], out));
    return;
  }
  if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (shouldSkipKey(k)) continue;
      collectStrings(v, [...path, k], out);
    }
  }
}

function setAtPath(root: unknown, path: Array<string | number>, next: string) {
  let cur: unknown = root;
  for (let i = 0; i < path.length - 1; i++) {
    cur = (cur as Record<string | number, unknown>)[path[i]];
  }
  const last = path[path.length - 1];
  (cur as Record<string | number, unknown>)[last] = next;
}

/**
 * Deep-localize a CMS page for the active locale.
 * English is a no-op. Arabic uses cached machine translation when configured.
 */
export async function localizePage(
  page: Page,
  locale: Locale,
): Promise<Page> {
  if (locale !== "ar") return page;

  const clone = structuredClone(page) as Page;
  const hits: WalkHit[] = [];
  collectStrings(clone, [], hits);
  if (hits.length === 0) return clone;

  const unique = [...new Set(hits.map((h) => h.value))];
  const protectedList = unique.map((text) => protectBrands(text));
  const translatedMasked = await translateToArabic(
    protectedList.map((p) => p.masked),
  );
  const map = new Map<string, string>();
  unique.forEach((original, i) => {
    map.set(
      original,
      restoreBrands(translatedMasked[i] ?? original, protectedList[i].tokens),
    );
  });

  for (const hit of hits) {
    const next = map.get(hit.value);
    if (next && next !== hit.value) setAtPath(clone, hit.path, next);
  }

  return clone;
}
