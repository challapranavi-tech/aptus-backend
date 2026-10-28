import { SOFTWARE_FULL_CATALOG } from "@/data/software-full-catalog";
import {
  SOFTWARE_BRAND_LOGO_ITEMS as CATALOG_BRAND_LOGO_ITEMS,
  softwareBrandLogoSrc,
  type SoftwareBrandLogoItem,
} from "@/data/software-brand-logos";

export type SoftwareSolutionCategory = {
  id: string;
  label: string;
  brandIds: string[];
};

/**
 * Brochure solution groups for /software-solutions/brands.
 * Brand ids match catalog brands where they exist; new brochure brands use the same slug style.
 */
export const SOFTWARE_SOLUTION_CATEGORIES: SoftwareSolutionCategory[] = [
  {
    id: "engineering-construction",
    label: "Engineering & Construction",
    brandIds: [
      "autodesk",
      "costx",
      "cype",
      "prokon",
      "sap2000",
      "etabs",
      "safe",
      "planswift",
      "csi",
    ],
  },
  {
    id: "bim",
    label: "BIM & Project Management",
    brandIds: [
      "autodesk",
      "spectronova",
      "oracle",
      "earthcam",
      "cype",
      "prokon",
      "planswift",
    ],
  },
  {
    id: "project-management",
    label: "Project Management",
    brandIds: ["oracle", "spectronova", "microsoft", "earthcam"],
  },
  {
    id: "cyber-security",
    label: "Cyber Security",
    brandIds: [
      "bitdefender",
      "kaspersky",
      "symantec",
      "trend-micro",
      "sophos",
      "fortinet",
      "acronis",
      "sonicwall",
    ],
  },
  {
    id: "data-scada",
    label: "Data Monitoring, SCADA & Automation",
    brandIds: ["pulseway", "citrix", "mitsubishi-electric", "tor-ai"],
  },
  {
    id: "education",
    label: "Education",
    brandIds: [
      "adobe",
      "ansys",
      "spss",
      "mathwork",
      "iflytek",
      "solidworks",
      "telenet",
      "turnitin",
    ],
  },
  {
    id: "electrical",
    label: "Electrical Software",
    brandIds: ["etap"],
  },
];

/** Brochure brands not yet in SOFTWARE_FULL_CATALOG — logos/products can be linked later. */
export const BROCHURE_EXTRA_BRANDS: SoftwareBrandLogoItem[] = [
  { id: "cype", label: "CYPE", logoSrc: softwareBrandLogoSrc("cype") },
  { id: "sap2000", label: "SAP2000", logoSrc: softwareBrandLogoSrc("sap2000") },
  { id: "etabs", label: "ETABS", logoSrc: softwareBrandLogoSrc("etabs") },
  { id: "safe", label: "SAFE", logoSrc: softwareBrandLogoSrc("safe") },
  { id: "bitdefender", label: "Bitdefender", logoSrc: softwareBrandLogoSrc("bitdefender") },
  { id: "trend-micro", label: "Trend Micro", logoSrc: softwareBrandLogoSrc("trend-micro") },
  { id: "acronis", label: "Acronis", logoSrc: softwareBrandLogoSrc("acronis") },
  { id: "sonicwall", label: "SonicWall", logoSrc: softwareBrandLogoSrc("sonicwall") },
  { id: "pulseway", label: "Pulseway", logoSrc: softwareBrandLogoSrc("pulseway") },
  { id: "citrix", label: "Citrix", logoSrc: softwareBrandLogoSrc("citrix") },
  {
    id: "mitsubishi-electric",
    label: "Mitsubishi Electric",
    logoSrc: softwareBrandLogoSrc("mitsubishi-electric"),
  },
  { id: "tor-ai", label: "tor.ai", logoSrc: softwareBrandLogoSrc("tor-ai") },
  { id: "ansys", label: "Ansys", logoSrc: softwareBrandLogoSrc("ansys") },
  { id: "iflytek", label: "iFLYTEK", logoSrc: softwareBrandLogoSrc("iflytek") },
  { id: "telenet", label: "Telenet", logoSrc: softwareBrandLogoSrc("telenet") },
  { id: "earthcam", label: "EarthCam", logoSrc: softwareBrandLogoSrc("earthcam") },
];

const CATEGORIZED_BRAND_IDS = new Set(
  SOFTWARE_SOLUTION_CATEGORIES.flatMap((category) => category.brandIds),
);

function mergeBrandLists(): SoftwareBrandLogoItem[] {
  const byId = new Map<string, SoftwareBrandLogoItem>();
  for (const brand of CATALOG_BRAND_LOGO_ITEMS) {
    byId.set(brand.id, brand);
  }
  for (const brand of BROCHURE_EXTRA_BRANDS) {
    if (!byId.has(brand.id)) byId.set(brand.id, brand);
  }
  return [...byId.values()];
}

/** Full brand list for the brands explorer (catalog + brochure extras). */
export const SOFTWARE_BRANDS_EXPLORER_ITEMS: SoftwareBrandLogoItem[] = mergeBrandLists();

const OTHER_BRAND_IDS = SOFTWARE_BRANDS_EXPLORER_ITEMS.filter(
  (brand) => !CATEGORIZED_BRAND_IDS.has(brand.id),
).map((brand) => brand.id);

export const SOFTWARE_SOLUTION_FILTERS: SoftwareSolutionCategory[] = [
  ...SOFTWARE_SOLUTION_CATEGORIES,
  {
    id: "other",
    label: "Other",
    brandIds: OTHER_BRAND_IDS,
  },
];

export function brandsForSolutionFilter(
  filterId: string | null,
  brands: SoftwareBrandLogoItem[] = SOFTWARE_BRANDS_EXPLORER_ITEMS,
): SoftwareBrandLogoItem[] {
  if (!filterId) return brands;
  const category = SOFTWARE_SOLUTION_FILTERS.find((item) => item.id === filterId);
  if (!category) return brands;
  const allowed = new Set(category.brandIds);
  return brands.filter((brand) => allowed.has(brand.id));
}

/** Keep catalog export in sync for typings (catalog brand count). */
export const SOFTWARE_CATALOG_BRAND_COUNT = SOFTWARE_FULL_CATALOG.length;
