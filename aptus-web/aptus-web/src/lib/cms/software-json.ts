import type { SoftwarePageContent } from "@/types/software-page";

/** JSON stored in Odoo `x_software_sections_json` — section content only (no SEO meta). */
export type OdooSoftwarePageSectionsJson = {
  hero?: SoftwarePageContent["hero"];
  intro?: SoftwarePageContent["intro"];
  categories?: SoftwarePageContent["categories"];
  process?: SoftwarePageContent["process"];
  whyChoose?: SoftwarePageContent["whyChoose"];
  showContactCta?: boolean;
};

export function getSoftwareJsonFieldName(): string {
  return process.env.ODOO_CMS_SOFTWARE_JSON_FIELD?.trim() || "x_software_sections_json";
}

export function toOdooSoftwarePageSectionsJson(
  content: SoftwarePageContent,
): OdooSoftwarePageSectionsJson {
  return {
    hero: content.hero,
    intro: content.intro,
    categories: content.categories,
    process: content.process,
    whyChoose: content.whyChoose,
    showContactCta: content.showContactCta,
  };
}

export function parseOdooSoftwarePageSectionsJson(
  raw: string | null | undefined,
): OdooSoftwarePageSectionsJson | null {
  if (!raw?.trim()) return null;

  try {
    const parsed = JSON.parse(raw) as OdooSoftwarePageSectionsJson;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function mergeSoftwarePageSections(
  defaults: SoftwarePageContent,
  overrides: OdooSoftwarePageSectionsJson | null,
): Pick<
  SoftwarePageContent,
  "hero" | "intro" | "categories" | "process" | "whyChoose" | "showContactCta"
> {
  if (!overrides) {
    return {
      hero: defaults.hero,
      intro: defaults.intro,
      categories: defaults.categories,
      process: defaults.process,
      whyChoose: defaults.whyChoose,
      showContactCta: defaults.showContactCta,
    };
  }

  return {
    hero: overrides.hero ? { ...defaults.hero, ...overrides.hero } : defaults.hero,
    intro: overrides.intro ? { ...defaults.intro, ...overrides.intro } : defaults.intro,
    categories: overrides.categories
      ? {
          ...defaults.categories,
          ...overrides.categories,
          items: overrides.categories.items?.length
            ? overrides.categories.items
            : defaults.categories.items,
        }
      : defaults.categories,
    process: overrides.process
      ? {
          ...defaults.process,
          ...overrides.process,
          items: overrides.process.items?.length ? overrides.process.items : defaults.process.items,
        }
      : defaults.process,
    whyChoose: overrides.whyChoose
      ? {
          ...defaults.whyChoose,
          ...overrides.whyChoose,
          items: overrides.whyChoose.items?.length
            ? overrides.whyChoose.items
            : defaults.whyChoose.items,
        }
      : defaults.whyChoose,
    showContactCta: overrides.showContactCta ?? defaults.showContactCta,
  };
}
