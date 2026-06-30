import type { CmsPageContent } from "@/types/cms";
import type { CaseStudiesPageContent } from "@/types/case-studies-page";
import { DEFAULT_CASE_STUDIES_PAGE_CONTENT } from "./case-studies-content";
import {
  mergeCaseStudiesPageSections,
  parseOdooCaseStudiesPageSectionsJson,
} from "./case-studies-json";

/** Maps Odoo CMS records into typed Case Studies page section props. */
export function mapOdooToCaseStudiesPageContent(
  page: CmsPageContent | null,
): CaseStudiesPageContent {
  if (!page) {
    return DEFAULT_CASE_STUDIES_PAGE_CONTENT;
  }

  const overrides = parseOdooCaseStudiesPageSectionsJson(page.sectionsJson);
  const sections = mergeCaseStudiesPageSections(DEFAULT_CASE_STUDIES_PAGE_CONTENT, overrides);

  return {
    ...sections,
    metaTitle: page.metaTitle ?? DEFAULT_CASE_STUDIES_PAGE_CONTENT.metaTitle,
    metaDescription:
      page.metaDescription ?? DEFAULT_CASE_STUDIES_PAGE_CONTENT.metaDescription,
    source: "odoo",
  };
}

export function mapStaticCaseStudiesPageContent(): CaseStudiesPageContent {
  return DEFAULT_CASE_STUDIES_PAGE_CONTENT;
}
