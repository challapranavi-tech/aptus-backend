import { SITE_NAVIGATION } from "@/data/site-nav";
import { softwareHeroImage } from "@/data/software-product-media";
import type { NavigationItem } from "@/types";

export type SoftwarePurchaseProduct = {
  name: string;
  href: string;
  /** Vendor / master-list part number shown as Product No. on cards. */
  partNumber?: string;
  /** Estimated OMR unit price when known; omit for quote-on-request. */
  price1Year?: number;
  price3Year?: number;
};

export type SoftwarePurchaseCategory = {
  id: string;
  label: string;
  hint: string;
  href?: string;
  products: SoftwarePurchaseProduct[];
};

/** Optional guide prices for known SKUs (keyed by normalized product label). */
const GUIDE_PRICES: Record<string, { price1Year: number; price3Year: number }> = {
  "adobe photoshop": { price1Year: 95, price3Year: 240 },
  photoshop: { price1Year: 95, price3Year: 240 },
  "adobe illustrator": { price1Year: 90, price3Year: 225 },
  illustrator: { price1Year: 90, price3Year: 225 },
  "adobe acrobat pro": { price1Year: 75, price3Year: 190 },
  "acrobat pro": { price1Year: 75, price3Year: 190 },
  "adobe premiere pro": { price1Year: 100, price3Year: 255 },
  "adobe business & creative solutions": { price1Year: 180, price3Year: 450 },
  "creative cloud": { price1Year: 180, price3Year: 450 },
  "microsoft 365 apps": { price1Year: 110, price3Year: 280 },
  "microsoft 365 business": { price1Year: 130, price3Year: 330 },
  "microsoft 365": { price1Year: 110, price3Year: 280 },
  "microsoft visio": { price1Year: 85, price3Year: 215 },
  visio: { price1Year: 85, price3Year: 215 },
  "power bi": { price1Year: 95, price3Year: 240 },
  autocad: { price1Year: 420, price3Year: 1050 },
  "autocad lt": { price1Year: 280, price3Year: 700 },
  revit: { price1Year: 480, price3Year: 1200 },
  "civil 3d": { price1Year: 460, price3Year: 1150 },
  "3ds max": { price1Year: 390, price3Year: 980 },
  "aec collection": { price1Year: 620, price3Year: 1550 },
  navisworks: { price1Year: 410, price3Year: 1025 },
  "bim collaborate pro": { price1Year: 240, price3Year: 600 },
  "autodesk docs": { price1Year: 180, price3Year: 450 },
  "autodesk build": { price1Year: 220, price3Year: 550 },
  "autodesk takeoff": { price1Year: 210, price3Year: 525 },
  // Water Infrastructure — demo OMR guides (sheet lists USD; portal stays OMR)
  infodrainage: { price1Year: 520, price3Year: 1300 },
  "infowater pro": { price1Year: 680, price3Year: 1700 },
  "infoworks icm": { price1Year: 640, price3Year: 1600 },
  "infoworks ws pro": { price1Year: 680, price3Year: 1700 },
  etap: { price1Year: 890, price3Year: 2225 },
  "oracle primavera p6": { price1Year: 750, price3Year: 1875 },
  aconex: { price1Year: 620, price3Year: 1550 },
  bluebeam: { price1Year: 140, price3Year: 350 },
  "chaos corona": { price1Year: 260, price3Year: 650 },
  enscape: { price1Year: 310, price3Year: 775 },
  luminon: { price1Year: 340, price3Year: 850 },
  "nitro pdf": { price1Year: 55, price3Year: 140 },
  sketchup: { price1Year: 120, price3Year: 300 },
  twinmotion: { price1Year: 280, price3Year: 700 },
  "v-ray": { price1Year: 290, price3Year: 725 },
  "cubicost bm qs": { price1Year: 380, price3Year: 950 },
  planswift: { price1Year: 320, price3Year: 800 },
  "rib costx": { price1Year: 410, price3Year: 1025 },
  "computers & structures, inc": { price1Year: 560, price3Year: 1400 },
  prokon: { price1Year: 480, price3Year: 1200 },
  ansys: { price1Year: 720, price3Year: 1800 },
  "ibm spss software": { price1Year: 390, price3Year: 975 },
  matlab: { price1Year: 450, price3Year: 1125 },
  turnitin: { price1Year: 95, price3Year: 240 },
  "autodesk construction cloud": { price1Year: 280, price3Year: 700 },
  odoo: { price1Year: 360, price3Year: 900 },
  spectronova: { price1Year: 210, price3Year: 525 },
  kaspersky: { price1Year: 45, price3Year: 115 },
  "kaspersky endpoint": { price1Year: 45, price3Year: 115 },
  fortinet: { price1Year: 120, price3Year: 300 },
  sophos: { price1Year: 90, price3Year: 225 },
  "sonicwall next-gen firewall": { price1Year: 110, price3Year: 275 },
  "antivirus and data security": { price1Year: 40, price3Year: 100 },
};

/**
 * Part numbers from "Software Master List" (annual new SKU where available).
 * Products not on that sheet keep a stable demo APT-* code so every card has a Product No.
 */
const PRODUCT_PART_NUMBERS: Record<string, string> = {
  autocad: "C1RK1-WW1762-L158",
  "3ds max": "128Q1-WW3740-L562",
  revit: "829Q1-WW3740-L562",
  "civil 3d": "237Q1-WW3740-L562",
  "aec collection": "02HI1-WW8500-L937",
  "autocad lt": "057Q1-WW6525-L347",
  "bim collaborate pro": "C1GJ1-NS5025-V662",
  "autodesk docs": "C1DJ1-NS5025-V662",
  "autodesk build": "C4DM1-WW3740-L562",
  "autodesk takeoff": "C40M1-NS9048-V432",
  navisworks: "507Q1-WW3740-L562",
  infodrainage: "C68Q1-WW3740-L562",
  "infowater pro": "C69Q1-WW3740-L562",
  "infoworks icm": "C6AQ1-WW3740-L562",
  "infoworks ws pro": "C6CQ1-WW3740-L562",
  "adobe business & creative solutions": "30002907CC01A12",
  "adobe acrobat pro": "65304521CA01A12",
  "adobe illustrator": "65297598BC01A12",
  "adobe photoshop": "30002998CC01A12",
  "adobe premiere pro": "30003019CC01A12",
  "oracle primavera p6": "L70321",
  "microsoft 365 apps": "CFQ7TTC0LH1G",
  "microsoft 365 business": "CFQ7TTC0LDPB",
  "microsoft visio": "CFQ7TTC0HD32:0002",
  "power bi": "CFQ7TTC0LHSF:0001",
};

function partNumberFor(label: string): string {
  const fromSheet = PRODUCT_PART_NUMBERS[normalizeName(label)];
  if (fromSheet) return fromSheet;
  // ponytail: sheet coverage is Autodesk/Adobe/MS/Oracle only; demo codes until master list expands
  return `APT-${slugify(label).toUpperCase().slice(0, 24)}`;
}

/** Local product icons under public/assets (Autodesk); other SKUs use hero images from /images. */
const PRODUCT_ASSET_ICONS: Record<string, string> = {
  autocad: "/assets/autodesk/autocad-product-icon.svg",
  "autocad-lt": "/assets/autodesk/autocad-lt-product-icon.svg",
  revit: "/assets/autodesk/revit-product-icon.svg",
  "civil-3d": "/assets/autodesk/civil-3d-full-product-icon.svg",
  "3ds-max": "/assets/autodesk/3ds-max-full-product-icon.svg",
};

export function getPurchaseProductImage(href: string): string | undefined {
  const slug = href.replace(/^\//, "").split("/").filter(Boolean).pop() ?? "";
  return PRODUCT_ASSET_ICONS[slug] ?? softwareHeroImage(slug);
}

/** Resolve a catalog product by display name (and optional category label). */
export function lookupPurchaseProduct(
  productName: string,
  categoryLabel?: string,
): SoftwarePurchaseProduct | undefined {
  const needle = normalizeName(productName);
  for (const category of SOFTWARE_PURCHASE_CATALOG) {
    if (categoryLabel && normalizeName(category.label) !== normalizeName(categoryLabel)) {
      continue;
    }
    const match = category.products.find((product) => normalizeName(product.name) === needle);
    if (match) return match;
  }
  if (categoryLabel) {
    return lookupPurchaseProduct(productName);
  }
  return undefined;
}

export function productSlugFromHref(href: string): string {
  return href.replace(/^\//, "").split("/").filter(Boolean).pop() ?? "";
}

export function portalProductDetailHref(product: SoftwarePurchaseProduct): string {
  return `/portal/products/${productSlugFromHref(product.href)}`;
}

/** Products list, optionally pre-selecting a category pill (e.g. Microsoft, Autodesk). */
export function portalProductsHref(categoryId?: string): string {
  if (!categoryId) return "/portal/products";
  return `/portal/products?category=${encodeURIComponent(categoryId)}`;
}

export function lookupPurchaseProductBySlug(
  slug: string,
): { product: SoftwarePurchaseProduct; category: SoftwarePurchaseCategory } | undefined {
  const needle = slug.trim().toLowerCase();
  if (!needle) return undefined;
  for (const category of SOFTWARE_PURCHASE_CATALOG) {
    for (const product of category.products) {
      if (productSlugFromHref(product.href) === needle) {
        return { product, category };
      }
    }
  }
  return undefined;
}

export function allPurchaseProductSlugs(): string[] {
  return SOFTWARE_PURCHASE_CATALOG.flatMap((category) =>
    category.products.map((product) => productSlugFromHref(product.href)),
  );
}

export function getPurchaseProductImageByName(
  productName: string,
  categoryLabel?: string,
): string | undefined {
  const product = lookupPurchaseProduct(productName, categoryLabel);
  return product ? getPurchaseProductImage(product.href) : undefined;
}

function slugify(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeName(label: string): string {
  return label.trim().toLowerCase();
}

function normalizeHref(href: string): string {
  return href.trim().toLowerCase().replace(/\/+$/, "") || "/";
}

function guidePrice(label: string): { price1Year?: number; price3Year?: number } {
  const prices = GUIDE_PRICES[normalizeName(label)];
  return prices ? { price1Year: prices.price1Year, price3Year: prices.price3Year } : {};
}

type CollectOptions = {
  /** Landing pages of other Software sections — skip these hub links (e.g. Educational → Adobe). */
  categoryHubHrefs: Set<string>;
  categoryHubLabels: Set<string>;
  /** Global product hrefs already claimed by an earlier section. */
  claimedHrefs: Set<string>;
};

/** Collect product leaves; nested groups (e.g. Water Infrastructure) are flattened into the parent section. */
function collectProducts(
  nodes: NavigationItem[] | undefined,
  options: CollectOptions,
): SoftwarePurchaseProduct[] {
  if (!nodes?.length) return [];

  const products: SoftwarePurchaseProduct[] = [];
  const seenInSection = new Set<string>();

  for (const node of nodes) {
    if (node.children?.length) {
      products.push(...collectProducts(node.children, options));
      continue;
    }
    if (!node.href || node.href === "#") continue;

    const hrefKey = normalizeHref(node.href);
    const nameKey = normalizeName(node.label);

    // Skip category hubs (Educational "Adobe" → /adobe) and cross-section duplicates (EDMS Aconex).
    if (options.categoryHubHrefs.has(hrefKey)) continue;
    if (options.categoryHubLabels.has(nameKey)) continue;
    if (options.claimedHrefs.has(hrefKey) || seenInSection.has(hrefKey)) continue;

    seenInSection.add(hrefKey);
    options.claimedHrefs.add(hrefKey);

    products.push({
      name: node.label,
      href: node.href,
      partNumber: partNumberFor(node.label),
      ...guidePrice(node.label),
    });
  }

  return products;
}

const CATEGORY_HINTS: Record<string, string> = {
  Autodesk: "Design, BIM, and construction tools",
  "Electrical Software": "Power system analysis",
  Adobe: "Creative and document tools",
  Oracle: "Project controls and collaboration",
  Microsoft: "Productivity and business apps",
  Multimedia: "Visualization, PDF, and media tools",
  "Quantity Takeoff": "Measurement and estimating",
  "Structural Software": "Structural analysis and design",
  "Cyber Security Solutions": "Endpoint and network security",
  "Educational Software": "Academic and research licenses",
  EDMS: "Document and business systems",
};

/**
 * Portal purchase catalog derived from the live Software tab
 * (`SITE_NAVIGATION` → Software). One section per Software menu category.
 * Products appear once: first Software section wins; category hub links are skipped.
 */
export function buildSoftwarePurchaseCatalog(): SoftwarePurchaseCategory[] {
  const software = SITE_NAVIGATION.find((item) => item.label === "Software");
  if (!software?.children?.length) return [];

  const categoryHubHrefs = new Set<string>();
  const categoryHubLabels = new Set<string>();
  for (const category of software.children) {
    categoryHubLabels.add(normalizeName(category.label));
    if (category.href) categoryHubHrefs.add(normalizeHref(category.href));
  }

  const claimedHrefs = new Set<string>();
  return software.children.map((category) => ({
    id: slugify(category.label),
    label: category.label,
    hint: CATEGORY_HINTS[category.label] ?? "Software licenses and subscriptions",
    href: category.href,
    products: collectProducts(category.children, {
      categoryHubHrefs,
      categoryHubLabels,
      claimedHrefs,
    }),
  }));
}

export const SOFTWARE_PURCHASE_CATALOG = buildSoftwarePurchaseCatalog();

// ponytail: keep portal catalog locked to Software tab category count
if (SOFTWARE_PURCHASE_CATALOG.length !== 11) {
  throw new Error(
    `SOFTWARE_PURCHASE_CATALOG out of sync with Software tab (${SOFTWARE_PURCHASE_CATALOG.length} categories)`,
  );
}

export function lookupGuidePrice(
  productName: string,
  duration: "1year" | "3year",
): number {
  const prices = GUIDE_PRICES[normalizeName(productName)];
  if (!prices) return 0;
  return duration === "3year" ? prices.price3Year : prices.price1Year;
}

/** ELV Solutions catalog — kept for a future redesign; not surfaced in the Products UI. */
export function buildElvPurchaseCatalog(): SoftwarePurchaseCategory[] {
  const elv = SITE_NAVIGATION.find((item) => item.label === "ELV Solutions");
  if (!elv?.children?.length) return [];

  const claimedHrefs = new Set<string>();
  return [
    {
      id: "elv-solutions",
      label: "ELV Solutions",
      hint: "Security, automation, and infrastructure systems",
      href: elv.href,
      products: collectProducts(elv.children, {
        categoryHubHrefs: new Set(),
        categoryHubLabels: new Set(),
        claimedHrefs,
      }),
    },
  ];
}

// export const ELV_PURCHASE_CATALOG = buildElvPurchaseCatalog();
export const ELV_PURCHASE_CATALOG: SoftwarePurchaseCategory[] = [];

const PRODUCT_BADGES = ["Bestseller", "Popular", "Gold Partner", "Recommended"] as const;

export type ProductCardMeta = {
  initials: string;
  badge: (typeof PRODUCT_BADGES)[number];
  rating: number;
  reviewCount: number;
  description: string;
};

function hashSeed(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** Lightweight display meta for Featured Solutions cards (deterministic, not live reviews). */
export function getProductCardMeta(
  product: SoftwarePurchaseProduct,
  categoryLabel: string,
): ProductCardMeta {
  const seed = hashSeed(`${categoryLabel}:${product.name}`);
  const words = product.name.split(/\s+/).filter(Boolean);
  const initials =
    words.length >= 2
      ? `${words[0]![0] ?? ""}${words[1]![0] ?? ""}`.toUpperCase()
      : product.name.slice(0, 2).toUpperCase();

  return {
    initials,
    badge: PRODUCT_BADGES[seed % PRODUCT_BADGES.length]!,
    rating: 4.5 + (seed % 6) / 10,
    reviewCount: 80 + (seed % 420),
    description: `${product.name} from Aptus — ${categoryLabel.toLowerCase()} solutions for your organization.`,
  };
}
