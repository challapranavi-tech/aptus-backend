/**
 * lib/odoo/arch-parser.ts
 *
 * Best-effort parser that converts an Odoo QWeb arch string (XML/HTML)
 * into our Section[] type.
 *
 * Strategy:
 *  1. Find top-level <section> blocks via regex (no heavy DOM dependency).
 *  2. Identify section type from CSS class (`s_hero`, `s_features`, …).
 *  3. Extract text, hrefs and img srcs from each block.
 *  4. Return mapped Section[].  Unknown section types are skipped.
 *  5. If zero sections are detected, return `null` so callers can fallback.
 *
 * Limitations:
 *  - Regex-based: highly nested or malformed markup may produce partial results.
 *  - Only handles well-known Odoo website builder snippet classes.
 *  - Images reference Odoo's /web/image URLs — the caller can rewrite or proxy them.
 */

import type {
  CTA,
  Features,
  FeatureItem,
  Hero,
  HeroSlider,
  HeroSlide,
  KeyEnablers,
  Section,
  SectionType,
  Services,
  ServiceItem,
  Testimonials,
  TestimonialItem,
} from "@/types";

// ─── Tiny HTML helpers ────────────────────────────────────────────────────────

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s{2,}/g, " ").trim();
}

function attr(html: string, attrName: string): string | undefined {
  const re = new RegExp(`${attrName}=["']([^"']*)["']`, "i");
  return re.exec(html)?.[1];
}

function firstTagContent(html: string, tag: string): string | undefined {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = re.exec(html);
  return m ? stripTags(m[1]) : undefined;
}

function allTagContents(html: string, tag: string): string[] {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
  const results: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const text = stripTags(m[1]).trim();
    if (text) results.push(text);
  }
  return results;
}

function firstHref(html: string): string | undefined {
  return attr(html, "href");
}

function firstLinkText(html: string): string | undefined {
  const re = /<a[^>]*>([\s\S]*?)<\/a>/i;
  const m = re.exec(html);
  return m ? stripTags(m[1]) : undefined;
}

function firstImgSrc(html: string, baseUrl: string): string | undefined {
  const src = attr(html, "src");
  if (!src) return undefined;
  if (src.startsWith("http")) return src;
  return `${baseUrl}${src.startsWith("/") ? src : `/${src}`}`;
}

function firstImgAlt(html: string): string {
  return attr(html, "alt") ?? "";
}

// ─── Section-type detector ────────────────────────────────────────────────────
const SECTION_CLASS_MAP: Array<{ patterns: string[]; type: SectionType }> = [
  { patterns: ["s_hero", "s_banner", "s_cover", "s_parallax"], type: "hero-slider" },
  { patterns: ["s_features", "s_three_columns", "s_comparisons"], type: "features" },
  { patterns: ["s_call_to_action", "s_cta"], type: "cta" },
  { patterns: ["s_testimonials", "s_quotes"], type: "testimonials" },
  { patterns: ["s_title", "s_text_block", "s_text_image"], type: "services" },
];

function detectType(classAttr: string): SectionType | null {
  const lower = classAttr.toLowerCase();
  for (const { patterns, type } of SECTION_CLASS_MAP) {
    if (patterns.some((p) => lower.includes(p))) return type;
  }
  return null;
}

// ─── Per-type extractors ──────────────────────────────────────────────────────

function extractHeroSlider(html: string, baseUrl: string): HeroSlider {
  const slide: HeroSlide = {
    id: "arch-hero-0",
    heading: firstTagContent(html, "h1") ?? firstTagContent(html, "h2"),
    description:
      firstTagContent(html, "p") ?? undefined,
    action: (() => {
      const href = firstHref(html);
      const label = firstLinkText(html);
      return href && label ? { label, href } : undefined;
    })(),
    media: (() => {
      const src = firstImgSrc(html, baseUrl);
      return src ? { src, alt: firstImgAlt(html) } : undefined;
    })(),
  };
  return { type: "hero-slider", slides: [slide] };
}

function extractFeatures(html: string): Features {
  const heading =
    firstTagContent(html, "h2") ?? firstTagContent(html, "h3");
  const h3s = allTagContents(html, "h3");
  const h4s = allTagContents(html, "h4");
  const ps = allTagContents(html, "p");

  // Each column in a features snippet has a heading + description
  const titles = h3s.length > 0 ? h3s : h4s;
  const items: FeatureItem[] = titles.map((title, i) => ({
    id: `arch-feat-${i}`,
    title,
    description: ps[i],
  }));

  return { type: "features", heading, items };
}

function extractServices(html: string, baseUrl: string): Services {
  const heading =
    firstTagContent(html, "h2") ?? firstTagContent(html, "h3");
  const ps = allTagContents(html, "p");
  const links: string[] = [];
  const hrefs: string[] = [];
  const imgRe = /<img[^>]*>/gi;
  const imgs: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = imgRe.exec(html)) !== null) imgs.push(m[0]);

  const linkRe = /<a[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
  while ((m = linkRe.exec(html)) !== null) {
    hrefs.push(m[1]);
    links.push(stripTags(m[2]));
  }

  const items: ServiceItem[] = ps.slice(0, 3).map((desc, i) => ({
    id: `arch-srv-${i}`,
    description: desc,
    action:
      hrefs[i] && links[i]
        ? { label: links[i], href: hrefs[i] }
        : undefined,
    media: (() => {
      const tag = imgs[i];
      if (!tag) return undefined;
      const src = firstImgSrc(tag, baseUrl);
      return src ? { src, alt: firstImgAlt(tag) } : undefined;
    })(),
  }));

  return { type: "services", heading, items };
}

function extractCTA(html: string): CTA {
  const href = firstHref(html);
  const label = firstLinkText(html);
  return {
    type: "cta",
    heading: firstTagContent(html, "h2") ?? firstTagContent(html, "h3"),
    description: firstTagContent(html, "p"),
    action: href && label ? { label, href } : undefined,
  };
}

function extractTestimonials(html: string): Testimonials {
  const blockquotes = allTagContents(html, "blockquote");
  const cites = allTagContents(html, "cite");
  const smalls = allTagContents(html, "small");

  const items: TestimonialItem[] = blockquotes.map((quote, i) => ({
    id: `arch-tmn-${i}`,
    quote,
    author: cites[i],
    role: smalls[i],
  }));

  return { type: "testimonials", items };
}

// ─── Top-level section extractor ─────────────────────────────────────────────

/**
 * Splits the arch XML into top-level <section> blocks.
 * Uses a tag-depth counter so nested <section> tags are included in their parent.
 */
function extractSectionBlocks(arch: string): Array<{ classes: string; html: string }> {
  const results: Array<{ classes: string; html: string }> = [];
  let depth = 0;
  let start = -1;
  let classes = "";
  let i = 0;

  while (i < arch.length) {
    if (arch[i] === "<") {
      const tagEnd = arch.indexOf(">", i);
      if (tagEnd === -1) break;
      const tag = arch.slice(i, tagEnd + 1);

      const isClose = tag.startsWith("</section");
      const isOpen = !isClose && /^<section[\s>]/i.test(tag);
      const isSelfClose = tag.endsWith("/>");

      if (isOpen && !isSelfClose) {
        if (depth === 0) {
          start = i;
          const m = /class=["']([^"']*)["']/i.exec(tag);
          classes = m?.[1] ?? "";
        }
        depth++;
      } else if (isClose && depth > 0) {
        depth--;
        if (depth === 0 && start !== -1) {
          results.push({ classes, html: arch.slice(start, tagEnd + 1) });
          start = -1;
          classes = "";
        }
      }

      i = tagEnd + 1;
    } else {
      i++;
    }
  }

  return results;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Parses a QWeb arch string into Section[].
 * Returns `null` if no recognisable sections are found.
 */
export function parseArch(
  arch: string,
  odooBaseUrl: string,
): Section[] | null {
  const blocks = extractSectionBlocks(arch);
  if (blocks.length === 0) return null;

  const sections: Section[] = [];
  let order = 0;

  for (const { classes, html } of blocks) {
    const type = detectType(classes);
    if (!type) continue;

    let data:
      | Hero
      | HeroSlider
      | Features
      | Services
      | KeyEnablers
      | CTA
      | Testimonials;

    switch (type) {
      case "hero-slider":
        data = extractHeroSlider(html, odooBaseUrl);
        break;
      case "features":
        data = extractFeatures(html);
        break;
      case "services":
        data = extractServices(html, odooBaseUrl);
        break;
      case "cta":
        data = extractCTA(html);
        break;
      case "testimonials":
        data = extractTestimonials(html);
        break;
      default:
        continue;
    }

    sections.push({
      id: `arch-${type}-${order}`,
      type,
      order: ++order,
      data,
    });
  }

  return sections.length > 0 ? sections : null;
}
