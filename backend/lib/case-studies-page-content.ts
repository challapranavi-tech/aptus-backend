import { loadLocalPageSectionsJson } from "@/lib/odoo/local-page-json";
import type { CaseStudiesPageContent } from "@/types/case-studies-page";

function parseCaseStudiesJson(raw: string): CaseStudiesPageContent | null {
  try {
    const data = JSON.parse(raw) as CaseStudiesPageContent;
    if (!data.hero || !data.caseStudies) return null;
    return data;
  } catch {
    return null;
  }
}

/** Fill missing card/partner images from local JSON when Odoo omits them. */
function backfillImages(
  content: CaseStudiesPageContent,
  local: CaseStudiesPageContent | null,
): CaseStudiesPageContent {
  if (!local) return content;

  const byTitle = new Map(local.caseStudies.items.map((item) => [item.title, item]));
  for (const item of content.caseStudies.items) {
    const loc = byTitle.get(item.title);
    if (!loc?.imageSrc || item.imageSrc) continue;
    item.imageSrc = loc.imageSrc;
    item.imageAlt ??= loc.imageAlt;
  }

  if (!content.partnerships?.logos?.length && local.partnerships?.logos?.length) {
    content.partnerships = local.partnerships;
  }

  return content;
}

/**
 * Load typed case-studies content.
 * Priority: Odoo JSON (when provided) → local disk JSON (dev fallback).
 */
export function loadCaseStudiesPageContent(
  odooJson?: string | false | null,
): CaseStudiesPageContent | null {
  const localRaw = loadLocalPageSectionsJson("aptus-case-studies");
  const local = localRaw ? parseCaseStudiesJson(localRaw) : null;

  // Odoo is the source of truth — use it when available
  if (odooJson && typeof odooJson === "string") {
    const content = parseCaseStudiesJson(odooJson);
    if (content) return backfillImages(content, local);
  }
  // Local disk JSON — fallback for dev when not yet seeded to Odoo
  return local;
}

// ponytail: self-check — Odoo payloads without images must pick up local imageSrc
{
  const sample = backfillImages(
    {
      hero: { title: { accent: "x" }, subtitle: "" },
      caseStudies: {
        title: { accent: "x" },
        items: [{ title: "Al Nadha Hospital", description: "", pdfHref: "#" }],
      },
      painPoints: { title: { accent: "x" }, items: [], closingParagraph: "" },
      whyChoose: { title: { accent: "x" }, items: [] },
      transformCta: { title: { accent: "x" }, subtitle: "", ctaLabel: "", ctaHref: "#" },
      testimonials: { eyebrow: "", title: { accent: "x" }, items: [] },
    },
    {
      hero: { title: { accent: "x" }, subtitle: "" },
      caseStudies: {
        title: { accent: "x" },
        items: [
          {
            title: "Al Nadha Hospital",
            description: "",
            pdfHref: "#",
            imageSrc: "/images/Al-Nahda.jpg",
          },
        ],
      },
      painPoints: { title: { accent: "x" }, items: [], closingParagraph: "" },
      whyChoose: { title: { accent: "x" }, items: [] },
      transformCta: { title: { accent: "x" }, subtitle: "", ctaLabel: "", ctaHref: "#" },
      testimonials: { eyebrow: "", title: { accent: "x" }, items: [] },
    },
  );
  if (sample.caseStudies.items[0]?.imageSrc !== "/images/Al-Nahda.jpg") {
    throw new Error("backfillImages: expected local imageSrc");
  }
}
