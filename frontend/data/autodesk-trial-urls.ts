/** Official Autodesk product free-trial signup pages. */
const AUTODESK_TRIAL_BY_SLUG: Record<string, string> = {
  autocad: "https://www.autodesk.com/products/autocad/free-trial",
  "civil-3d": "https://www.autodesk.com/products/civil-3d/free-trial",
  "aec-collection":
    "https://www.autodesk.com/collections/architecture-engineering-construction/overview?us_oa=dotcom-us&us_si=c4052074-6edc-4819-aaf5-fa055d8161f9&us_st=Architecture%20Engineering%20%26%20Construction%20Collection&us_pt=Architecture%2C%20Engineering%20%26%20Construction%20Collection",
  "autocad-lt": "https://www.autodesk.com/products/autocad-lt/free-trial",
  "autocad-revit-lt-suite": "https://www.autodesk.com/products/revit-lt/trial-intake",
  "3ds-max": "https://www.autodesk.com/products/3ds-max/free-trial",
  navisworks:
    "https://www.autodesk.com/products/navisworks/free-trial?us_oa=dotcom-us&us_si=c18cba4f-82f0-4e34-8450-e4330cf75549&us_st=Navisworks%20free%20trial",
  "navisworks-manage":
    "https://www.autodesk.com/products/navisworks/free-trial?us_oa=dotcom-us&us_si=c18cba4f-82f0-4e34-8450-e4330cf75549&us_st=Navisworks%20free%20trial",
  revit: "https://www.autodesk.com/products/revit/free-trial",
  "bim-collaborate-pro": "https://www.autodesk.com/products/bim-collaborate/free-trial",
  "autodesk-docs": "https://construction.autodesk.com/trial/autodesk-docs/",
  "autodesk-build": "https://construction.autodesk.com/trial/autodesk-build/",
  "autodesk-takeoff": "https://construction.autodesk.com/trial/autodesk-takeoff/",
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
