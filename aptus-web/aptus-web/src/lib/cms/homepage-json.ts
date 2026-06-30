import type { HomePageContent } from "@/types/sections";

/** JSON stored in Odoo `x_homepage_sections_json` — section content only (no SEO meta). */
export type OdooHomePageSectionsJson = {
  hero?: HomePageContent["hero"];
  features?: HomePageContent["features"];
  services?: HomePageContent["services"];
  keyEnablers?: HomePageContent["keyEnablers"];
  testimonial?: HomePageContent["testimonial"];
};

export function getHomepageJsonFieldName(): string {
  return process.env.ODOO_CMS_HOMEPAGE_JSON_FIELD?.trim() || "x_homepage_sections_json";
}

/** Strip meta/source for the Odoo JSON field payload. */
export function toOdooHomePageSectionsJson(content: HomePageContent): OdooHomePageSectionsJson {
  return {
    hero: content.hero,
    features: content.features,
    services: content.services,
    keyEnablers: content.keyEnablers,
    testimonial: content.testimonial,
  };
}

export function parseOdooHomePageSectionsJson(
  raw: string | null | undefined,
): OdooHomePageSectionsJson | null {
  if (!raw?.trim()) return null;

  try {
    const parsed = JSON.parse(raw) as OdooHomePageSectionsJson;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function mergeHomePageSections(
  defaults: HomePageContent,
  overrides: OdooHomePageSectionsJson | null,
): Pick<HomePageContent, "hero" | "features" | "services" | "keyEnablers" | "testimonial"> {
  if (!overrides) {
    return {
      hero: defaults.hero,
      features: defaults.features,
      services: defaults.services,
      keyEnablers: defaults.keyEnablers,
      testimonial: defaults.testimonial,
    };
  }

  return {
    hero: overrides.hero ? { ...defaults.hero, ...overrides.hero } : defaults.hero,
    features: overrides.features?.length ? overrides.features : defaults.features,
    services: overrides.services
      ? { ...defaults.services, ...overrides.services }
      : defaults.services,
    keyEnablers: overrides.keyEnablers
      ? { ...defaults.keyEnablers, ...overrides.keyEnablers }
      : defaults.keyEnablers,
    testimonial: overrides.testimonial
      ? { ...defaults.testimonial, ...overrides.testimonial }
      : defaults.testimonial,
  };
}
