import { createHash } from "node:crypto";

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

/**
 * Translate English → Arabic via Google Cloud Translation API (v2).
 * Returns the original text when the API key is missing or the call fails.
 */
export async function translateToArabic(texts: string[]): Promise<string[]> {
  if (texts.length === 0) return [];

  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY?.trim();
  if (!apiKey) {
    if (!warnedMissingKey && process.env.NODE_ENV === "production") {
      warnedMissingKey = true;
      console.warn(
        "[i18n] GOOGLE_TRANSLATE_API_KEY unset — Arabic CMS bodies stay English; UI dictionaries still apply.",
      );
    }
    return texts;
  }

  const out: string[] = new Array(texts.length);
  const missingIdx: number[] = [];
  const missingTexts: string[] = [];

  await Promise.all(
    texts.map(async (text, i) => {
      const key = cacheKey(text, "ar");
      const mem = memoryCache.get(key);
      if (mem && mem.expiresAt > Date.now()) {
        out[i] = mem.value;
        return;
      }
      const redisHit = await redisGet(key);
      if (redisHit) {
        memoryCache.set(key, {
          value: redisHit,
          expiresAt: Date.now() + CACHE_TTL_MS,
        });
        out[i] = redisHit;
        return;
      }
      missingIdx.push(i);
      missingTexts.push(text);
    }),
  );

  if (missingTexts.length === 0) return out;

  // Google allows batching; keep chunks modest.
  const CHUNK = 40;
  for (let offset = 0; offset < missingTexts.length; offset += CHUNK) {
    const chunk = missingTexts.slice(offset, offset + CHUNK);
    const chunkIdx = missingIdx.slice(offset, offset + CHUNK);
    try {
      const res = await fetch(
        `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            q: chunk,
            source: "en",
            target: "ar",
            format: "text",
          }),
          cache: "no-store",
          signal: AbortSignal.timeout(20_000),
        },
      );
      if (!res.ok) {
        console.error("[i18n] Google Translate HTTP", res.status);
        for (let j = 0; j < chunk.length; j++) out[chunkIdx[j]] = chunk[j];
        continue;
      }
      const data = (await res.json()) as {
        data?: { translations?: Array<{ translatedText?: string }> };
      };
      const translations = data.data?.translations ?? [];
      for (let j = 0; j < chunk.length; j++) {
        const translated = translations[j]?.translatedText ?? chunk[j];
        const decoded = decodeHtmlEntities(translated);
        out[chunkIdx[j]] = decoded;
        const key = cacheKey(chunk[j], "ar");
        memoryCache.set(key, {
          value: decoded,
          expiresAt: Date.now() + CACHE_TTL_MS,
        });
        void redisSet(key, decoded);
      }
    } catch (err) {
      console.error(
        "[i18n] Google Translate failed:",
        err instanceof Error ? err.message : err,
      );
      for (let j = 0; j < chunk.length; j++) out[chunkIdx[j]] = chunk[j];
    }
  }

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
