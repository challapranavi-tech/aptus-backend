export {
  OdooClient,
  OdooRpcError,
  isOdooConfigured,
  odooConfigFromEnv,
  ODOO_CACHE_TAG,
} from "./client";

export {
  authenticate,
  searchRead,
  read,
  getVersionInfo,
  type OdooRpcSession,
  type OdooVersionInfo,
} from "./rpc";

export {
  mapOdooPage,
  mapOdooMenuTree,
  buildSiteConfig,
  extractSlugs,
} from "./mapper";

export { parseArch } from "./arch-parser";

export { mapHomepageJson } from "./json-mapper";
export { mapPageJson } from "./page-json-mapper";
