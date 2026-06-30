import type { MarketingPageContent, MarketingPageSections } from "@/types/marketing-page";

/** Generic JSON field for inner marketing pages (About Us sub-pages, etc.). */
export type OdooMarketingPageSectionsJson = MarketingPageSections;

/** Strip SEO meta — paste result into Odoo `x_page_sections_json`. */
export function toMarketingOdooSections(content: MarketingPageContent): MarketingPageSections {
  const { metaTitle: _t, metaDescription: _d, source: _s, ...sections } = content;
  void _t;
  void _d;
  void _s;
  return sections;
}

export function getMarketingPageJsonFieldName(): string {
  return process.env.ODOO_CMS_PAGE_JSON_FIELD?.trim() || "x_page_sections_json";
}

export function parseOdooMarketingPageSectionsJson(
  raw: string | null | undefined,
): OdooMarketingPageSectionsJson | null {
  if (!raw?.trim()) return null;

  try {
    const parsed = JSON.parse(raw) as OdooMarketingPageSectionsJson;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

function mergeListSection(
  defaults: MarketingPageContent["lists"],
  overrides: MarketingPageContent["lists"],
): MarketingPageContent["lists"] {
  if (!overrides?.length) return defaults;
  if (!defaults?.length) return overrides;

  return defaults.map((section, index) => {
    const override = overrides[index];
    if (!override) return section;
    return {
      ...section,
      ...override,
      items: override.items?.length ? override.items : section.items,
    };
  });
}

export function mergeMarketingPageSections(
  defaults: MarketingPageContent,
  overrides: OdooMarketingPageSectionsJson | null,
): MarketingPageSections {
  if (!overrides) {
    const { metaTitle: _t, metaDescription: _d, source: _s, ...sections } = defaults;
    void _t;
    void _d;
    void _s;
    return sections;
  }

  return {
    hero: overrides.hero ? { ...defaults.hero!, ...overrides.hero } : defaults.hero,
    intro: overrides.intro ? { ...defaults.intro!, ...overrides.intro } : defaults.intro,
    cards: overrides.cards
      ? {
          ...defaults.cards!,
          ...overrides.cards,
          items: overrides.cards.items?.length ? overrides.cards.items : defaults.cards!.items,
        }
      : defaults.cards,
    cardSections: overrides.cardSections?.length
      ? overrides.cardSections
      : defaults.cardSections,
    lists: mergeListSection(defaults.lists, overrides.lists),
    team: overrides.team
      ? {
          ...defaults.team!,
          ...overrides.team,
          members: overrides.team.members?.length
            ? overrides.team.members
            : defaults.team!.members,
          closingParagraphs: overrides.team.closingParagraphs?.length
            ? overrides.team.closingParagraphs
            : defaults.team!.closingParagraphs,
        }
      : defaults.team,
    certifications: overrides.certifications
      ? {
          ...defaults.certifications!,
          ...overrides.certifications,
          items: overrides.certifications.items?.length
            ? overrides.certifications.items
            : defaults.certifications!.items,
        }
      : defaults.certifications,
    contactInfo: overrides.contactInfo
      ? { ...defaults.contactInfo!, ...overrides.contactInfo }
      : defaults.contactInfo,
    text: overrides.text ? { ...defaults.text!, ...overrides.text } : defaults.text,
    showKeyEnablers: overrides.showKeyEnablers ?? defaults.showKeyEnablers,
    showPartnerships: overrides.showPartnerships ?? defaults.showPartnerships,
    showContactCta: overrides.showContactCta ?? defaults.showContactCta,
  };
}
