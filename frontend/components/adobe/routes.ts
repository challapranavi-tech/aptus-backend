/** Aptus Adobe product page paths used by the /adobe homepage. */
export const ADOBE_ROUTES = {
  business: "/adobe-business-creative-solutions",
  acrobat: "/adobe-acrobat-pro",
  illustrator: "/adobe-illustrator",
  photoshop: "/adobe-photoshop",
  premiere: "/adobe-premiere-pro",
} as const;

export type AdobeRoute = (typeof ADOBE_ROUTES)[keyof typeof ADOBE_ROUTES];
