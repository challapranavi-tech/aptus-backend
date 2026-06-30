import type { CmsPageContent } from "@/types/cms";
import type { EtapPageContent } from "@/types/etap-page";
import { DEFAULT_ETAP_PAGE_CONTENT } from "./etap-content";
import { mergeEtapPageSections, parseOdooEtapPageSectionsJson } from "./etap-json";

export function mapOdooToEtapPageContent(page: CmsPageContent | null): EtapPageContent {
  if (!page) {
    return DEFAULT_ETAP_PAGE_CONTENT;
  }

  const overrides = parseOdooEtapPageSectionsJson(page.sectionsJson);
  const sections = mergeEtapPageSections(DEFAULT_ETAP_PAGE_CONTENT, overrides);

  return {
    ...sections,
    metaTitle: page.metaTitle ?? DEFAULT_ETAP_PAGE_CONTENT.metaTitle,
    metaDescription: page.metaDescription ?? DEFAULT_ETAP_PAGE_CONTENT.metaDescription,
    source: "odoo",
  };
}
