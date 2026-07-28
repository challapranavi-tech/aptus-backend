export {
  OdooClient,
  OdooRpcError,
  isOdooConfigured,
  odooConfigFromEnv,
  getOdooServiceSession,
  invalidateOdooServiceSession,
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
  normalizeOdooBaseUrl,
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
  createCrmLead,
  buildCrmLeadValues,
  type CrmLeadInput,
} from "./crm";

export {
  mapOdooPage,
  mapOdooMenuTree,
  buildSiteConfig,
  extractSlugs,
} from "./mapper";

export { parseArch } from "./arch-parser";

export { mapHomepageJson } from "./json-mapper";
export { mapPageJson } from "./page-json-mapper";
