/**
 * Maps Odoo `x_page_sections_json` (marketing / about pages) → Section[].
 * Only emits sections present in the JSON — no code defaults merged in.
 */

import { elvHeroImage, isElvHubSlug, isElvInnerSlug } from "@/data/elv-product-media";
import { softwareSubnavForFamily } from "@/data/software-subnav";
import { isSoftwareInnerSlug, softwareHeroImage } from "@/data/software-product-media";
import { parseCmsPresentation } from "@/lib/design-system/presentation";
import { isCaseStudiesPageJson, mapCaseStudiesPageJson } from "@/lib/odoo/case-studies-json-mapper";
import type { CmsPresentationSettings, FaqItem, LogoItem, Section } from "@/types";
import { resolveCmsImageSrc } from "@shared/lib/cms-image";

interface RawTitle {
  before?: string;
  accent?: string;
  after?: string;
}
interface RawPresentation {
  [key: string]: unknown;
}
interface RawHero {
  id?: string;
  visible?: boolean;
  presentation?: RawPresentation;
  title?: RawTitle;
  subtitle?: string;
  tagline?: string;
  highlight?: string;
  imageSrc?: string;
  imageAlt?: string;
  actions?: { label?: string; href?: string; tone?: "blue" | "green" | "sky" }[];
  variant?: "default" | "why-panel" | "iso-page" | "career-page" | "contact-page" | "software-landing";
  ctaLabel?: string;
  ctaHref?: string;
}
interface RawTeamMember {
  id?: string;
  name?: string;
  role?: string;
  imageSrc?: string;
  imageAlt?: string;
  bio?: string;
}
interface RawTeam {
  visible?: boolean;
  presentation?: RawPresentation;
  eyebrow?: string;
  title?: RawTitle;
  members?: RawTeamMember[];
  variant?: "default" | "leadership";
}
interface RawCertItem {
  id?: string;
  imageSrc?: string;
  imageAlt?: string;
  title?: string;
}
interface RawCertifications {
  visible?: boolean;
  presentation?: RawPresentation;
  eyebrow?: string;
  title?: RawTitle;
  items?: RawCertItem[];
}
interface RawContactInfo {
  visible?: boolean;
  presentation?: RawPresentation;
  title?: RawTitle;
  phone?: string;
  email?: string;
  address?: string;
  description?: string;
  mapEmbedUrl?: string;
}
interface RawText {
  id?: string;
  visible?: boolean;
  presentation?: RawPresentation;
  eyebrow?: string;
  title?: RawTitle;
  paragraphs?: string[];
  bullets?: string[];
  imageSrc?: string;
  imageAlt?: string;
  imagePosition?: "left" | "right" | "below";
  variant?: "default" | "culture-panel" | "policy-panel";
}
// Card sections — used by software/product inner pages for feature grids
interface RawCardItem {
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
}
interface RawCards {
  id?: string;
  visible?: boolean;
  anchorId?: string;
  presentation?: RawPresentation;
  eyebrow?: string;
  title?: RawTitle;
  subheading?: string;
  align?: "left" | "center";
  variant?: "default" | "pillars" | "product-cards" | "value-cards" | "icon-cards" | "bullet-list" | "checklist";
  gridColumns?: 3 | 4 | 5;
  items?: RawCardItem[];
}
interface RawMidCta {
  heading?: string;
  description?: string;
  subheading?: string;
  actionLabel?: string;
  actionHref?: string;
}
interface RawSoftwareInnerHero {
  id?: string;
  visible?: boolean;
  family?: string;
  subnavLinks?: { label: string; href: string }[];
  bannerTitle?: string;
  bannerTagline?: string;
  pageTitle?: string;
  title?: string;
  paragraphs?: string[];
  imageSrc?: string;
  imageAlt?: string;
  ctaLabel?: string;
  ctaHref?: string;
  layout?: "default" | "two-column";
  topBannerImage?: string;
  mediaInline?: boolean;
  titleLevel?: "h1" | "h2";
  introRows?: {
    paragraphs?: string[];
    imageSrc?: string;
    imageAlt?: string;
    imagePosition?: "left" | "right";
  }[];
}
interface RawTestimonialItem {
  id?: string;
  quote?: string;
  author?: string;
  role?: string;
  company?: string;
}
interface RawTestimonials {
  visible?: boolean;
  variant?: "default" | "software-quotes";
  title?: RawTitle;
  subheading?: string;
  items?: RawTestimonialItem[];
}
// Bullet list sections — used for policy / certification detail pages
interface RawList {
  id?: string;
  visible?: boolean;
  presentation?: RawPresentation;
  eyebrow?: string;
  title?: RawTitle;
  items?: string[];
}
// FAQ section
interface RawFaqItem {
  id?: string;
  question?: string;
  answer?: string;
}
interface RawFaq {
  visible?: boolean;
  presentation?: RawPresentation;
  eyebrow?: string;
  title?: RawTitle;
  items?: RawFaqItem[];
}
// Explicit CTA section — preferred over the legacy `showContactCta` flag
interface RawContactCta {
  heading?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  showForm?: boolean;
  submitLabel?: string;
  formVariant?: "simple" | "contact" | "career" | "software-quote";
  layout?: "dark" | "light" | "career";
}
interface RawBanner {
  imageSrc?: string;
  imageAlt?: string;
}
interface RawIntroRow {
  eyebrow?: string;
  title?: string;
  heading?: string;
  headingAccent?: string;
  paragraphs?: string[];
  bullets?: string[];
  imageSrc?: string;
  imageAlt?: string;
  imagePosition?: "left" | "right" | "below";
  headingAsH1?: boolean;
  variant?: "default" | "boxed" | "panel";
  downloadHref?: string;
}
interface RawFlipCardItem {
  id?: string;
  title?: string;
  description?: string;
  icon?: string;
  variant?: "blue" | "green";
}
interface RawFlipCards {
  spotlight?: { title?: string; icon?: string };
  items?: RawFlipCardItem[];
}
interface RawPartnerships {
  heading?: string;
  headingAccent?: string;
  variant?: "default" | "alliances" | "alliances-grid";
  logos?: { id?: string; src?: string; alt?: string }[];
}
interface RawPageJson {
  banner?: RawBanner;
  introRow?: RawIntroRow;
  featureRows?: RawIntroRow[];
  flipCards?: RawFlipCards;
  partnerships?: RawPartnerships;
  hero?: RawHero;
  intro?: RawText;
  text?: RawText;
  /** Single card grid (e.g. homepage-style feature overview). */
  cards?: RawCards;
  /** Multiple card grids ordered in the page (features, benefits, why-choose-us, etc.). */
  cardSections?: RawCards[];
  /** Ordered bullet-list sections (policies, requirements, etc.). */
  lists?: RawList[];
  faq?: RawFaq;
  team?: RawTeam;
  certifications?: RawCertifications;
  contactInfo?: RawContactInfo;
  showKeyEnablers?: boolean;
  showPartnerships?: boolean;
  /** Preferred: full CTA content stored in Odoo JSON. */
  contactCta?: RawContactCta;
  /** Legacy flag — triggers a bare CTA with no editable text; prefer `contactCta`. */
  showContactCta?: boolean;
  /** Dark button band before the quote form (software category hubs). */
  midCta?: RawMidCta;
  softwareInnerHero?: RawSoftwareInnerHero;
  testimonials?: RawTestimonials;
}

function usableImg(src?: string, alt?: string) {
  if (!src || src === "false") return undefined;
  if (!/^https?:\/\//i.test(src) && !src.startsWith("/")) return undefined;
  return { src: resolveCmsImageSrc(src), alt: alt ?? "" };
}

function joinTitle(t?: RawTitle): string | undefined {
  if (!t) return undefined;
  return [t.before, t.accent, t.after].filter(Boolean).join(" ").trim() || undefined;
}

function autodeskBannerTitle(hero: RawHero): string | undefined {
  const accent = hero.title?.accent?.trim();
  const full = joinTitle(hero.title);
  if (!accent && !full) return undefined;
  const label = accent ?? full!;
  if (/autodesk/i.test(label)) return label;
  if (/^auto\s?cad/i.test(label)) {
    return label.toLowerCase().includes("lt")
      ? "AutoCAD LT software for 2D drafting"
      : "AutoCAD software for 2D and 3D design";
  }
  return `Autodesk ${label}`;
}

function innerProductFallbackImage(slug: string): string | undefined {
  return softwareHeroImage(slug) ?? elvHeroImage(slug);
}

// `SOFTWARE_PRODUCT_HERO_IMAGES` (isSoftwareInnerSlug) is a generic hero-image
// lookup keyed by slug that also happens to cover hub and About Us pages —
// it is not a reliable "is this a product detail page" signal on its own.
// Exclude the hub/about slugs it leaks so they never get migrated into a
// software-inner-hero (mirrors frontend's SOFTWARE_HUB_SLUGS).
const NON_PRODUCT_SLUGS = new Set([
  "software",
  "autodesk",
  "adobe",
  "microsoft",
  "multimedia-software-solutions",
  "aptus-policy",
  "our-story",
  "our-team",
  "why-aptus-infotech",
  "winning-together",
]);

function isInnerProductSlug(slug: string): boolean {
  if (NON_PRODUCT_SLUGS.has(slug)) return false;
  return isSoftwareInnerSlug(slug) || isElvInnerSlug(slug);
}

/** ponytail: Odoo JSON may omit family or use legacy keys — infer from slug once */
function inferInnerHeroFamily(slug: string | undefined, family?: string): string | undefined {
  if (family === "csi") return "structural";
  if (slug === "computers-structures" || slug === "prokon") {
    return family && family !== "autodesk" ? family : "structural";
  }
  if (
    slug === "fortinet" ||
    slug === "sophos" ||
    slug === "kaspersky" ||
    slug === "palo-alto" ||
    slug === "sonicwall-next-gen-firewall" ||
    slug === "antivirus-and-data-security" ||
    slug === "infodrainage" ||
    slug === "infowater-pro" ||
    slug === "infoworks-icm" ||
    slug === "infoworks-ws-pro"
  ) {
    if (slug === "antivirus-and-data-security") {
      return family && family !== "autodesk" ? family : "antivirus";
    }
    if (
      slug === "infodrainage" ||
      slug === "infowater-pro" ||
      slug === "infoworks-icm" ||
      slug === "infoworks-ws-pro"
    ) {
      return family && family !== "autodesk" ? family : "water-infrastructure";
    }
    return family && family !== "autodesk" ? family : "cyber-security";
  }
  // No known slug/family mapping — leave undefined rather than defaulting to
  // "autodesk", which previously made unrelated pages (hubs, About pages)
  // inherit the full Autodesk sidebar whenever Odoo content omitted a family.
  return family;
}

/** Legacy Odoo JSON (hero + intro) → softwareInnerHero with product image. */
function migrateSoftwareInnerJson(data: RawPageJson, slug?: string): RawPageJson {
  if (!slug || !isInnerProductSlug(slug)) return data;
  // `SOFTWARE_PRODUCT_HERO_IMAGES` (isSoftwareInnerSlug) is a generic hero-image
  // lookup keyed by slug and also covers hub/about pages (e.g. "adobe",
  // "autodesk", "why-aptus-infotech"). An explicit "software-landing" hero
  // variant means the page is a hub/landing page on purpose — never migrate
  // it into a product-detail softwareInnerHero.
  if (data.hero?.variant === "software-landing") return data;

  const fallbackImage = innerProductFallbackImage(slug);
  const family = isElvInnerSlug(slug) ? "elv" : inferInnerHeroFamily(slug, data.softwareInnerHero?.family);
  const existing = data.softwareInnerHero;

  if (!existing?.title && data.hero?.visible !== false && data.hero) {
    const hero = data.hero;
    const intro = data.intro?.visible === false ? undefined : data.intro;
    const label = hero.title?.accent ?? joinTitle(hero.title) ?? slug;
    const ctaHref = hero.ctaHref?.startsWith("mailto:") ? "#form" : (hero.ctaHref ?? "#form");

    return {
      ...data,
      softwareInnerHero: {
        id: "hero",
        visible: true,
        family,
        bannerTitle: isElvInnerSlug(slug) ? (hero.title?.accent ?? joinTitle(hero.title) ?? label) : autodeskBannerTitle(hero),
        bannerTagline: hero.subtitle,
        title: intro ? joinTitle(intro.title) : joinTitle(hero.title),
        paragraphs: intro?.paragraphs,
        imageSrc: fallbackImage,
        imageAlt: label,
        ctaLabel: hero.ctaLabel ?? "Request a Quote",
        ctaHref,
      },
      hero: undefined,
      intro: undefined,
      contactCta:
        data.contactCta ??
        (data.showContactCta
          ? {
              heading: "Have questions? We can help",
              showForm: true,
              submitLabel: "Submit Now",
              formVariant: "simple",
              layout: "light",
            }
          : undefined),
    };
  }

  if (existing && !existing.imageSrc && fallbackImage) {
    return {
      ...data,
      softwareInnerHero: {
        ...existing,
        imageSrc: fallbackImage,
        imageAlt: existing.imageAlt ?? slug,
      },
    };
  }

  return data;
}

function parsePresentation(raw?: RawPresentation): CmsPresentationSettings | undefined {
  if (!raw) return undefined;
  const parsed = parseCmsPresentation(raw);
  const hasAny = Object.values(parsed).some((v) => v !== undefined);
  return hasAny ? parsed : undefined;
}

function mapFeatureRowSection(row: RawIntroRow, id: string, order: number): Section {
  return {
    id,
    type: "feature-row",
    order,
    data: {
      type: "feature-row",
      eyebrow: row.eyebrow,
      heading: row.heading ?? row.title,
      headingAccent: row.headingAccent,
      headingAsH1: row.headingAsH1,
      description: row.paragraphs?.join("\n\n"),
      paragraphs: row.paragraphs,
      bullets: row.bullets,
      media: usableImg(row.imageSrc, row.imageAlt),
      imagePosition: row.imagePosition ?? "left",
      variant: row.variant ?? "default",
    },
  };
}

function mapCardSections(data: RawPageJson, sections: Section[], order: { n: number }) {
  const cardGroups: RawCards[] = [];
  if (data.cards && data.cards.visible !== false) cardGroups.push(data.cards);
  if (Array.isArray(data.cardSections)) {
    for (const cs of data.cardSections) {
      if (cs && cs.visible !== false) cardGroups.push(cs);
    }
  }
  for (const cg of cardGroups) {
    if (!cg.items?.length) continue;
    sections.push({
      id: cg.id ?? `page-cards-${order.n}`,
      type: "features",
      order: ++order.n,
      presentation: parsePresentation(cg.presentation),
      data: {
        type: "features",
        eyebrow: cg.eyebrow,
        heading: cg.title?.before,
        headingAccent: [cg.title?.accent, cg.title?.after].filter(Boolean).join(" ") || undefined,
        subheading: cg.subheading,
        align: cg.align,
        variant: cg.variant ?? (cg.id === "pillars" ? "pillars" : "default"),
        gridColumns: cg.gridColumns,
        anchorId: cg.anchorId ?? cg.id,
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
}

export interface MapPageJsonOptions {
  slug?: string;
}

export function mapPageJson(
  raw: string | false | undefined | null,
  options?: MapPageJsonOptions,
): Section[] | null {
  if (!raw || raw === "false") return null;

  let data: RawPageJson;
  try {
    data = JSON.parse(raw) as RawPageJson;
  } catch {
    return null;
  }
  if (!data || typeof data !== "object") return null;

  if (isCaseStudiesPageJson(data)) {
    return mapCaseStudiesPageJson(raw);
  }

  data = migrateSoftwareInnerJson(data, options?.slug);

  const sections: Section[] = [];
  const order = { n: 0 };

  const banner = data.banner;
  if (banner?.imageSrc) {
    sections.push({
      id: "page-banner",
      type: "banner",
      order: ++order.n,
      data: {
        type: "banner",
        media: usableImg(banner.imageSrc, banner.imageAlt),
      },
    });
  }

  const innerHero = data.softwareInnerHero;
  if (innerHero?.topBannerImage) {
    sections.push({
      id: "top-banner-image",
      type: "banner",
      order: ++order.n,
      data: {
        type: "banner",
        media: usableImg(innerHero.topBannerImage, innerHero.imageAlt),
      },
    });
  }

  if (innerHero && innerHero.visible !== false && innerHero.title) {
    const family = inferInnerHeroFamily(options?.slug, innerHero.family);
    const subnavLinks = innerHero.subnavLinks ?? softwareSubnavForFamily(family);
    sections.push({
      id: innerHero.id ?? "software-inner-hero",
      type: "software-inner-hero",
      order: ++order.n,
      data: {
        type: "software-inner-hero",
        bannerTitle: innerHero.bannerTitle,
        bannerTagline: innerHero.bannerTagline,
        pageTitle: innerHero.pageTitle,
        title: innerHero.title,
        paragraphs: innerHero.paragraphs,
        media: usableImg(innerHero.imageSrc, innerHero.imageAlt),
        family,
        subnavLinks,
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
        titleLevel: innerHero.titleLevel,
        introRows: innerHero.introRows?.map((row) => ({
          paragraphs: row.paragraphs,
          media: usableImg(row.imageSrc, row.imageAlt),
          imagePosition: row.imagePosition ?? "left",
        })),
      },
    });
  }

  const hero = data.hero;
  const isWhyPanel = hero?.variant === "why-panel";
  const isIsoPanel = hero?.variant === "iso-page";
  const isCareerPanel = hero?.variant === "career-page";
  const isContactPage = hero?.variant === "contact-page";
  const isSoftwareLanding = hero?.variant === "software-landing";

  if (isSoftwareLanding && hero && hero.visible !== false) {
    sections.push({
      id: hero.id ?? "software-landing-hero",
      type: "software-landing-hero",
      order: ++order.n,
      presentation: parsePresentation(hero.presentation),
      data: {
        type: "software-landing-hero",
        title: joinTitle(hero.title),
        tagline: hero.tagline ?? hero.subtitle,
        highlight: hero.highlight,
        media: usableImg(hero.imageSrc, hero.imageAlt),
        actions: hero.actions
          ?.filter((a) => a.label && a.href)
          .map((a) => ({
            label: a.label!,
            href: a.href!,
            tone: a.tone,
          })),
      },
    });
  } else if (hero && hero.visible !== false && !isWhyPanel && !isIsoPanel && !isCareerPanel && !isContactPage) {
    const title = joinTitle(hero.title);
    const media = usableImg(hero.imageSrc, hero.imageAlt);
    if (title && !media && !hero.subtitle) {
      sections.push({
        id: hero.id ?? "page-title",
        type: "page-title",
        order: ++order.n,
        presentation: parsePresentation(hero.presentation),
        data: { type: "page-title", title },
      });
    } else {
      sections.push({
        id: hero.id ?? "page-hero",
        type: "page-header",
        order: ++order.n,
        presentation: parsePresentation(hero.presentation),
        data: {
          type: "page-header",
          title,
          subtitle: hero.subtitle,
          media,
        },
      });
    }
  }

  const isPolicyPanel = data.intro?.variant === "policy-panel";

  const introRow = data.introRow;
  if (
    introRow &&
    (introRow.title ||
      introRow.heading ||
      introRow.paragraphs?.length ||
      introRow.bullets?.length ||
      introRow.imageSrc)
  ) {
    sections.push(mapFeatureRowSection(introRow, "page-intro-row", ++order.n));
  }

  if (Array.isArray(data.featureRows) && !isPolicyPanel && !isWhyPanel && !isIsoPanel) {
    for (const row of data.featureRows) {
      if (
        !row ||
        (!row.title &&
          !row.heading &&
          !row.paragraphs?.length &&
          !row.bullets?.length &&
          !row.imageSrc)
      ) {
        continue;
      }
      sections.push(mapFeatureRowSection(row, `page-feature-row-${order.n}`, ++order.n));
    }
  }

  mapCardSections(data, sections, order);

  if (isPolicyPanel && data.intro?.visible !== false) {
    const intro = data.intro!;
    const firstRow = data.featureRows?.[0];
    const privacy = data.text?.visible !== false ? data.text : undefined;

    sections.push({
      id: intro.id ?? "page-policy-panel",
      type: "policy-panel",
      order: ++order.n,
      data: {
        type: "policy-panel",
        modusTitle: joinTitle(intro.title),
        infographic: usableImg(intro.imageSrc, intro.imageAlt),
        qualificationHeading: firstRow?.heading,
        qualificationHeadingAccent: firstRow?.headingAccent,
        rows: (data.featureRows ?? []).map((row, i) => ({
          paragraphs: row.paragraphs,
          media: usableImg(row.imageSrc, row.imageAlt),
          imagePosition: row.imagePosition === "left" ? "left" : "right",
          imageWidth:
            i === 0 && row.imagePosition !== "left"
              ? "w-[79%]"
              : i === 1 && row.imagePosition === "left"
                ? "w-[85%]"
                : undefined,
        })),
        privacyHeading: privacy ? joinTitle(privacy.title) : undefined,
        privacyParagraphs: privacy?.paragraphs,
      },
    });
  }

  if (isWhyPanel && hero?.visible !== false) {
    const privacy = data.text?.visible !== false ? data.text : undefined;

    sections.push({
      id: "page-why-panel",
      type: "why-panel",
      order: ++order.n,
      data: {
        type: "why-panel",
        title: joinTitle(hero!.title),
        rows: (data.featureRows ?? []).map((row) => ({
          heading: row.heading ?? row.title,
          bullets: row.bullets,
          media: usableImg(row.imageSrc, row.imageAlt),
          imagePosition: row.imagePosition === "left" ? "left" : "right",
        })),
        privacyHeading: privacy ? joinTitle(privacy.title) : undefined,
        privacyMedia: privacy?.imageSrc ? usableImg(privacy.imageSrc, privacy.imageAlt) : undefined,
      },
    });
  }

  if (isIsoPanel && hero?.visible !== false) {
    const intro = data.intro?.visible !== false ? data.intro : undefined;
    const footer = data.text?.visible !== false ? data.text : undefined;
    const coreList = data.lists?.find((ls) => ls && ls.visible !== false && ls.items?.length);

    sections.push({
      id: "page-iso-panel",
      type: "iso-panel",
      order: ++order.n,
      data: {
        type: "iso-panel",
        title: joinTitle(hero!.title),
        subtitle: hero!.subtitle,
        introHeading: intro ? joinTitle(intro.title) : undefined,
        introParagraphs: intro?.paragraphs,
        coreHeading: coreList ? joinTitle(coreList.title) : undefined,
        coreItems: coreList?.items,
        certificates: (data.featureRows ?? [])
          .map((row) => ({
            heading: row.heading,
            headingAccent: row.headingAccent,
            media: usableImg(row.imageSrc, row.imageAlt),
            downloadHref: row.downloadHref,
          }))
          .filter((row) => row.media || row.heading || row.headingAccent),
        footerParagraphs: footer?.paragraphs,
      },
    });
  }

  if (isCareerPanel && hero?.visible !== false) {
    const intro = data.intro?.visible !== false ? data.intro : undefined;

    sections.push({
      id: "page-career-panel",
      type: "career-panel",
      order: ++order.n,
      data: {
        type: "career-panel",
        title: joinTitle(hero!.title),
        tagline: hero!.subtitle,
        paragraphs: intro?.paragraphs,
      },
    });
  }

  const flipCards = data.flipCards;
  if (flipCards && (flipCards.spotlight || flipCards.items?.length)) {
    sections.push({
      id: "page-flip-cards",
      type: "flip-cards",
      order: ++order.n,
      data: {
        type: "flip-cards",
        spotlight: flipCards.spotlight?.title
          ? { title: flipCards.spotlight.title, icon: flipCards.spotlight.icon }
          : undefined,
        items: flipCards.items?.map((item, i) => ({
          id: item.id ?? `flip-${i}`,
          title: item.title ?? "",
          description: item.description,
          icon: item.icon,
          variant: item.variant,
        })),
      },
    });
  }

  const team = data.team;
  if (team && team.visible !== false && (team.eyebrow || joinTitle(team.title) || team.members?.length)) {
    sections.push({
      id: "page-team",
      type: "team",
      order: ++order.n,
      presentation: parsePresentation(team.presentation),
      data: {
        type: "team",
        eyebrow: team.eyebrow,
        heading: joinTitle(team.title),
        variant: team.variant,
        members: team.members?.map((m, i) => ({
          id: m.id ?? `member-${i}`,
          name: m.name,
          role: m.role,
          bio: m.bio,
          avatar: usableImg(m.imageSrc, m.imageAlt ?? m.name),
        })),
      },
    });
  }

  for (const block of [data.intro, data.text].filter(Boolean)) {
    if (!block || block.visible === false) continue;
    if (isPolicyPanel && (block === data.intro || block === data.text)) continue;
    if (isWhyPanel && block === data.text) continue;
    if (isIsoPanel && (block === data.intro || block === data.text)) continue;
    if (isCareerPanel && block === data.intro) continue;
    const hasContent =
      block.eyebrow ||
      joinTitle(block.title) ||
      block.paragraphs?.length ||
      block.bullets?.length ||
      block.imageSrc;
    if (!hasContent) continue;

    const culturePanel = block.variant === "culture-panel";

    sections.push({
      id: `page-text-${order}`,
      type: "rich-text",
      order: ++order.n,
      presentation: parsePresentation(block.presentation),
      data: {
        type: "rich-text",
        eyebrow: block.eyebrow,
        heading: block.title?.before,
        headingAccent: block.title?.accent
          ? [block.title.accent, block.title.after].filter(Boolean).join(" ") || block.title.accent
          : block.title?.after,
        paragraphs: block.paragraphs,
        bullets: block.bullets,
        media: usableImg(block.imageSrc, block.imageAlt),
        imagePosition: block.imagePosition,
        variant: block.variant,
        background: culturePanel ? "white" : order.n % 2 === 0 ? "light" : "white",
      },
    });
  }

  const certs = data.certifications;
  if (certs && certs.visible !== false && certs.items?.length) {
    const items: LogoItem[] = certs.items
      .map((c, i) => {
        const src = c.imageSrc;
        if (!src) return null;
        return {
          id: c.id ?? `cert-${i}`,
          src: resolveCmsImageSrc(src),
          alt: c.imageAlt ?? c.title ?? "Certificate",
        };
      })
      .filter((x): x is LogoItem => !!x);

    if (items.length) {
      sections.push({
        id: "page-certs",
        type: "logo-grid",
        order: ++order.n,
        presentation: parsePresentation(certs.presentation),
        data: {
          type: "logo-grid",
          eyebrow: certs.eyebrow,
          heading: joinTitle(certs.title),
          items,
        },
      });
    }
  }

  const contact = data.contactInfo;
  if (contact && contact.visible !== false) {
    sections.push({
      id: "page-contact",
      type: "contact",
      order: ++order.n,
      presentation: parsePresentation(contact.presentation),
      data: {
        type: "contact",
        variant: isContactPage ? "contact-page" : undefined,
        heading: joinTitle(contact.title),
        description: contact.description,
        phone: contact.phone,
        email: contact.email,
        address: contact.address,
        mapEmbedUrl: contact.mapEmbedUrl,
      },
    });
  }

  // Bullet list sections
  if (Array.isArray(data.lists) && !isIsoPanel) {
    for (const ls of data.lists) {
      if (!ls || ls.visible === false || !ls.items?.length) continue;
      sections.push({
        id: ls.id ?? `page-list-${order}`,
        type: "rich-text",
        order: ++order.n,
        presentation: parsePresentation(ls.presentation),
        data: {
          type: "rich-text",
          eyebrow: ls.eyebrow,
          heading: ls.title?.before,
          headingAccent: [ls.title?.accent, ls.title?.after].filter(Boolean).join(" ") || undefined,
          bullets: ls.items,
          background: order.n % 2 === 0 ? "light" : "white",
        },
      });
    }
  }

  // FAQ section
  const faq = data.faq;
  if (faq && faq.visible !== false && faq.items?.length) {
    sections.push({
      id: "page-faq",
      type: "faq",
      order: ++order.n,
      presentation: parsePresentation(faq.presentation),
      data: {
        type: "faq",
        eyebrow: faq.eyebrow,
        heading: faq.title?.before,
        headingAccent: [faq.title?.accent, faq.title?.after].filter(Boolean).join(" ") || undefined,
        items: faq.items.map((it, i): FaqItem => ({
          id: it.id ?? `faq-${i}`,
          question: it.question,
          answer: it.answer,
        })),
      },
    });
  }

  // ponytail: shared blocks for `showKeyEnablers` / `showPartnerships` flags
  if (data.showKeyEnablers) {
    sections.push({
      id: "shared-key-enablers",
      type: "key-enablers",
      order: ++order.n,
      data: {
        type: "key-enablers",
        eyebrow: "Key Enablers",
        heading: "We Provide Industry Demand",
        headingAccent: "Services",
        subheading:
          "To Do Business In A Better Way And Provide Quintessential Services",
        items: [
          {
            id: "ke-0",
            number: "01",
            title: "Differentiated Client Engagement",
            description:
              "Differentiated at the Front through industry and client insight",
          },
          {
            id: "ke-1",
            number: "02",
            title: "Deep Industry Insights",
            description:
              "Uncovering key characteristics of industries and offering unique solutions",
          },
          {
            id: "ke-2",
            number: "03",
            title: "Standardization Of Delivery",
            description:
              "Delivery models targeting faster, efficient and business-aligned KPIs",
          },
          {
            id: "ke-3",
            number: "04",
            title: "Strategic Partnerships",
            description:
              "360° relationship; collaborative offerings, innovation with product partners and investment in next-gen technologies",
          },
          {
            id: "ke-4",
            number: "05",
            title: "Culture",
            description: "Collaboration with customers, employees and partners",
          },
        ],
      },
    });
  }

  const midCta = data.midCta;
  if (midCta?.heading) {
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
  }

  const testimonials = data.testimonials;
  if (testimonials && testimonials.visible !== false && testimonials.items?.length) {
    sections.push({
      id: "page-testimonials",
      type: "testimonials",
      order: ++order.n,
      data: {
        type: "testimonials",
        heading: joinTitle(testimonials.title),
        subheading: testimonials.subheading,
        variant: testimonials.variant ?? (options?.slug && (isInnerProductSlug(options.slug) || isElvHubSlug(options.slug)) ? "software-quotes" : "default"),
        items: testimonials.items.map((it, i) => ({
          id: it.id ?? `testimonial-${i}`,
          quote: it.quote,
          author: it.author,
          role: it.role,
          company: it.company,
        })),
      },
    });
  }

  if (data.showPartnerships) {
    sections.push({
      id: "shared-partnerships",
      type: "rich-text",
      order: ++order.n,
      data: {
        type: "rich-text",
        eyebrow: "Partnerships",
        heading: "Winning together with",
        headingAccent: "Strategic Alliances",
        paragraphs: [
          "As Gold Partners of leading ISVs including Autodesk, Adobe, and Oracle, we combine genuine licensing with implementation expertise — helping clients across sectors adopt the right technology with confidence.",
        ],
        background: "white",
      },
    });
  }

  const partnerships = data.partnerships;
  if (partnerships?.logos?.length) {
    const items: LogoItem[] = partnerships.logos
      .map((logo, i) => {
        const src = logo.src;
        if (!src) return null;
        return {
          id: logo.id ?? `partner-${i}`,
          src: resolveCmsImageSrc(src),
          alt: logo.alt ?? "Partner",
        };
      })
      .filter((x): x is LogoItem => !!x);

    if (items.length) {
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
    }
  }

  // CTA — explicit `contactCta` object and/or legacy `showContactCta` flag
  const cta = data.contactCta;
  if (cta || data.showContactCta) {
    sections.push({
      id: "page-cta",
      type: "cta",
      order: ++order.n,
      data: {
        type: "cta",
        heading: isContactPage
          ? (joinTitle(hero?.title) ?? cta?.heading)
          : (cta?.heading ?? "Have questions? We can help"),
        description: isContactPage ? hero?.subtitle : cta?.description,
        action: cta?.actionLabel
          ? { label: cta.actionLabel, href: cta.actionHref ?? "/contact-us" }
          : { label: "Contact Us", href: "/contact-us" },
        showForm: cta?.showForm ?? data.showContactCta,
        submitLabel: cta?.submitLabel ?? "Submit Now",
        formVariant: cta?.formVariant ?? "simple",
        layout:
          cta?.layout ??
          (isContactPage
            ? "contact-page"
            : (cta?.formVariant ?? "simple") === "career"
              ? "career"
              : (cta?.showForm ?? data.showContactCta) && (cta?.formVariant ?? "simple") === "simple"
                ? "light"
                : "dark"),
      },
    });
  }

  return sections.length > 0 ? sections : null;
}

// ponytail: self-check — legacy Autodesk hero JSON must map to software-inner-hero with media
const _legacyRevit = JSON.stringify({
  hero: {
    visible: true,
    title: { accent: "Revit" },
    subtitle: "BIM platform",
    ctaLabel: "Request a Quote",
    ctaHref: "#form",
  },
  intro: { visible: true, title: { before: "Build with", accent: "BIM" }, paragraphs: ["p1"] },
  showContactCta: true,
});
const _revitSections = mapPageJson(_legacyRevit, { slug: "revit" });
const _hero = _revitSections?.find((s) => s.type === "software-inner-hero");
if (!_hero || _hero.data.type !== "software-inner-hero" || !_hero.data.media?.src) {
  throw new Error("migrateSoftwareInnerJson: revit legacy JSON must produce hero media");
}
const _orderCheck = mapPageJson(
  JSON.stringify({
    testimonials: { visible: true, items: [{ quote: "q", author: "a" }] },
    partnerships: { heading: "Winning together with", logos: [{ src: "https://example.com/a.png" }] },
    contactCta: { heading: "Have questions? We can help", showForm: true },
  }),
);
const _types = _orderCheck?.map((s) => s.type) ?? [];
const _ti = _types.indexOf("testimonials");
const _pi = _types.indexOf("logo-grid");
const _ci = _types.lastIndexOf("cta");
if (!(_ti >= 0 && _pi > _ti && _ci > _pi)) {
  throw new Error("partnerships logo-grid must render after testimonials and before contact CTA");
}
