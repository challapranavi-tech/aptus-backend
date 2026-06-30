import type { CmsPageContent } from "@/types/cms";
import type { ElvPageContent } from "@/types/elv-page";
import { DEFAULT_ELV_PAGE_CONTENT } from "./elv-content";
import { mergeElvPageSections, parseOdooElvPageSectionsJson } from "./elv-json";

/** Maps Odoo CMS records into typed ELV page section props. */
export function mapOdooToElvPageContent(page: CmsPageContent | null): ElvPageContent {
  if (!page) {
    return DEFAULT_ELV_PAGE_CONTENT;
  }

  const overrides = parseOdooElvPageSectionsJson(page.sectionsJson);
  const sections = mergeElvPageSections(DEFAULT_ELV_PAGE_CONTENT, overrides);

  return {
    ...sections,
    metaTitle: page.metaTitle ?? DEFAULT_ELV_PAGE_CONTENT.metaTitle,
    metaDescription: page.metaDescription ?? DEFAULT_ELV_PAGE_CONTENT.metaDescription,
    source: "odoo",
  };
}

export function mapStaticElvPageContent(): ElvPageContent {
  return DEFAULT_ELV_PAGE_CONTENT;
}
