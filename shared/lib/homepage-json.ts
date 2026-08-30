/**
 * Maps homepage JSON (Odoo `x_homepage_sections_json` / committed home.json)
 * into Section[]. Shared by backend CMS and frontend so Vercel frontend deploys
 * can render `/` without waiting on the API backend.
 */

import { parseCmsPresentation } from "./design-system/presentation";
import type { CmsPresentationSettings, MediaAsset, Section } from "../types";

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
  paragraphs?: string[];
  imageSrc?: string;
  imageAlt?: string;
  imagePosition?: "left" | "right" | "below";
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
  variant?: "default" | "home-steps";
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
interface RawTestimonialItem {
  id?: string;
  quote?: string;
  author?: string;
  role?: string;
  company?: string;
  avatarSrc?: string;
}
interface RawTestimonials {
  id?: string;
  visible?: boolean;
  presentation?: RawPresentation;
  variant?: "default" | "software-quotes" | "home-cards";
  eyebrow?: string;
  heading?: string;
  subheading?: string;
  scrollHint?: string;
  ctaLabel?: string;
  ctaHref?: string;
  items?: RawTestimonialItem[];
}
interface RawLogoItem {
  id?: string;
  src?: string;
  alt?: string;
}
interface RawLogoGrid {
  id?: string;
  visible?: boolean;
  presentation?: RawPresentation;
  heading?: string;
  headingAccent?: string;
  variant?: "default" | "alliances" | "alliances-grid" | "partners-marquee";
  logos?: RawLogoItem[];
}
interface RawIndustryItem {
  title?: string;
  imageSrc?: string;
  imageAlt?: string;
}
interface RawIndustries {
  id?: string;
  visible?: boolean;
  presentation?: RawPresentation;
  eyebrow?: string;
  title?: RawTitle;
  tags?: string[];
  items?: RawIndustryItem[];
  ctaLabel?: string;
  ctaHref?: string;
}
interface RawCtaBand {
  id?: string;
  visible?: boolean;
  presentation?: RawPresentation;
  heading?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
}
interface RawPromiseItem {
  title?: string;
  description?: string;
  icon?: string;
}
interface RawPromises {
  id?: string;
  visible?: boolean;
  presentation?: RawPresentation;
  eyebrow?: string;
  title?: RawTitle;
  items?: RawPromiseItem[];
}
interface RawChallengeItem {
  title?: string;
  description?: string;
}
interface RawChallenges {
  id?: string;
  visible?: boolean;
  presentation?: RawPresentation;
  heading?: string;
  subheading?: string;
  items?: RawChallengeItem[];
}
interface RawWhyChooseItem {
  number?: string;
  title?: string;
  description?: string;
}
interface RawWhyChoose {
  id?: string;
  visible?: boolean;
  presentation?: RawPresentation;
  heading?: string;
  items?: RawWhyChooseItem[];
}
interface RawHomeJson {
  hero?: {
    id?: string;
    visible?: boolean;
    presentation?: RawPresentation;
    variant?: "banner" | "home-centered";
    title?: RawTitle;
    subtitle?: string;
    tagline?: string;
    ctaLabel?: string;
    ctaHref?: string;
    results?: { label?: string; title?: string; description?: string }[];
    imageSrc?: string;
    imageAlt?: string;
    imageWidth?: number;
    imageHeight?: number;
    backgroundImages?: { src?: string; alt?: string }[];
  };
  logoGrid?: RawLogoGrid;
  challenges?: RawChallenges;
  whyChooseUs?: RawWhyChoose;
  industries?: RawIndustries;
  features?: RawFeature[];
  midCta?: RawCtaBand;
  services?: RawServices;
  keyEnablers?: RawEnablers;
  promises?: RawPromises;
  testimonial?: RawTestimonial;
  testimonials?: RawTestimonials;
  closingCta?: RawCtaBand;
}

function joinTitle(t?: RawTitle): string | undefined {
  if (!t) return undefined;
  const s = [t.before, t.accent, t.after].filter(Boolean).join(" ").trim();
  return s || undefined;
}

function parsePresentation(raw?: RawPresentation): CmsPresentationSettings | undefined {
  if (!raw) return undefined;
  const parsed = parseCmsPresentation(raw as Record<string, unknown>);
  const hasAny = Object.values(parsed).some((v) => v !== undefined);
  return hasAny ? parsed : undefined;
}

function usableImg(src?: string, alt?: string): MediaAsset | undefined {
  if (!src || src === "false") return undefined;
  const ok = /^https?:\/\//i.test(src) || src.startsWith("/");
  return ok ? { src, alt: alt ?? "" } : undefined;
}

function pushCta(
  sections: Section[],
  order: { n: number },
  band: RawCtaBand | undefined,
  fallbackId: string,
): void {
  if (!band || band.visible === false) return;
  if (!band.heading && !band.actionLabel) return;
  sections.push({
    id: band.id ?? fallbackId,
    type: "cta",
    order: ++order.n,
    presentation: parsePresentation(band.presentation),
    data: {
      type: "cta",
      heading: band.heading,
      description: band.description,
      layout: "software-mid",
      action:
        band.actionLabel && band.actionHref
          ? { label: band.actionLabel, href: band.actionHref }
          : undefined,
    },
  });
}

/**
 * Parses homepage JSON into Section[].
 * Returns `null` when the field is empty or unparseable.
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
  const order = { n: 0 };

  const hero = data.hero;
  if (hero && hero.visible !== false) {
    const isCentered =
      hero.variant === "home-centered" ||
      Boolean(hero.title || hero.subtitle || hero.ctaLabel || hero.results?.length);

    if (isCentered) {
      const highlights = (hero.results ?? [])
        .map((r, i) => {
          const label = (r.title ?? r.label)?.trim();
          if (!label) return null;
          const description = r.description?.trim();
          return {
            id: `home-result-${i}`,
            label,
            description: description || undefined,
          };
        })
        .filter((x): x is { id: string; label: string; description?: string } => !!x);

      sections.push({
        id: hero.id ?? "home-hero",
        type: "hero",
        order: ++order.n,
        presentation: parsePresentation(hero.presentation),
        data: {
          type: "hero",
          variant: "home-centered",
          heading: hero.title?.before?.trim() || joinTitle(hero.title),
          headingAccent: hero.title?.accent,
          tagline: hero.tagline,
          subheading: hero.subtitle,
          primaryAction:
            hero.ctaLabel && hero.ctaHref
              ? { label: hero.ctaLabel, href: hero.ctaHref }
              : undefined,
          highlights: highlights.length ? highlights : undefined,
          media: usableImg(hero.imageSrc, hero.imageAlt),
          backgroundMedia: (() => {
            const fromGallery = (hero.backgroundImages ?? [])
              .map((img) => usableImg(img.src, img.alt))
              .filter((x): x is MediaAsset => !!x);
            if (fromGallery.length > 0) return fromGallery;
            const single = usableImg(hero.imageSrc, hero.imageAlt);
            return single ? [single] : undefined;
          })(),
        },
      });
    } else {
      const media = usableImg(hero.imageSrc, hero.imageAlt);
      if (media) {
        sections.push({
          id: hero.id ?? "home-banner",
          type: "banner",
          order: ++order.n,
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
  }

  // Pain points / challenges (before industries)
  const challenges = data.challenges;
  if (
    challenges &&
    challenges.visible !== false &&
    Array.isArray(challenges.items) &&
    challenges.items.length > 0
  ) {
    sections.push({
      id: challenges.id ?? "home-challenges",
      type: "features",
      order: ++order.n,
      presentation: parsePresentation(challenges.presentation),
      data: {
        type: "features",
        variant: "home-challenges",
        heading: challenges.heading,
        subheading: challenges.subheading,
        align: "center",
        items: challenges.items.map((it, i) => ({
          id: `home-challenge-${i}`,
          title: it.title,
          description: it.description,
        })),
      },
    });
  }

  // Why choose us (after challenges, before industries)
  const whyChooseUs = data.whyChooseUs;
  if (
    whyChooseUs &&
    whyChooseUs.visible !== false &&
    Array.isArray(whyChooseUs.items) &&
    whyChooseUs.items.length > 0
  ) {
    sections.push({
      id: whyChooseUs.id ?? "home-why-choose",
      type: "features",
      order: ++order.n,
      presentation: parsePresentation(whyChooseUs.presentation),
      data: {
        type: "features",
        variant: "home-why-choose",
        heading: whyChooseUs.heading ?? "Why Choose Us",
        align: "center",
        items: whyChooseUs.items.map((it, i) => ({
          id: `home-why-${i}`,
          number: it.number ?? String(i + 1).padStart(2, "0"),
          title: it.title,
          description: it.description,
        })),
      },
    });
  }

  // Industries we serve (Sector Expertise)
  const industries = data.industries;
  if (
    industries &&
    industries.visible !== false &&
    Array.isArray(industries.items) &&
    industries.items.length > 0
  ) {
    sections.push({
      id: industries.id ?? "home-industries",
      type: "features",
      order: ++order.n,
      presentation: parsePresentation(industries.presentation),
      data: {
        type: "features",
        variant: "home-industries",
        eyebrow: industries.eyebrow,
        heading: industries.title?.before,
        headingAccent: industries.title?.accent,
        tags: industries.tags?.filter(Boolean),
        action:
          industries.ctaLabel && industries.ctaHref
            ? { label: industries.ctaLabel, href: industries.ctaHref }
            : undefined,
        items: industries.items.map((it, i) => ({
          id: `home-industry-${i}`,
          title: it.title,
          media: usableImg(it.imageSrc, it.imageAlt ?? it.title),
        })),
      },
    });
  }

  const logoGrid = data.logoGrid;
  if (logoGrid && logoGrid.visible !== false && Array.isArray(logoGrid.logos) && logoGrid.logos.length > 0) {
    const items = logoGrid.logos
      .map((logo, i) => {
        const media = usableImg(logo.src, logo.alt);
        if (!media) return null;
        return {
          id: logo.id ?? `home-logo-${i}`,
          src: media.src,
          alt: media.alt || "Partner",
        };
      })
      .filter((x): x is { id: string; src: string; alt: string } => !!x);

    if (items.length) {
      sections.push({
        id: logoGrid.id ?? "home-logos",
        type: "logo-grid",
        order: ++order.n,
        presentation: parsePresentation(logoGrid.presentation),
        data: {
          type: "logo-grid",
          heading: logoGrid.heading,
          headingAccent: logoGrid.headingAccent,
          variant: logoGrid.variant ?? "default",
          items,
        },
      });
    }
  }

  const features = Array.isArray(data.features)
    ? data.features.filter((f) => f && f.visible !== false)
    : [];
  features.forEach((f, i) => {
    const paragraphs =
      Array.isArray(f.paragraphs) && f.paragraphs.length > 0
        ? f.paragraphs.filter(Boolean)
        : undefined;
    sections.push({
      id: f.id ?? `home-feature-${i}`,
      type: "feature-row",
      order: ++order.n,
      presentation: parsePresentation(f.presentation),
      data: {
        type: "feature-row",
        eyebrow: f.eyebrow,
        heading: f.title?.before,
        headingAccent: f.title?.accent,
        headingAfter: f.title?.after,
        description: f.description,
        paragraphs,
        media: usableImg(f.imageSrc, f.imageAlt),
        imagePosition: f.imagePosition ?? (i % 2 === 0 ? "left" : "right"),
        action:
          f.href && f.buttonLabel
            ? { label: f.buttonLabel, href: f.href }
            : undefined,
      },
    });
  });

  pushCta(sections, order, data.midCta, "home-mid-cta");

  const ke = data.keyEnablers;
  if (ke && ke.visible !== false && Array.isArray(ke.items) && ke.items.length > 0) {
    sections.push({
      id: "home-key-enablers",
      type: "key-enablers",
      order: ++order.n,
      presentation: parsePresentation(ke.presentation),
      data: {
        type: "key-enablers",
        variant: ke.variant === "home-steps" ? "home-steps" : "default",
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

  const promises = data.promises;
  if (promises && promises.visible !== false && Array.isArray(promises.items) && promises.items.length > 0) {
    sections.push({
      id: promises.id ?? "home-promises",
      type: "features",
      order: ++order.n,
      presentation: parsePresentation(promises.presentation),
      data: {
        type: "features",
        variant: "home-promises",
        eyebrow: promises.eyebrow,
        heading: promises.title?.before,
        headingAccent: promises.title?.accent,
        align: "center",
        gridColumns: 4,
        items: promises.items.map((it, i) => ({
          id: `home-promise-${i}`,
          title: it.title,
          description: it.description,
          icon: it.icon,
        })),
      },
    });
  } else {
    const svc = data.services;
    if (svc && svc.visible !== false && Array.isArray(svc.items) && svc.items.length > 0) {
      sections.push({
        id: "home-services",
        type: "services",
        order: ++order.n,
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
  }

  const testimonials = data.testimonials;
  if (
    testimonials &&
    testimonials.visible !== false &&
    Array.isArray(testimonials.items) &&
    testimonials.items.length > 0
  ) {
    sections.push({
      id: testimonials.id ?? "home-testimonials",
      type: "testimonials",
      order: ++order.n,
      presentation: parsePresentation(testimonials.presentation),
      data: {
        type: "testimonials",
        variant: testimonials.variant ?? "home-cards",
        eyebrow: testimonials.eyebrow,
        heading: testimonials.heading,
        subheading: testimonials.subheading,
        scrollHint: testimonials.scrollHint,
        action:
          testimonials.ctaLabel && testimonials.ctaHref
            ? { label: testimonials.ctaLabel, href: testimonials.ctaHref }
            : undefined,
        items: testimonials.items.map((it, i) => ({
          id: it.id ?? `home-tmn-${i}`,
          quote: it.quote,
          author: it.author,
          role: it.role,
          company: it.company,
          avatar: usableImg(it.avatarSrc, it.author),
        })),
      },
    });
  } else {
    const t = data.testimonial;
    if (t && t.visible !== false && t.quote) {
      sections.push({
        id: "home-testimonials",
        type: "testimonials",
        order: ++order.n,
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
  }

  pushCta(sections, order, data.closingCta, "home-closing-cta");

  return sections.length > 0 ? sections : null;
}
