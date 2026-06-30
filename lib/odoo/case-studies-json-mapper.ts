/**
 * Maps Odoo `x_case_studies_sections_json` → Section[] for /aptus-case-studies.
 */

import type { LogoItem, Section } from "@/types";

interface RawTitle {
  before?: string;
  accent?: string;
  after?: string;
}

interface RawCaseStudyItem {
  title?: string;
  description?: string;
  pdfHref?: string;
  readMoreLabel?: string;
  imageSrc?: string;
  imageAlt?: string;
}

interface RawCardBlock {
  id?: string;
  visible?: boolean;
  title?: RawTitle;
  eyebrow?: string;
  items?: { title?: string; description?: string }[];
  closingParagraph?: string;
}

interface RawCaseStudiesTestimonial {
  quote?: string;
  authorName?: string;
  authorRole?: string;
  company?: string;
}

interface RawCaseStudiesJson {
  hero?: {
    id?: string;
    visible?: boolean;
    title?: RawTitle;
    subtitle?: string;
    backgroundImage?: string;
  };
  caseStudies?: RawCardBlock & { items?: RawCaseStudyItem[] };
  painPoints?: RawCardBlock;
  whyChoose?: RawCardBlock;
  transformCta?: {
    id?: string;
    visible?: boolean;
    title?: RawTitle;
    subtitle?: string;
    ctaLabel?: string;
    ctaHref?: string;
  };
  testimonials?: {
    id?: string;
    visible?: boolean;
    eyebrow?: string;
    title?: RawTitle;
    items?: RawCaseStudiesTestimonial[];
  };
  partnerships?: {
    id?: string;
    visible?: boolean;
    title?: RawTitle;
    logos?: { src?: string; alt?: string }[];
  };
  showContactCta?: boolean;
  contactCta?: {
    heading?: string;
    subtitle?: string;
    description?: string;
    showForm?: boolean;
    submitLabel?: string;
    layout?: "dark" | "light" | "career";
  };
}

function joinTitle(t?: RawTitle): string | undefined {
  if (!t) return undefined;
  return [t.before, t.accent, t.after].filter(Boolean).join(" ").trim() || undefined;
}

function usableImg(src?: string, alt?: string) {
  if (!src || src === "false") return undefined;
  if (!/^https?:\/\//i.test(src) && !src.startsWith("/")) return undefined;
  return { src, alt: alt ?? "" };
}

export function isCaseStudiesPageJson(data: unknown): data is RawCaseStudiesJson {
  return (
    !!data &&
    typeof data === "object" &&
    "caseStudies" in data &&
    !!(data as RawCaseStudiesJson).caseStudies?.items?.length
  );
}

const PAIN_POINT_ICONS = ["thermometer-half", "shield-alt", "bullseye"] as const;
const WHY_CHOOSE_ICONS = ["map-marker-alt", "tools", "certificate", "chart-line"] as const;

export function mapCaseStudiesPageJson(raw: string | false | undefined | null): Section[] | null {
  if (!raw || raw === "false") return null;

  let data: RawCaseStudiesJson;
  try {
    data = JSON.parse(raw) as RawCaseStudiesJson;
  } catch {
    return null;
  }

  if (!isCaseStudiesPageJson(data)) return null;

  const sections: Section[] = [];
  let order = 0;

  const hero = data.hero;
  if (hero && hero.visible !== false) {
    const title = joinTitle(hero.title);
    const media = usableImg(hero.backgroundImage, title);
    if (title || hero.subtitle || media) {
      sections.push({
        id: hero.id ?? "case-studies-hero",
        type: "page-header",
        order: ++order,
        data: {
          type: "page-header",
          title,
          subtitle: hero.subtitle,
          media,
        },
      });
    }
  }

  const caseStudies = data.caseStudies;
  if (caseStudies?.visible !== false && caseStudies?.items?.length) {
    sections.push({
      id: caseStudies.id ?? "case-studies-grid",
      type: "features",
      order: ++order,
      data: {
        type: "features",
        heading: caseStudies.title?.before,
        headingAccent: caseStudies.title?.accent,
        variant: "product-cards",
        gridColumns: 4,
        anchorId: caseStudies.id ?? "Case",
        items: caseStudies.items.map((item, i) => ({
          id: `case-study-${i}`,
          title: item.title,
          description: item.description,
          media: usableImg(item.imageSrc, item.imageAlt ?? item.title),
          href: item.pdfHref,
          action:
            item.pdfHref && (item.readMoreLabel ?? "Read More")
              ? { label: item.readMoreLabel ?? "Read More", href: item.pdfHref }
              : undefined,
        })),
      },
    });
  }

  const painPoints = data.painPoints;
  if (painPoints?.visible !== false && painPoints?.items?.length) {
    sections.push({
      id: painPoints.id ?? "pain-points",
      type: "features",
      order: ++order,
      data: {
        type: "features",
        heading: painPoints.title?.before,
        headingAccent: painPoints.title?.accent,
        variant: "icon-cards",
        gridColumns: 3,
        items: painPoints.items.map((item, i) => ({
          id: `pain-point-${i}`,
          title: item.title,
          description: item.description,
          icon: PAIN_POINT_ICONS[i] ?? PAIN_POINT_ICONS[0],
        })),
      },
    });

    if (painPoints.closingParagraph) {
      sections.push({
        id: "pain-points-closing",
        type: "rich-text",
        order: ++order,
        data: {
          type: "rich-text",
          paragraphs: [painPoints.closingParagraph],
          background: "white",
        },
      });
    }
  }

  const whyChoose = data.whyChoose;
  if (whyChoose?.visible !== false && whyChoose?.items?.length) {
    sections.push({
      id: whyChoose.id ?? "why-choose",
      type: "features",
      order: ++order,
      data: {
        type: "features",
        eyebrow: whyChoose.eyebrow,
        heading: whyChoose.title?.before,
        headingAccent: whyChoose.title?.accent,
        variant: "icon-cards",
        gridColumns: 4,
        anchorId: "why-choose",
        items: whyChoose.items.map((item, i) => ({
          id: `why-choose-${i}`,
          title: item.title,
          description: item.description,
          icon: WHY_CHOOSE_ICONS[i] ?? WHY_CHOOSE_ICONS[0],
        })),
      },
    });
  }

  const transformCta = data.transformCta;
  if (transformCta && transformCta.visible !== false && joinTitle(transformCta.title)) {
    sections.push({
      id: transformCta.id ?? "transform-cta",
      type: "cta",
      order: ++order,
      data: {
        type: "cta",
        heading: joinTitle(transformCta.title),
        description: transformCta.subtitle,
        action: {
          label: transformCta.ctaLabel ?? "Get Your Quote Now",
          href: transformCta.ctaHref ?? "#Form",
        },
        layout: "software-mid",
      },
    });
  }

  const testimonials = data.testimonials;
  if (testimonials?.visible !== false && testimonials?.items?.length) {
    sections.push({
      id: testimonials.id ?? "testimonials",
      type: "testimonials",
      order: ++order,
      data: {
        type: "testimonials",
        heading: testimonials.eyebrow ?? joinTitle(testimonials.title),
        subheading: testimonials.eyebrow ? joinTitle(testimonials.title) : undefined,
        variant: "software-quotes",
        items: testimonials.items.map((item, i) => ({
          id: `testimonial-${i}`,
          quote: item.quote,
          author: item.authorName,
          role: item.authorRole,
          company: item.company,
        })),
      },
    });
  }

  const partnerships = data.partnerships;
  if (partnerships?.visible !== false && partnerships?.logos?.length) {
    const items: LogoItem[] = partnerships.logos
      .map((logo, i) => {
        const src = logo.src;
        if (!src) return null;
        return { id: `partner-${i}`, src, alt: logo.alt ?? "Partner" };
      })
      .filter((x): x is LogoItem => !!x);

    if (items.length) {
      sections.push({
        id: partnerships.id ?? "partnerships",
        type: "logo-grid",
        order: ++order,
        data: {
          type: "logo-grid",
          heading: partnerships.title?.before,
          headingAccent: partnerships.title?.accent,
          variant: "alliances",
          items,
        },
      });
    }
  }

  const cta = data.contactCta;
  if (cta || data.showContactCta) {
    sections.push({
      id: "page-cta",
      type: "cta",
      order: ++order,
      data: {
        type: "cta",
        heading: cta?.heading ?? "Have questions? We can help",
        description: cta?.subtitle ?? cta?.description,
        showForm: cta?.showForm ?? data.showContactCta,
        submitLabel: cta?.submitLabel ?? "Submit Now",
        formVariant: "simple",
        layout: cta?.layout ?? "light",
      },
    });
  }

  return sections.length > 0 ? sections : null;
}

// ponytail: self-check — case studies JSON must produce hero + grid + contact CTA
const _sample = JSON.stringify({
  hero: { title: { before: "Aptus", accent: "Stories" }, subtitle: "sub" },
  caseStudies: {
    items: [{ title: "Test", description: "d", pdfHref: "https://example.com/a.pdf" }],
  },
  showContactCta: true,
});
const _mapped = mapCaseStudiesPageJson(_sample);
if (!_mapped?.some((s) => s.type === "features") || !_mapped.some((s) => s.type === "cta")) {
  throw new Error("mapCaseStudiesPageJson: expected features + cta sections");
}
