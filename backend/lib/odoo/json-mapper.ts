/**
 * lib/odoo/json-mapper.ts
 *
 * Maps Odoo's `x_homepage_sections_json` custom field (aptus-web content schema)
 * into this scaffold's internal `Section[]` type.
 *
 * The staging Odoo instance stores structured homepage content as JSON in a custom
 * field rather than as QWeb snippets, so this is the real content source for the
 * home page (preferred over arch parsing).
 *
 * Pure structural mapping — no business logic, no hard-coded copy.
 */

import { parseCmsPresentation } from "@shared/lib/design-system/presentation";
import type { CmsPresentationSettings, MediaAsset, Section } from "@/types";

// ─── Wire shape of the Odoo JSON (only the fields we consume) ─────────────────
interface RawTitle {
  before?: string;
  accent?: string;
  after?: string;
}
interface RawPresentation {
  theme?: string;
  alignment?: string;
  fontPreset?: string;
  font_preset?: string;
  fontScale?: string;
  font_scale?: string;
  colorPreset?: string;
  color_preset?: string;
  variant?: string;
  visible?: boolean | string;
}
interface RawFeature {
  id?: string;
  visible?: boolean;
  presentation?: RawPresentation;
  eyebrow?: string;
  title?: RawTitle;
  description?: string;
  imageSrc?: string;
  imageAlt?: string;
  href?: string;
  buttonLabel?: string;
}
interface RawServiceItem {
  title?: string;
  description?: string;
  icon?: string;
  hoverImageSrc?: string;
}
interface RawServices {
  visible?: boolean;
  presentation?: RawPresentation;
  eyebrow?: string;
  title?: RawTitle;
  items?: RawServiceItem[];
}
interface RawEnablerItem {
  number?: string;
  title?: string;
  description?: string;
}
interface RawEnablers {
  visible?: boolean;
  presentation?: RawPresentation;
  eyebrow?: string;
  title?: RawTitle;
  subtitle?: string;
  items?: RawEnablerItem[];
}
interface RawTestimonial {
  visible?: boolean;
  presentation?: RawPresentation;
  heading?: string;
  quote?: string;
  authorName?: string;
  authorTitle?: string;
  authorImageSrc?: string;
}
interface RawHomeJson {
  hero?: {
    id?: string;
    visible?: boolean;
    presentation?: RawPresentation;
    imageSrc?: string;
    imageAlt?: string;
    imageWidth?: number;
    imageHeight?: number;
  };
  features?: RawFeature[];
  services?: RawServices;
  keyEnablers?: RawEnablers;
  testimonial?: RawTestimonial;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function joinTitle(t?: RawTitle): string | undefined {
  if (!t) return undefined;
  const s = [t.before, t.accent, t.after].filter(Boolean).join(" ").trim();
  return s || undefined;
}

function parsePresentation(raw?: RawPresentation): CmsPresentationSettings | undefined {
  if (!raw) return undefined;
  const parsed = parseCmsPresentation(raw as Record<string, unknown>);
  // Return undefined if all fields are undefined (no-op presentation)
  const hasAny = Object.values(parsed).some((v) => v !== undefined);
  return hasAny ? parsed : undefined;
}

/**
 * Accepts absolute http(s) URLs and local /public paths (the real home images
 * from the live site now live in /public/images). Rejects empty / "false".
 */
function usableImg(src?: string, alt?: string): MediaAsset | undefined {
  if (!src || src === "false") return undefined;
  const ok = /^https?:\/\//i.test(src) || src.startsWith("/");
  return ok ? { src, alt: alt ?? "" } : undefined;
}

// ─── Public API ───────────────────────────────────────────────────────────────
/**
 * Parses `x_homepage_sections_json` into Section[].
 * Returns `null` when the field is empty or unparseable so callers can fall back.
 */
export function mapHomepageJson(raw: string | false | undefined | null): Section[] | null {
  if (!raw || raw === "false") return null;

  let data: RawHomeJson;
  try {
    data = JSON.parse(raw) as RawHomeJson;
  } catch {
    return null;
  }
  if (!data || typeof data !== "object") return null;

  const sections: Section[] = [];
  let order = 0;

  // Hero banner from Odoo JSON (full-width on live site)
  const hero = data.hero;
  if (hero && hero.visible !== false) {
    const media = usableImg(hero.imageSrc, hero.imageAlt);
    if (media) {
      sections.push({
        id: hero.id ?? "home-banner",
        type: "banner",
        order: ++order,
        presentation: parsePresentation(hero.presentation),
        data: {
          type: "banner",
          media: {
            ...media,
            width: hero.imageWidth,
            height: hero.imageHeight,
          },
        },
      });
    }
  }

  // features[] → alternating image+text feature rows (matches live layout)
  const features = Array.isArray(data.features)
    ? data.features.filter((f) => f && f.visible !== false)
    : [];
  features.forEach((f, i) => {
    sections.push({
      id: f.id ?? `home-feature-${i}`,
      type: "feature-row",
      order: ++order,
      presentation: parsePresentation(f.presentation),
      data: {
        type: "feature-row",
        eyebrow: f.eyebrow,
        heading: f.title?.before,
        headingAccent: f.title?.accent,
        headingAfter: f.title?.after,
        description: f.description,
        media: usableImg(f.imageSrc, f.imageAlt),
        imagePosition: i % 2 === 0 ? "left" : "right",
        action:
          f.href && f.buttonLabel
            ? { label: f.buttonLabel, href: f.href }
            : undefined,
      },
    });
  });

  // services
  const svc = data.services;
  if (svc && svc.visible !== false && Array.isArray(svc.items) && svc.items.length > 0) {
    sections.push({
      id: "home-services",
      type: "services",
      order: ++order,
      presentation: parsePresentation(svc.presentation),
      data: {
        type: "services",
        eyebrow: svc.eyebrow,
        heading: svc.title?.before,
        headingAccent: svc.title?.accent,
        items: svc.items.map((it, i) => ({
          id: `home-svc-${i}`,
          title: it.title,
          description: it.description,
          icon:
            it.icon ??
            (it.title === "ELV Solutions"
              ? "lightbulb"
              : it.title === "Software Related Training"
                ? "cogs"
                : it.title === "Building Information Modelling"
                  ? "drafting-compass"
                  : undefined),
          media: usableImg(it.hoverImageSrc, it.title),
        })),
      },
    });
  }

  // keyEnablers
  const ke = data.keyEnablers;
  if (ke && ke.visible !== false && Array.isArray(ke.items) && ke.items.length > 0) {
    sections.push({
      id: "home-key-enablers",
      type: "key-enablers",
      order: ++order,
      presentation: parsePresentation(ke.presentation),
      data: {
        type: "key-enablers",
        eyebrow: ke.eyebrow,
        heading: ke.title?.before,
        headingAccent: ke.title?.accent,
        subheading: ke.subtitle,
        items: ke.items.map((it, i) => ({
          id: `home-ke-${i}`,
          number: it.number,
          title: it.title,
          description: it.description,
        })),
      },
    });
  }

  // testimonial (single)
  const t = data.testimonial;
  if (t && t.visible !== false && t.quote) {
    sections.push({
      id: "home-testimonials",
      type: "testimonials",
      order: ++order,
      presentation: parsePresentation(t.presentation),
      data: {
        type: "testimonials",
        heading: t.heading,
        items: [
          {
            id: "home-tmn-0",
            quote: t.quote,
            author: t.authorName,
            role: t.authorTitle,
            avatar: usableImg(t.authorImageSrc, t.authorName),
          },
        ],
      },
    });
  }

  return sections.length > 0 ? sections : null;
}
