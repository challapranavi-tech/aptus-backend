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
  write,
  executeKw,
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
  attachFilesToCrmLead,
  crmLeadFormUrl,
  crmTeamConfig,
  nextRequestQuoteRef,
  ensureRequestQuoteSequence,
  quoteReferenceField,
  REQUEST_QUOTE_SEQUENCE,
  type CrmLeadInput,
  type CrmLeadAttachment,
  type ContactCategory,
} from "./crm";

export {
  registerWebsiteEnquiry,
  nextWebsiteEnquiryRef,
  upsertPartnerEnquiry,
  buildPartnerEnquiryValues,
  backfillWebsiteEnquiryFields,
  enquiryReferenceField,
  enquirySourceField,
  enquirySourceValue,
  enquiryCategoryIdFromEnv,
  resolveWebsiteEnquiryCategoryId,
  resolvePartnerEnquiryFields,
  resolveWebsiteEnquirySourcePartnerId,
  WEBSITE_ENQUIRY_SEQUENCE,
  WEBSITE_ENQUIRY_CATEGORY_NAME,
  WEBSITE_ENQUIRY_SOURCE_PARTNER_NAME,
  type PartnerEnquiryResult,
  type PartnerEnquiryFieldMap,
  type BackfillWebsiteEnquiryResult,
} from "./enquiry";

export {
  mapOdooPage,
  mapOdooMenuTree,
  buildSiteConfig,
  extractSlugs,
} from "./mapper";

export { parseArch } from "./arch-parser";

export { mapHomepageJson } from "./json-mapper";
export { mapPageJson } from "./page-json-mapper";