import type { ElvPageContent } from "@/types/elv-page";
import { getHomepageJsonFieldName } from "./homepage-json";
import { getCaseStudiesJsonFieldName } from "./case-studies-json";
import { getEtapJsonFieldName } from "./etap-json";
import { getMarketingPageJsonFieldName } from "./marketing-page-json";
import { getSoftwareJsonFieldName } from "./software-json";

/** JSON stored in Odoo `x_elv_sections_json` — section content only (no SEO meta). */
export type OdooElvPageSectionsJson = {
  hero?: ElvPageContent["hero"];
  intro?: ElvPageContent["intro"];
  solutions?: ElvPageContent["solutions"];
  process?: ElvPageContent["process"];
  whyChoose?: ElvPageContent["whyChoose"];
  showContactCta?: boolean;
};

export function getElvJsonFieldName(): string {
  return process.env.ODOO_CMS_ELV_JSON_FIELD?.trim() || "x_elv_sections_json";
}

export function getAllCmsJsonFieldNames(): string[] {
  const fields = new Set<string>();
  fields.add(getHomepageJsonFieldName());
  fields.add(getElvJsonFieldName());
  fields.add(getSoftwareJsonFieldName());
  fields.add(getCaseStudiesJsonFieldName());
  fields.add(getMarketingPageJsonFieldName());
  fields.add(getEtapJsonFieldName());
  return [...fields];
}

export function toOdooElvPageSectionsJson(content: ElvPageContent): OdooElvPageSectionsJson {
  return {
    hero: content.hero,
    intro: content.intro,
    solutions: content.solutions,
    process: content.process,
    whyChoose: content.whyChoose,
    showContactCta: content.showContactCta,
  };
}

export function parseOdooElvPageSectionsJson(
  raw: string | null | undefined,
): OdooElvPageSectionsJson | null {
  if (!raw?.trim()) return null;

  try {
    const parsed = JSON.parse(raw) as OdooElvPageSectionsJson;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function mergeElvPageSections(
  defaults: ElvPageContent,
  overrides: OdooElvPageSectionsJson | null,
): Pick<
  ElvPageContent,
  "hero" | "intro" | "solutions" | "process" | "whyChoose" | "showContactCta"
> {
  if (!overrides) {
    return {
      hero: defaults.hero,
      intro: defaults.intro,
      solutions: defaults.solutions,
      process: defaults.process,
      whyChoose: defaults.whyChoose,
      showContactCta: defaults.showContactCta,
    };
  }

  return {
    hero: overrides.hero ? { ...defaults.hero, ...overrides.hero } : defaults.hero,
    intro: overrides.intro ? { ...defaults.intro, ...overrides.intro } : defaults.intro,
    solutions: overrides.solutions
      ? {
          ...defaults.solutions,
          ...overrides.solutions,
          items: overrides.solutions.items?.length
            ? overrides.solutions.items
            : defaults.solutions.items,
        }
      : defaults.solutions,
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
