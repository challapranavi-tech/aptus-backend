import { SLUG_RE, sanitizeText, type ParseResult } from "./schema";

const MAX_SLUG_LEN = 120;

/** Path param for /api/cms/pages/[slug]. */
export function parseCmsSlug(raw: string): ParseResult<{ slug: string }> {
  const slug = sanitizeText(raw, "singleLine").toLowerCase();
  if (!slug || slug.length > MAX_SLUG_LEN || !SLUG_RE.test(slug)) {
    return {
      ok: false,
      errors: { slug: "Invalid page slug." },
    };
  }
  return { ok: true, data: { slug } };
}
