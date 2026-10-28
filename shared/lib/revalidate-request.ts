import {
  SLUG_RE,
  parseObject,
  sanitizeText,
  type ObjectSchema,
  type ParseResult,
} from "./schema";

export type RevalidateRequest = {
  token: string;
  slug?: string;
  slugs?: string[];
  all?: boolean;
};

const slugItem = {
  min: 1,
  max: 200,
  sanitize: "singleLine" as const,
  label: "Slug",
};

const revalidateSchema: ObjectSchema<RevalidateRequest> = {
  fields: {
    token: {
      type: "string",
      required: true,
      min: 1,
      max: 512,
      sanitize: "singleLine",
      label: "Token",
    },
    slug: {
      type: "string",
      required: false,
      ...slugItem,
    },
    slugs: {
      type: "stringArray",
      required: false,
      maxItems: 50,
      item: slugItem,
      label: "Slugs",
    },
    all: {
      type: "boolean",
      required: false,
      label: "All",
    },
  },
};

/**
 * Normalise a page slug from webhook payloads (URLs, paths, casing).
 * Returns null when the result is not a safe slug.
 */
export function normaliseSlug(raw: string): string | null {
  const trimmed = sanitizeText(raw, "singleLine");
  if (!trimmed) return null;

  const pathLike = /^https?:\/\//i.test(trimmed)
    ? (() => {
        try {
          return new URL(trimmed).pathname;
        } catch {
          return trimmed;
        }
      })()
    : trimmed;

  const clean = pathLike
    .split(/[?#]/, 1)[0]
    .replace(/^\/+|\/+$/g, "")
    .toLowerCase();

  if (!clean) return "home";
  if (clean === "home") return "home";
  if (!SLUG_RE.test(clean) || clean.length > 120) return null;
  return clean;
}

export function parseRevalidateRequest(
  input: unknown,
): ParseResult<RevalidateRequest> {
  const parsed = parseObject(input, revalidateSchema);
  if (!parsed.ok) return parsed;

  const { token, slug, slugs, all } = parsed.data;
  if (!all && !slug && (!slugs || slugs.length === 0)) {
    return {
      ok: false,
      errors: {
        _form: "Provide slug, slugs, or all: true.",
      },
    };
  }

  return { ok: true, data: { token, slug, slugs, all } };
}
