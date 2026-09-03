/** Aptus Adobe product / destination paths used by the /adobe homepage. */
export const ADOBE_ROUTES = {
  business: "/adobe/business",
  creativeCloud: "/adobe/creative-cloud",
  firefly: "/adobe/firefly",
  acrobat: "/adobe/acrobat",
  students: "/adobe/students",
  /** Legacy CMS product pages still used by Features / Product grid */
  illustrator: "/adobe-illustrator",
  photoshop: "/adobe-photoshop",
  premiere: "/adobe-premiere-pro",
} as const;

export type AdobeRoute = (typeof ADOBE_ROUTES)[keyof typeof ADOBE_ROUTES];
