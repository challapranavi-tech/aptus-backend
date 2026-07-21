/**
 * data/index.ts — public API for all data fetching.
 *
 * Always import from here, never from data/cms.ts or data/mock-cms.ts directly.
 * The smart layer in data/cms.ts handles Odoo vs mock resolution transparently.
 */
export {
  getSiteConfig,
  getHomePage,
  getPageBySlug,
  getAllPageSlugs,
  getAllPages,
  getCaseStudiesPageContent,
  invalidateOdooClientSession,
} from "./cms";
