/**
 * ELV product pages from committed frontend/content/elv/*.json.
 *
 * Vercel root deploy only builds the frontend; ELV slugs used to fetch
 * stale Odoo JSON from the backend API. Shipping the JSON with the
 * frontend makes product-page edits visible on frontend deploy — same
 * pattern as home.json / our-story.json.
 */

import type { LogoItem, Page, Section } from "@/types";
import { ELV_INNER_SLUGS, isElvHubSlug, isElvInnerSlug } from "@/data/elv-product-media";
import { resolveCmsImageSrc } from "@shared/lib/cms-image";
import accessControl from "@/content/elv/access-control-system.json";
import audioVideo from "@/content/elv/audio-video-solutions.json";
import cctv from "@/content/elv/cctv-camera.json";
import conference from "@/content/elv/conference-room-solution.json";
import dataCenter from "@/content/elv/data-center-solutions.json";
import elvHub from "@/content/elv/elv-solutions.json";
import gate from "@/content/elv/gate-automation.json";
import grms from "@/content/elv/guest-room-management.json";
import homeAuto from "@/content/elv/home-automation.json";
import networking from "@/content/elv/network-and-structured-cabling-solutions.json";
import nurse from "@/content/elv/nurse-calling-system.json";
import queue from "@/content/elv/rsi-queue-management.json";
import smatv from "@/content/elv/smatv-iptv.json";
import switching from "@/content/elv/switching-and-routing.json";
import telephone from "@/content/elv/telephone-systems.json";
import thermal from "@/content/elv/thermal-scanners.json";
import ups from "@/content/elv/ups.json";

export const ELV_LOCAL_PAGE_SLUGS = ["elv-solutions", ...ELV_INNER_SLUGS] as const;

type RawTitle = { before?: string; accent?: string; after?: string };
type RawImg = { src?: string; alt?: string };
type RawHero = {
  id?: string;
  visible?: boolean;
  family?: string;
  bannerTitle?: string;
  bannerTagline?: string;
  bannerSupport?: string;
  bannerBackgroundImages?: RawImg[];
  title?: string;
  paragraphs?: string[];
  imageSrc?: string;
  imageAlt?: string;
  ctaLabel?: string;
  ctaHref?: string;
  layout?: "default" | "two-column";
  mediaInline?: boolean;
  bodySections?: { heading?: string; paragraphs?: string[] }[];
  ctaPlacement?: "after-intro" | "end";
};
type RawCardItem = {
  title?: string;
  body?: string;
  bullets?: string[];
  icon?: string;
  imageSrc?: string;
  imageAlt?: string;
  href?: string;
  hrefLabel?: string;
  actionLabel?: string;
  actionHref?: string;
};
type RawCards = {
  id?: string;
  visible?: boolean;
  variant?: string;
  gridColumns?: 3 | 4 | 5;
  title?: RawTitle;
  subheading?: string;
  align?: "left" | "center";
  items?: RawCardItem[];
};
type RawElvPage = {
  softwareInnerHero?: RawHero;
  cardSections?: RawCards[];
  midCta?: {
    placement?: string;
    heading?: string;
    subheading?: string;
    description?: string;
    actionLabel?: string;
    actionHref?: string;
  };
  testimonials?: {
    visible?: boolean;
    variant?: "default" | "software-quotes" | "software-quotes-marquee" | "home-cards";
    title?: RawTitle;
    subheading?: string;
    items?: { id?: string; quote?: string; author?: string; role?: string; company?: string }[];
  };
  partnerships?: {
    placement?: string;
    heading?: string;
    headingAccent?: string;
    variant?: "default" | "alliances" | "alliances-grid" | "partners-marquee";
    logos?: { id?: string; src?: string; alt?: string }[];
  };
};

const ELV_JSON: Record<string, RawElvPage> = {
  "access-control-system": accessControl as RawElvPage,
  "audio-video-solutions": audioVideo as RawElvPage,
  "cctv-camera": cctv as RawElvPage,
  "conference-room-solution": conference as RawElvPage,
  "data-center-solutions": dataCenter as RawElvPage,
  "elv-solutions": elvHub as RawElvPage,
  "gate-automation": gate as RawElvPage,
  "guest-room-management": grms as RawElvPage,
  "home-automation": homeAuto as RawElvPage,
  "network-and-structured-cabling-solutions": networking as RawElvPage,
  "nurse-calling-system": nurse as RawElvPage,
  "rsi-queue-management": queue as RawElvPage,
  "smatv-iptv": smatv as RawElvPage,
  "switching-and-routing": switching as RawElvPage,
  "telephone-systems": telephone as RawElvPage,
  "thermal-scanners": thermal as RawElvPage,
  ups: ups as RawElvPage,
};

function usableImg(src?: string, alt?: string) {
  if (!src || src === "false") return undefined;
  if (!/^https?:\/\//i.test(src) && !src.startsWith("/")) return undefined;
  return { src: resolveCmsImageSrc(src), alt: alt ?? "" };
}

function joinTitle(t?: RawTitle): string | undefined {
  if (!t) return undefined;
  return [t.before, t.accent, t.after].filter(Boolean).join(" ").trim() || undefined;
}

function mapElvSections(data: RawElvPage, slug: string): Section[] {
  const sections: Section[] = [];
  const order = { n: 0 };
  const innerHero = data.softwareInnerHero;

  if (innerHero && innerHero.visible !== false && innerHero.title) {
    const family = innerHero.family ?? (isElvInnerSlug(slug) || isElvHubSlug(slug) ? "elv" : undefined);
    sections.push({
      id: innerHero.id ?? "software-inner-hero",
      type: "software-inner-hero",
      order: ++order.n,
      data: {
        type: "software-inner-hero",
        bannerTitle: innerHero.bannerTitle,
        bannerTagline: innerHero.bannerTagline,
        bannerSupport: innerHero.bannerSupport,
        bannerBackgroundImages: innerHero.bannerBackgroundImages
          ?.filter((img) => Boolean(img.src))
          .map((img) => ({ src: img.src!, alt: img.alt ?? "" })),
        title: innerHero.title,
        paragraphs: innerHero.paragraphs,
        media: usableImg(innerHero.imageSrc, innerHero.imageAlt),
        family,
        action:
          innerHero.ctaLabel && innerHero.ctaHref
            ? { label: innerHero.ctaLabel, href: innerHero.ctaHref }
            : undefined,
        bannerAction:
          innerHero.ctaLabel && innerHero.ctaHref
            ? { label: innerHero.ctaLabel, href: innerHero.ctaHref }
            : undefined,
        layout: innerHero.layout,
        mediaInline: innerHero.mediaInline,
        bodySections: innerHero.bodySections
          ?.filter((section) => section.heading || section.paragraphs?.length)
          .map((section) => ({
            heading: section.heading,
            paragraphs: section.paragraphs,
          })),
        ctaPlacement: innerHero.ctaPlacement,
      },
    });
  }

  const midCta = data.midCta;
  const pushMidCta = () => {
    if (!midCta?.heading) return;
    sections.push({
      id: "page-mid-cta",
      type: "cta",
      order: ++order.n,
      data: {
        type: "cta",
        heading: midCta.heading,
        description: midCta.subheading ?? midCta.description,
        action: {
          label: midCta.actionLabel ?? "Get Your Quote Now",
          href: midCta.actionHref ?? "#form",
        },
        layout: "software-mid",
      },
    });
  };
  if (midCta?.placement !== "bottom") pushMidCta();

  for (const cg of data.cardSections ?? []) {
    if (!cg || cg.visible === false || !cg.items?.length) continue;
    sections.push({
      id: cg.id ?? `page-cards-${order.n}`,
      type: "features",
      order: ++order.n,
      data: {
        type: "features",
        heading: cg.title?.before,
        headingAccent: [cg.title?.accent, cg.title?.after].filter(Boolean).join(" ") || undefined,
        subheading: cg.subheading,
        align: cg.align,
        variant: (cg.variant as "product-cards" | "value-cards" | "icon-cards" | "default") ?? "default",
        gridColumns: cg.gridColumns,
        anchorId: cg.id,
        items: cg.items.map((it, i) => ({
          id: `${cg.id ?? "card"}-${i}`,
          title: it.title,
          description: it.body,
          bullets: it.bullets,
          icon: it.icon,
          media: usableImg(it.imageSrc, it.imageAlt),
          href: it.href,
          hrefLabel: it.hrefLabel,
          action:
            it.actionLabel && it.actionHref
              ? { label: it.actionLabel, href: it.actionHref }
              : it.actionLabel
                ? { label: it.actionLabel, href: "#form" }
                : undefined,
        })),
      },
    });
  }

  const pushTestimonials = () => {
    const testimonials = data.testimonials;
    if (!(testimonials && testimonials.visible !== false && testimonials.items?.length)) return;
    sections.push({
      id: "page-testimonials",
      type: "testimonials",
      order: ++order.n,
      data: {
        type: "testimonials",
        heading: joinTitle(testimonials.title),
        subheading: testimonials.subheading,
        variant: testimonials.variant ?? "software-quotes",
        items: testimonials.items.map((it, i) => ({
          id: it.id ?? `testimonial-${i}`,
          quote: it.quote,
          author: it.author,
          role: it.role,
          company: it.company,
        })),
      },
    });
  };

  const pushPartnerships = () => {
    const partnerships = data.partnerships;
    if (!partnerships?.logos?.length) return;
    const items: LogoItem[] = partnerships.logos
      .map((logo, i) => {
        if (!logo.src) return null;
        return {
          id: logo.id ?? `partner-${i}`,
          src: resolveCmsImageSrc(logo.src),
          alt: logo.alt ?? "Partner",
        };
      })
      .filter((x): x is LogoItem => Boolean(x));
    if (!items.length) return;
    sections.push({
      id: "page-partnerships",
      type: "logo-grid",
      order: ++order.n,
      data: {
        type: "logo-grid",
        heading: partnerships.heading,
        headingAccent: partnerships.headingAccent,
        variant: partnerships.variant ?? "default",
        items,
      },
    });
  };

  if (data.partnerships?.placement === "before-testimonials") {
    pushPartnerships();
    pushTestimonials();
  } else {
    pushTestimonials();
    pushPartnerships();
  }

  if (midCta?.placement === "bottom") pushMidCta();

  return sections;
}

export function isLocalElvSlug(slug: string): boolean {
  return slug in ELV_JSON;
}

export function buildLocalElvPage(slug: string): Page | null {
  const raw = ELV_JSON[slug];
  if (!raw) return null;
  const sections = mapElvSections(raw, slug);
  if (!sections.length) return null;

  const title =
    raw.softwareInnerHero?.bannerTitle ??
    raw.softwareInnerHero?.title ??
    slug.replace(/-/g, " ");

  return {
    id: `local:${slug}`,
    slug,
    title,
    seo: { title: `${title} | Aptus Infotech` },
    sections,
  };
}
