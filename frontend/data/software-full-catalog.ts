import { AUTODESK_SUBNAV_LINKS } from "@/data/autodesk-subnav";
import { findNavItemByLabel, SITE_NAVIGATION } from "@/data/site-nav";
import {
  ADOBE_SUBNAV_LINKS,
  CYBER_SECURITY_SUBNAV_LINKS,
  EDMS_SUBNAV_LINKS,
  EDUCATIONAL_SUBNAV_LINKS,
  MICROSOFT_SUBNAV_LINKS,
  MULTIMEDIA_SUBNAV_LINKS,
  ORACLE_SUBNAV_LINKS,
  QUANTITY_TAKEOFF_SUBNAV_LINKS,
  STRUCTURAL_SUBNAV_LINKS,
  WATER_INFRASTRUCTURE_SUBNAV_LINKS,
  type SoftwareSubNavLink,
} from "@/data/software-subnav";
import type {
  SoftwarePurchaseCategory,
  SoftwarePurchaseProduct,
} from "@/data/software-purchase-catalog";
import {
  createCatalogProduct,
  productSlugFromHref,
} from "@/data/software-purchase-catalog";

/** Slugs for the 8 portal products that support add-to-cart and full purchase options. */
export const PORTAL_PURCHASABLE_SLUGS = new Set([
  "autocad",
  "civil-3d",
  "aec-collection",
  "autocad-lt",
  "autocad-revit-lt-suite",
  "3ds-max",
  "navisworks",
  "revit",
]);

export function isPortalPurchasableProduct(hrefOrSlug: string): boolean {
  const slug = hrefOrSlug.startsWith("/")
    ? productSlugFromHref(hrefOrSlug)
    : hrefOrSlug.trim().toLowerCase();
  return PORTAL_PURCHASABLE_SLUGS.has(slug);
}

function slugify(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function linksToProducts(links: SoftwareSubNavLink[]): SoftwarePurchaseProduct[] {
  const seen = new Set<string>();
  const products: SoftwarePurchaseProduct[] = [];
  for (const link of links) {
    const key = link.href.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    products.push(createCatalogProduct(link.label, link.href));
  }
  return products;
}

/** Brand label → product pages under that brand. */
const BRAND_PRODUCT_LINKS: Record<string, SoftwareSubNavLink[]> = {
  Autodesk: [
    ...AUTODESK_SUBNAV_LINKS,
    { label: "AutoCAD Revit LT Suite", href: "/autocad-revit-lt-suite" },
    ...WATER_INFRASTRUCTURE_SUBNAV_LINKS,
  ],
  Adobe: ADOBE_SUBNAV_LINKS,
  Microsoft: MICROSOFT_SUBNAV_LINKS,
  Oracle: ORACLE_SUBNAV_LINKS,
  CostX: QUANTITY_TAKEOFF_SUBNAV_LINKS.filter((l) => l.href === "/rib-costx"),
  Cubicost: QUANTITY_TAKEOFF_SUBNAV_LINKS.filter((l) => l.href === "/cubicost-bm-qs"),
  Planswift: QUANTITY_TAKEOFF_SUBNAV_LINKS.filter((l) => l.href === "/plainswift"),
  SpectroNova: EDMS_SUBNAV_LINKS.filter((l) => l.href === "/spectronova"),
  CSI: STRUCTURAL_SUBNAV_LINKS.filter((l) => l.href === "/computers-structures"),
  Turnitin: EDUCATIONAL_SUBNAV_LINKS.filter((l) => l.href === "/turnitin"),
  Mathwork: EDUCATIONAL_SUBNAV_LINKS.filter((l) => l.href === "/matlab"),
  Nitro: MULTIMEDIA_SUBNAV_LINKS.filter((l) => l.href === "/nitro"),
  Fortinet: CYBER_SECURITY_SUBNAV_LINKS.filter((l) => l.href === "/fortinet"),
  Sophos: CYBER_SECURITY_SUBNAV_LINKS.filter((l) => l.href === "/sophos"),
  Kaspersky: CYBER_SECURITY_SUBNAV_LINKS.filter((l) => l.href === "/kaspersky"),
  Symantec: CYBER_SECURITY_SUBNAV_LINKS.filter((l) => l.href === "/antivirus-and-data-security"),
  Etap: [{ label: "Etap", href: "/etap" }],
  Prokon: STRUCTURAL_SUBNAV_LINKS.filter((l) => l.href === "/prokon"),
  Lumion: MULTIMEDIA_SUBNAV_LINKS.filter((l) => l.href === "/luminon"),
  "V-Ray": MULTIMEDIA_SUBNAV_LINKS.filter((l) => l.href === "/v-ray"),
  Sketchup: MULTIMEDIA_SUBNAV_LINKS.filter((l) => l.href === "/sketchup"),
  Bluebeam: MULTIMEDIA_SUBNAV_LINKS.filter((l) => l.href === "/bluebeam"),
  Twinmotion: MULTIMEDIA_SUBNAV_LINKS.filter((l) => l.href === "/twinmotion"),
  Corona: MULTIMEDIA_SUBNAV_LINKS.filter((l) => l.href === "/chaos-corona"),
  SPSS: EDUCATIONAL_SUBNAV_LINKS.filter((l) => l.href === "/ibm-spss-software"),
};

const BRAND_HINTS: Record<string, string> = {
  Autodesk: "Design, BIM, and construction tools",
  Adobe: "Creative and document tools",
  Microsoft: "Productivity and business apps",
  Oracle: "Project controls and collaboration",
  CostX: "Construction estimating and takeoff",
  Cubicost: "BIM-based quantity surveying",
  Planswift: "Digital takeoff and estimating",
  SpectroNova: "Document and data management",
  CSI: "Structural analysis software",
  Bentley: "Infrastructure engineering software",
  Turnitin: "Academic integrity solutions",
  Mathwork: "Technical computing and MATLAB",
  Nitro: "PDF productivity tools",
  Fortinet: "Network security",
  Sophos: "Endpoint protection",
  Kaspersky: "Cybersecurity solutions",
  Symantec: "Antivirus and data security",
  "Palo Alto": "Next-generation firewalls",
  RedHAT: "Enterprise Linux platforms",
  Etap: "Electrical power system analysis",
  Prokon: "Structural design software",
  Lumion: "Architectural visualization",
  "V-Ray": "Photorealistic rendering",
  Sketchup: "3D modeling and design",
  Bluebeam: "PDF-based collaboration for construction",
  Twinmotion: "Real-time architectural visualization",
  Solidworks: "3D CAD and product design",
  SPSS: "Statistical analysis software",
  Corona: "Rendering for architecture and design",
  "D5 Render": "Real-time ray tracing visualization",
  Quorum: "Meeting and governance software",
};

/**
 * Full software catalog — one category per brand in the Software nav menu.
 * Used by the unified /software-solutions product listing.
 */
export function buildSoftwareFullCatalog(): SoftwarePurchaseCategory[] {
  const software = findNavItemByLabel(SITE_NAVIGATION, "Software");
  if (!software?.children?.length) return [];

  return software.children.map((brand) => {
    const links = BRAND_PRODUCT_LINKS[brand.label];
    const products = links?.length
      ? linksToProducts(links)
      : brand.href && brand.href !== "#"
        ? [createCatalogProduct(brand.label, brand.href)]
        : [];

    return {
      id: slugify(brand.label),
      label: brand.label,
      hint: BRAND_HINTS[brand.label] ?? "Software licenses and subscriptions",
      href: brand.href,
      products,
    };
  });
}

export const SOFTWARE_FULL_CATALOG = buildSoftwareFullCatalog();

export function productDetailHref(product: SoftwarePurchaseProduct): string {
  if (isPortalPurchasableProduct(product.href)) {
    return `/portal/products/${productSlugFromHref(product.href)}`;
  }
  return product.href;
}
