import type { CaseStudiesPageContent } from "@/types/case-studies-page";

/** JSON stored in Odoo `x_case_studies_sections_json` — section content only (no SEO meta). */
export type OdooCaseStudiesPageSectionsJson = {
  hero?: CaseStudiesPageContent["hero"];
  caseStudies?: CaseStudiesPageContent["caseStudies"];
  painPoints?: CaseStudiesPageContent["painPoints"];
  whyChoose?: CaseStudiesPageContent["whyChoose"];
  transformCta?: CaseStudiesPageContent["transformCta"];
  testimonials?: CaseStudiesPageContent["testimonials"];
  partnerships?: CaseStudiesPageContent["partnerships"];
  showContactCta?: boolean;
};

export function getCaseStudiesJsonFieldName(): string {
  return process.env.ODOO_CMS_CASE_STUDIES_JSON_FIELD?.trim() || "x_case_studies_sections_json";
}

export function toOdooCaseStudiesPageSectionsJson(
  content: CaseStudiesPageContent,
): OdooCaseStudiesPageSectionsJson {
  return {
    hero: content.hero,
    caseStudies: content.caseStudies,
    painPoints: content.painPoints,
    whyChoose: content.whyChoose,
    transformCta: content.transformCta,
    testimonials: content.testimonials,
    partnerships: content.partnerships,
    showContactCta: content.showContactCta,
  };
}

export function parseOdooCaseStudiesPageSectionsJson(
  raw: string | null | undefined,
): OdooCaseStudiesPageSectionsJson | null {
  if (!raw?.trim()) return null;

  try {
    const parsed = JSON.parse(raw) as OdooCaseStudiesPageSectionsJson;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function mergeCaseStudiesPageSections(
  defaults: CaseStudiesPageContent,
  overrides: OdooCaseStudiesPageSectionsJson | null,
): Pick<
  CaseStudiesPageContent,
  | "hero"
  | "caseStudies"
  | "painPoints"
  | "whyChoose"
  | "transformCta"
  | "testimonials"
  | "partnerships"
  | "showContactCta"
> {
  if (!overrides) {
    return {
      hero: defaults.hero,
      caseStudies: defaults.caseStudies,
      painPoints: defaults.painPoints,
      whyChoose: defaults.whyChoose,
      transformCta: defaults.transformCta,
      testimonials: defaults.testimonials,
      partnerships: defaults.partnerships,
      showContactCta: defaults.showContactCta,
    };
  }

  return {
    hero: overrides.hero ? { ...defaults.hero, ...overrides.hero } : defaults.hero,
    caseStudies: overrides.caseStudies
      ? {
          ...defaults.caseStudies,
          ...overrides.caseStudies,
          items: overrides.caseStudies.items?.length
            ? overrides.caseStudies.items
            : defaults.caseStudies.items,
        }
      : defaults.caseStudies,
    painPoints: overrides.painPoints
      ? {
          ...defaults.painPoints,
          ...overrides.painPoints,
          items: overrides.painPoints.items?.length
            ? overrides.painPoints.items
            : defaults.painPoints.items,
        }
      : defaults.painPoints,
    whyChoose: overrides.whyChoose
      ? {
          ...defaults.whyChoose,
          ...overrides.whyChoose,
          items: overrides.whyChoose.items?.length
            ? overrides.whyChoose.items
            : defaults.whyChoose.items,
        }
      : defaults.whyChoose,
    transformCta: overrides.transformCta
      ? { ...defaults.transformCta, ...overrides.transformCta }
      : defaults.transformCta,
    testimonials: overrides.testimonials
      ? {
          ...defaults.testimonials,
          ...overrides.testimonials,
          items: overrides.testimonials.items?.length
            ? overrides.testimonials.items
            : defaults.testimonials.items,
        }
      : defaults.testimonials,
    partnerships: overrides.partnerships
      ? {
          ...defaults.partnerships,
          ...overrides.partnerships,
          logos: overrides.partnerships.logos?.length
            ? overrides.partnerships.logos
            : (defaults.partnerships?.logos ?? []),
        }
      : defaults.partnerships,
    showContactCta: overrides.showContactCta ?? defaults.showContactCta,
  };
}
