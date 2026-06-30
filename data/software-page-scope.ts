import { isSoftwareInnerSlug, SOFTWARE_FAMILIES } from "@/data/software-product-media";

const SOFTWARE_HUB_SLUGS = new Set([
  "software",
  "autodesk",
  "adobe",
  "microsoft",
  "multimedia-software-solutions",
]);

export type SoftwarePageScope = {
  isHub: boolean;
  isInner: boolean;
  family?: string;
  wrapperClass: string;
};

const INNER_FAMILY_BY_SLUG: Record<string, string> = {};
for (const family of SOFTWARE_FAMILIES) {
  // ponytail: slug prefix heuristic until manifest is imported at build time
  if (family === "adobe") {
    ["adobe-business-creative-solutions", "adobe-acrobat-pro", "adobe-illustrator", "adobe-photoshop", "adobe-premiere-pro"].forEach(
      (s) => {
        INNER_FAMILY_BY_SLUG[s] = family;
      },
    );
  }
  if (family === "microsoft") {
    ["microsoft-365-apps", "microsoft-365-business", "microsoft-visio", "power-bi"].forEach((s) => {
      INNER_FAMILY_BY_SLUG[s] = family;
    });
  }
  if (family === "multimedia") {
    ["bluebeam", "chaos-corona", "enscape", "luminon", "nitro", "sketchup", "twinmotion", "v-ray"].forEach((s) => {
      INNER_FAMILY_BY_SLUG[s] = family;
    });
  }
  if (family === "autodesk") {
    [
      "autocad",
      "3ds-max",
      "revit",
      "civil-3d",
      "aec-collection",
      "autocad-lt",
      "bim-collaborate-pro",
      "autodesk-docs",
      "autodesk-build",
      "autodesk-takeoff",
      "navisworks",
    ].forEach((s) => {
      INNER_FAMILY_BY_SLUG[s] = family;
    });
  }
  if (family === "oracle") {
    ["oracle-primavera-p6", "aconex"].forEach((s) => {
      INNER_FAMILY_BY_SLUG[s] = family;
    });
  }
  if (family === "edms") {
    ["construction-cloud", "odoo", "spectronova"].forEach((s) => {
      INNER_FAMILY_BY_SLUG[s] = family;
    });
  }
  if (family === "educational") {
    INNER_FAMILY_BY_SLUG.etap = family;
  }
}

export function getSoftwarePageScope(slug: string): SoftwarePageScope | null {
  if (SOFTWARE_HUB_SLUGS.has(slug)) {
    const family = slug === "multimedia-software-solutions" ? "multimedia" : slug === "software" ? "software" : slug;
    return {
      isHub: true,
      isInner: false,
      family,
      wrapperClass: `aptus-software-page aptus-software-page--${family}-hub`,
    };
  }

  if (isSoftwareInnerSlug(slug) || slug in INNER_FAMILY_BY_SLUG) {
    const family = INNER_FAMILY_BY_SLUG[slug] ?? "software";
    return {
      isHub: false,
      isInner: true,
      family,
      wrapperClass: `aptus-software-page aptus-software-page--${family} aptus-software-page--${slug}`,
    };
  }

  return null;
}
