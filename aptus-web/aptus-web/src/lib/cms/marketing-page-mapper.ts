import type { CmsPageContent } from "@/types/cms";
import type { MarketingPageContent } from "@/types/marketing-page";
import { mergeMarketingPageSections, parseOdooMarketingPageSectionsJson } from "./marketing-page-json";

export function mapOdooToMarketingPageContent(
  page: CmsPageContent | null,
  defaults: MarketingPageContent,
): MarketingPageContent {
  if (!page) return defaults;

  const overrides = parseOdooMarketingPageSectionsJson(page.sectionsJson);
  const sections = mergeMarketingPageSections(defaults, overrides);

  return {
    ...sections,
    metaTitle: page.metaTitle ?? defaults.metaTitle,
    metaDescription: page.metaDescription ?? defaults.metaDescription,
    source: "odoo",
  };
}
