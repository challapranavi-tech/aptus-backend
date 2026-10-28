/**
 * data/index.ts — public API for all CMS data fetching (via backend HTTP API).
 */
export {
  getSiteConfig,
  getHomePage,
  getPageBySlug,
  getAllPageSlugs,
  getAllPages,
  loadCaseStudiesPageContent,
} from "./cms";
