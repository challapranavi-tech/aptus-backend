export {
  OdooClient,
  OdooRpcError,
  isOdooConfigured,
  odooConfigFromEnv,
  ODOO_CACHE_TAG,
  invalidatePageFieldCache,
  cmsPageFieldAvailable,
} from "./client";

export {
  authenticate,
  searchRead,
  read,
  create,
  getVersionInfo,
  type OdooRpcSession,
  type OdooVersionInfo,
} from "./rpc";

export {
  createApplicant,
  buildApplicantValues,
  applicantStageIdFromEnv,
  parseSalaryExpected,
  type ApplicantInput,
  type ApplicantAttachment,
} from "./recruitment";

export {
  mapOdooPage,
  mapOdooMenuTree,
  buildSiteConfig,
  extractSlugs,
} from "./mapper";

export { parseArch } from "./arch-parser";

export { mapHomepageJson } from "./json-mapper";
export { mapPageJson } from "./page-json-mapper";
