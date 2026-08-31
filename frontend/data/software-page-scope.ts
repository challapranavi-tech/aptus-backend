import { isSoftwareInnerSlug, SOFTWARE_FAMILIES } from "@/data/software-product-media";

const SOFTWARE_HUB_SLUGS = new Set([
  "software",
  "software-solutions",
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
    ["infodrainage", "infowater-pro", "infoworks-icm", "infoworks-ws-pro"].forEach((s) => {
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
    INNER_FAMILY_BY_SLUG.ansys = family;
    INNER_FAMILY_BY_SLUG.matlab = family;
    INNER_FAMILY_BY_SLUG.turnitin = family;
    INNER_FAMILY_BY_SLUG["ibm-spss-software"] = family;
  }
}

// ponytail: live WordPress sidebar groups these separately from site-nav Quantity Takeoff
INNER_FAMILY_BY_SLUG["cubicost-bm-qs"] = "cubicost-group";
INNER_FAMILY_BY_SLUG.cype = "cubicost-group";
INNER_FAMILY_BY_SLUG.plainswift = "quantity-takeoff";
INNER_FAMILY_BY_SLUG["rib-costx"] = "quantity-takeoff";
INNER_FAMILY_BY_SLUG["computers-structures"] = "structural";
INNER_FAMILY_BY_SLUG.prokon = "structural";
INNER_FAMILY_BY_SLUG.fortinet = "cyber-security";
INNER_FAMILY_BY_SLUG.sophos = "cyber-security";
INNER_FAMILY_BY_SLUG.kaspersky = "cyber-security";
INNER_FAMILY_BY_SLUG["palo-alto"] = "cyber-security";
INNER_FAMILY_BY_SLUG["sonicwall-next-gen-firewall"] = "cyber-security";
INNER_FAMILY_BY_SLUG["antivirus-and-data-security"] = "cyber-security";
INNER_FAMILY_BY_SLUG.infodrainage = "water-infrastructure";
INNER_FAMILY_BY_SLUG["infowater-pro"] = "water-infrastructure";
INNER_FAMILY_BY_SLUG["infoworks-icm"] = "water-infrastructure";
INNER_FAMILY_BY_SLUG["infoworks-ws-pro"] = "water-infrastructure";

const STACKED_INNER_SLUGS = new Set<string>([
  // ponytail: empty — all software inners use AutoCAD-style SectionRenderer layout
]);

export function usesStackedSoftwareLayout(slug: string): boolean {
  return STACKED_INNER_SLUGS.has(slug);
}

export function getSoftwarePageScope(slug: string): SoftwarePageScope | null {
  if (SOFTWARE_HUB_SLUGS.has(slug)) {
    const family = slug === "multimedia-software-solutions" ? "multimedia" : slug === "software" || slug === "software-solutions" ? "software-solutions" : slug;
    return {
      isHub: true,
      isInner: false,
      family,
      wrapperClass: `aptus-software-page aptus-software-page--${family}-hub`,
    };
  }

  if (slug === "cyber-security-solution") {
    return {
      isHub: true,
      isInner: false,
      family: "cyber-security",
      wrapperClass: "aptus-software-page aptus-software-page--cyber-security-solution",
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
