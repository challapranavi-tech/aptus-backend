/** Official Autodesk product free-trial signup pages. */
const AUTODESK_TRIAL_BY_SLUG: Record<string, string> = {
  autocad: "https://www.autodesk.com/products/autocad/free-trial",
  "civil-3d": "https://www.autodesk.com/products/civil-3d/free-trial",
  "aec-collection": "https://www.autodesk.com/products/aec-collection/free-trial",
  "autocad-lt": "https://www.autodesk.com/products/autocad-lt/free-trial",
  "autocad-revit-lt-suite": "https://www.autodesk.com/products/autocad-revit-lt-suite/free-trial",
  "3ds-max": "https://www.autodesk.com/products/3ds-max/free-trial",
  navisworks: "https://www.autodesk.com/products/navisworks-manage/free-trial",
  "navisworks-manage": "https://www.autodesk.com/products/navisworks-manage/free-trial",
  revit: "https://www.autodesk.com/products/revit/free-trial",
  "bim-collaborate-pro": "https://www.autodesk.com/products/bim-collaborate-pro/free-trial",
  "autodesk-docs": "https://www.autodesk.com/products/autodesk-docs/free-trial",
  "autodesk-build": "https://www.autodesk.com/products/autodesk-build/free-trial",
  "autodesk-takeoff": "https://www.autodesk.com/products/autodesk-takeoff/free-trial",
  infodrainage: "https://www.autodesk.com/products/infodrainage/free-trial",
  "infowater-pro": "https://www.autodesk.com/products/infowater-pro/free-trial",
  "infoworks-icm": "https://www.autodesk.com/products/infoworks-icm/free-trial",
  "infoworks-ws-pro": "https://www.autodesk.com/products/infoworks-ws-pro/free-trial",
};

export const AUTODESK_FREE_TRIALS_HUB = "https://www.autodesk.com/free-trials";

export function productSlugFromHrefOrPath(hrefOrPath: string): string {
  return hrefOrPath.replace(/^\//, "").split("/").filter(Boolean).pop() ?? "";
}

/** Resolve the Autodesk trial signup URL for a product href or page path. */
export function getAutodeskTrialUrl(hrefOrPath: string): string | undefined {
  const slug = productSlugFromHrefOrPath(hrefOrPath);
  if (!slug) return undefined;
  return AUTODESK_TRIAL_BY_SLUG[slug];
}
