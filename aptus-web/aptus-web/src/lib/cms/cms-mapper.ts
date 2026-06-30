import type { CmsPageContent } from "@/types/cms";
import type { HomePageContent } from "@/types/sections";
import { DEFAULT_HOMEPAGE_CONTENT } from "./homepage-content";
import {
  mergeHomePageSections,
  parseOdooHomePageSectionsJson,
} from "./homepage-json";

/**
 * Maps Odoo CMS records into typed homepage section props.
 * Section content comes from `x_homepage_sections_json` when populated.
 */
export function mapOdooToHomePageContent(page: CmsPageContent | null): HomePageContent {
  if (!page) {
    return DEFAULT_HOMEPAGE_CONTENT;
  }

  const overrides = parseOdooHomePageSectionsJson(page.sectionsJson);
  const sections = mergeHomePageSections(DEFAULT_HOMEPAGE_CONTENT, overrides);

  return {
    ...sections,
    metaTitle: page.metaTitle ?? DEFAULT_HOMEPAGE_CONTENT.metaTitle,
    metaDescription: page.metaDescription ?? DEFAULT_HOMEPAGE_CONTENT.metaDescription,
    source: "odoo",
  };
}

/** Static fallback when Odoo is unavailable. */
export function mapStaticHomePageContent(): HomePageContent {
  return DEFAULT_HOMEPAGE_CONTENT;
}
