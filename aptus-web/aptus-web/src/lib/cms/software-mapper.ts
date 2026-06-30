import type { CmsPageContent } from "@/types/cms";
import type { SoftwarePageContent } from "@/types/software-page";
import { DEFAULT_SOFTWARE_PAGE_CONTENT } from "./software-content";
import { mergeSoftwarePageSections, parseOdooSoftwarePageSectionsJson } from "./software-json";

/** Maps Odoo CMS records into typed Software page section props. */
export function mapOdooToSoftwarePageContent(page: CmsPageContent | null): SoftwarePageContent {
  if (!page) {
    return DEFAULT_SOFTWARE_PAGE_CONTENT;
  }

  const overrides = parseOdooSoftwarePageSectionsJson(page.sectionsJson);
  const sections = mergeSoftwarePageSections(DEFAULT_SOFTWARE_PAGE_CONTENT, overrides);

  return {
    ...sections,
    metaTitle: page.metaTitle ?? DEFAULT_SOFTWARE_PAGE_CONTENT.metaTitle,
    metaDescription: page.metaDescription ?? DEFAULT_SOFTWARE_PAGE_CONTENT.metaDescription,
    source: "odoo",
  };
}

export function mapStaticSoftwarePageContent(): SoftwarePageContent {
  return DEFAULT_SOFTWARE_PAGE_CONTENT;
}
