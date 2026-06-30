import type { EtapPageContent, OdooEtapPageSectionsJson } from "@/types/etap-page";

export function getEtapJsonFieldName(): string {
  return process.env.ODOO_CMS_ETAP_JSON_FIELD?.trim() || "x_etap_sections_json";
}

export function toOdooEtapPageSectionsJson(content: EtapPageContent): OdooEtapPageSectionsJson {
  const {
    metaTitle: _t,
    metaDescription: _d,
    source: _s,
    ...sections
  } = content;
  void _t;
  void _d;
  void _s;
  return sections;
}

export function parseOdooEtapPageSectionsJson(
  raw: string | null | undefined,
): OdooEtapPageSectionsJson | null {
  if (!raw?.trim()) return null;

  try {
    const parsed = JSON.parse(raw) as OdooEtapPageSectionsJson;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

function mergeItems<T>(defaults: T[] | undefined, overrides: T[] | undefined): T[] {
  if (overrides?.length) return overrides;
  return defaults ?? [];
}

export function mergeEtapPageSections(
  defaults: EtapPageContent,
  overrides: OdooEtapPageSectionsJson | null,
): Omit<EtapPageContent, "metaTitle" | "metaDescription" | "source"> {
  if (!overrides) {
    const { metaTitle: _t, metaDescription: _d, source: _s, ...sections } = defaults;
    void _t;
    void _d;
    void _s;
    return sections;
  }

  return {
    hero: overrides.hero ? { ...defaults.hero, ...overrides.hero } : defaults.hero,
    overview: overrides.overview
      ? { ...defaults.overview, ...overrides.overview }
      : defaults.overview,
    solutions: overrides.solutions
      ? {
          ...defaults.solutions,
          ...overrides.solutions,
          items: mergeItems(defaults.solutions?.items, overrides.solutions.items),
        }
      : defaults.solutions,
    benefits: overrides.benefits
      ? {
          ...defaults.benefits,
          ...overrides.benefits,
          items: mergeItems(defaults.benefits?.items, overrides.benefits.items),
        }
      : defaults.benefits,
    industries: overrides.industries
      ? {
          ...defaults.industries,
          ...overrides.industries,
          items: mergeItems(defaults.industries?.items, overrides.industries.items),
        }
      : defaults.industries,
    statistics: overrides.statistics
      ? {
          ...defaults.statistics,
          ...overrides.statistics,
          items: mergeItems(defaults.statistics?.items, overrides.statistics.items),
        }
      : defaults.statistics,
    partner: (() => {
      const partnerOverride = overrides.partner ?? overrides.whyAptus;
      if (!partnerOverride) return defaults.partner;
      return {
        ...defaults.partner,
        ...partnerOverride,
        items: mergeItems(defaults.partner?.items, partnerOverride.items),
      };
    })(),
    testimonials: overrides.testimonials
      ? {
          ...defaults.testimonials,
          ...overrides.testimonials,
          items: mergeItems(defaults.testimonials?.items, overrides.testimonials.items),
        }
      : defaults.testimonials,
    faqs: overrides.faqs
      ? {
          ...defaults.faqs,
          ...overrides.faqs,
          items: mergeItems(defaults.faqs?.items, overrides.faqs.items),
        }
      : defaults.faqs,
    cta: overrides.cta ? { ...defaults.cta, ...overrides.cta } : defaults.cta,
  };
}
