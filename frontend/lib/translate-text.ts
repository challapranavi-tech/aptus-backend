import portfolioRows from "@/data/product-portfolio.json";
import { sharedArabic } from "@/locales/shared-ar";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const CURL = process.platform === "win32" ? "curl.exe" : "curl";
const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

const memoryCache = new Map<string, { value: string; expiresAt: number }>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24h
let warnedMissingKey = false;

function cacheKey(text: string, target: string): string {
  return createHash("sha256").update(`${target}\0${text}`).digest("hex");
}

async function redisGet(key: string): Promise<string | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  try {
    const res = await fetch(`${url}/get/i18n:${key}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { result?: string | null };
    return typeof data.result === "string" ? data.result : null;
  } catch {
    return null;
  }
}

async function redisSet(key: string, value: string): Promise<void> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return;
  try {
    await fetch(`${url}/set/i18n:${key}/${encodeURIComponent(value)}?EX=86400`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch {
    /* ignore cache write failures */
  }
}

/** Product and company names that stay Latin in Arabic copy. Longest first. */
const KEEP_LATIN_BASE = [
  "Aptus Infotech",
  "Forma Design Collaboration",
  "Chaos Corona",
  "Civil 3D",
  "Premiere Pro",
  "Power BI",
  "IBM SPSS",
  "RIB CostX",
  "3ds Max",
  "SketchUp",
  "Sketchup",
  "Twinmotion",
  "Navisworks",
  "Illustrator",
  "Photoshop",
  "Primavera",
  "Bluebeam",
  "Autodesk",
  "AutoCAD",
  "Acrobat",
  "Fortinet",
  "Kaspersky",
  "SonicWall",
  "Microsoft",
  "InfoDrainage",
  "InfoWater",
  "InfoWorks",
  "SpectroNova",
  "Cubicost",
  "Planswift",
  "Prokon",
  "MATLAB",
  "Matlab",
  "Turnitin",
  "Enscape",
  "V-Ray",
  "Adobe",
  "Oracle",
  "Aconex",
  "ANSYS",
  "Sophos",
  "Nitro",
  "Luminon",
  "Forma",
  "Revit",
  "ETAP",
  "Odoo",
  "Aptus",
  "SMATV",
  "CCTV",
  "IPTV",
  "ELV",
  "ISO",
  "OMR",
  "UPS",
  "VAT",
];

/** Portfolio brand and product names. These stay Latin inside Arabic sentences. */
const PORTFOLIO_NAMES = (portfolioRows as { brand: string; product: string }[]).flatMap(
  (row) => [row.brand, row.product],
);

const KEEP_LATIN = [...new Set([...KEEP_LATIN_BASE, ...PORTFOLIO_NAMES])].sort(
  (a, b) => b.length - a.length,
);

const BRAND_EXACT = new Set(KEEP_LATIN.map((brand) => brand.toLowerCase()));

/** True when `name` is a brand or product that must not be translated. */
export function protectsLatinName(name: string): boolean {
  return BRAND_EXACT.has(name.trim().toLowerCase());
}
const SENTINEL = "\n§§§\n";

/** Pull the translated string out of a Google `translate_a/single` payload. */
export function parseGtxPayload(data: unknown): string {
  if (!Array.isArray(data) || !Array.isArray(data[0])) return "";
  return (data[0] as unknown[])
    .map((part) => (Array.isArray(part) && typeof part[0] === "string" ? part[0] : ""))
    .join("");
}

/** Split a batched translation. Returns null when the sentinel count does not match. */
export function splitSentinel(joined: string, count: number): string[] | null {
  const parts = joined.split("§§§").map((part) => part.replace(/^\n/, "").replace(/\n$/, ""));
  if (parts.length !== count) return null;
  return parts;
}

function maskBrands(text: string): { masked: string; tokens: string[] } {
  let masked = text;
  const tokens: string[] = [];
  for (const brand of KEEP_LATIN) {
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

/** A cached Arabic string is stale when it translated a brand or product name away. */
function keepsLatinNames(source: string, translated: string): boolean {
  for (const name of KEEP_LATIN) {
    if (source.includes(name) && !translated.includes(name)) return false;
  }
  return true;
}

function remember(key: string, value: string) {
  memoryCache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  void redisSet(key, value);
  diskDirty = true;
}

let diskLoaded = false;
let diskDirty = false;
let diskTimer: ReturnType<typeof setTimeout> | undefined;

function diskFile(): string {
  return path.join(process.cwd(), ".next", "cache", "i18n-ar.json");
}

function loadDiskCache() {
  if (diskLoaded) return;
  diskLoaded = true;
  try {
    const parsed = JSON.parse(readFileSync(diskFile(), "utf8")) as {
      savedAt?: number;
      entries?: Record<string, string>;
    };
    if (!parsed.entries || !parsed.savedAt) return;
    if (Date.now() - parsed.savedAt > 7 * CACHE_TTL_MS) return;
    const expiresAt = Date.now() + CACHE_TTL_MS;
    for (const [key, value] of Object.entries(parsed.entries)) {
      if (typeof value === "string") memoryCache.set(key, { value, expiresAt });
    }
  } catch {
    /* no cache yet */
  }
}

function scheduleDiskWrite() {
  if (!diskDirty) return;
  if (diskTimer) clearTimeout(diskTimer);
  diskTimer = setTimeout(() => {
    diskTimer = undefined;
    if (!diskDirty) return;
    diskDirty = false;
    try {
      const entries: Record<string, string> = {};
      for (const [key, hit] of memoryCache) entries[key] = hit.value;
      const file = diskFile();
      mkdirSync(path.dirname(file), { recursive: true });
      writeFileSync(file, JSON.stringify({ savedAt: Date.now(), entries }));
    } catch {
      /* cache is optional */
    }
  }, 400);
}

async function translateOfficial(texts: string[], apiKey: string): Promise<string[]> {
  const out = texts.slice();
  const CHUNK = 40;
  for (let offset = 0; offset < texts.length; offset += CHUNK) {
    const chunk = texts.slice(offset, offset + CHUNK);
    try {
      const res = await fetch(
        `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ q: chunk, source: "en", target: "ar", format: "text" }),
          cache: "no-store",
          signal: AbortSignal.timeout(20_000),
        },
      );
      if (!res.ok) {
        console.error("[i18n] Google Translate HTTP", res.status);
        continue;
      }
      const data = (await res.json()) as {
        data?: { translations?: Array<{ translatedText?: string }> };
      };
      const translations = data.data?.translations ?? [];
      for (let j = 0; j < chunk.length; j++) {
        out[offset + j] = decodeHtmlEntities(translations[j]?.translatedText ?? chunk[j]);
      }
    } catch (err) {
      console.error("[i18n] Google Translate failed:", err instanceof Error ? err.message : err);
    }
  }
  return out;
}

async function gtxBody(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: { "User-Agent": BROWSER_UA, Accept: "*/*" },
      signal: AbortSignal.timeout(20_000),
    });
    const text = await res.text();
    if (res.ok && text.trimStart().startsWith("[")) return text;
  } catch {
    /* Node's TLS fingerprint is often refused; curl is the fallback. */
  }
  try {
    const { stdout } = await execFileAsync(
      CURL,
      ["-sS", "--max-time", "20", "-A", BROWSER_UA, url],
      { timeout: 25_000, maxBuffer: 2_000_000, windowsHide: true },
    );
    const text = stdout.toString().trim();
    return text.startsWith("[") ? text : null;
  } catch (err) {
    console.error("[i18n] translate fallback failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

async function gtxBatch(texts: string[]): Promise<string[] | null> {
  const url =
    "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ar&dt=t&q=" +
    encodeURIComponent(texts.join(SENTINEL));
  const body = await gtxBody(url);
  if (!body) return null;
  try {
    return splitSentinel(parseGtxPayload(JSON.parse(body)), texts.length);
  } catch {
    return null;
  }
}

/** Keyless fallback. ponytail: public gtx endpoint, cached on disk; set GOOGLE_TRANSLATE_API_KEY for the paid API. */
function splitAt(text: string, size: number): string[] {
  const parts: string[] = [];
  let rest = text;
  while (rest.length > size) {
    let cut = rest.lastIndexOf(" ", size);
    if (cut < size / 2) cut = size;
    parts.push(rest.slice(0, cut));
    rest = rest.slice(cut);
  }
  if (rest) parts.push(rest);
  return parts;
}

async function translateFree(texts: string[]): Promise<string[]> {
  const out = texts.slice();
  const batches: Array<{ start: number; texts: string[] }> = [];
  let batch: string[] = [];
  let start = 0;
  let chars = 0;
  const flush = () => {
    if (!batch.length) return;
    batches.push({ start, texts: batch });
    batch = [];
    chars = 0;
  };
  for (let i = 0; i < texts.length; i++) {
    const text = texts[i];
    if (text.includes("§§§") || text.length > 700) {
      flush();
      const pieces = text.length > 700 ? splitAt(text, 700) : [text];
      const done: string[] = [];
      for (const piece of pieces) {
        const one = await gtxBatch([piece]);
        done.push(one?.[0] ?? piece);
      }
      out[i] = done.join("");
      start = i + 1;
      continue;
    }
    if (batch.length >= 12 || chars + text.length > 800) {
      flush();
      start = i;
    }
    if (!batch.length) start = i;
    batch.push(text);
    chars += text.length + SENTINEL.length;
  }
  flush();

  const CONCURRENCY = 4;
  for (let i = 0; i < batches.length; i += CONCURRENCY) {
    await Promise.all(
      batches.slice(i, i + CONCURRENCY).map(async (item) => {
        const translated = await gtxBatch(item.texts);
        if (!translated) return;
        translated.forEach((value, j) => {
          out[item.start + j] = value;
        });
      }),
    );
  }
  return out;
}

/**
 * Translate English → Arabic.
 * Uses Cloud Translation when GOOGLE_TRANSLATE_API_KEY is set, otherwise a keyless fallback.
 * Strings that fail to translate are returned unchanged.
 */
export async function translateToArabic(texts: string[]): Promise<string[]> {
  if (texts.length === 0) return [];
  loadDiskCache();

  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY?.trim();
  if (!apiKey && !warnedMissingKey && process.env.NODE_ENV === "production") {
    warnedMissingKey = true;
    console.warn("[i18n] GOOGLE_TRANSLATE_API_KEY unset — using the keyless Arabic fallback.");
  }

  const out: string[] = new Array(texts.length);
  const missingIdx: number[] = [];
  const missingMasked: string[] = [];
  const missingTokens: string[][] = [];

  await Promise.all(
    texts.map(async (text, i) => {
      if (!text.trim()) {
        out[i] = text;
        return;
      }
      const known = sharedArabic(text);
      if (known !== undefined) {
        out[i] = known;
        return;
      }
      if (BRAND_EXACT.has(text.trim().toLowerCase())) {
        out[i] = text;
        return;
      }
      const key = cacheKey(text, "ar");
      const mem = memoryCache.get(key);
      if (mem && mem.expiresAt > Date.now() && keepsLatinNames(text, mem.value)) {
        out[i] = mem.value;
        return;
      }
      const redisHit = await redisGet(key);
      if (redisHit && keepsLatinNames(text, redisHit)) {
        remember(key, redisHit);
        out[i] = redisHit;
        return;
      }
      const masked = maskBrands(text);
      missingIdx.push(i);
      missingMasked.push(masked.masked);
      missingTokens.push(masked.tokens);
    }),
  );

  if (missingIdx.length === 0) return out;

  const translated = apiKey
    ? await translateOfficial(missingMasked, apiKey)
    : await translateFree(missingMasked);

  missingIdx.forEach((index, j) => {
    const restored = restoreBrands(translated[j] ?? missingMasked[j], missingTokens[j]);
    out[index] = restored;
    if (restored !== texts[index] && keepsLatinNames(texts[index], restored)) {
      remember(cacheKey(texts[index], "ar"), restored);
    }
  });
  scheduleDiskWrite();
  return out;
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) =>
      String.fromCharCode(parseInt(h, 16)),
    )
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}
