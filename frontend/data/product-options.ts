/**
 * Per-product purchase configuration: which selectors the product detail page
 * (and cart) should show, and how they affect price. Keyed by normalized product
 * name so adding a new product's configuration never requires touching UI code —
 * only this table (see `docs/` product detailing briefs for the 3 shapes).
 */

export type ProductConfigOption = {
  id: string;
  label: string;
  /** Multiplier applied to the product's base guide price (1 = base price). */
  priceMultiplier: number;
};

export type RenewalProductConfig = {
  kind: "renewal";
  /** Seat/sheet/tier packages, e.g. "Single User", "10 Users". Omit for a single implicit package. */
  packages?: ProductConfigOption[];
};

export type LevelsProductConfig = {
  kind: "levels";
  /** Up to 5 levels; only the levels configured for this product are shown. */
  levels: ProductConfigOption[];
  /** Rare: a level-based product that also exposes a package tier. */
  packages?: ProductConfigOption[];
};

export type BundleProductConfig = {
  kind: "bundle";
};

export type ProductConfig = RenewalProductConfig | LevelsProductConfig | BundleProductConfig;

const DEFAULT_CONFIG: RenewalProductConfig = { kind: "renewal" };

function normalizeName(label: string): string {
  return label.trim().toLowerCase();
}

// ponytail: seat/level price multipliers are placeholder guide-pricing (source docs list
// tier names only, no price breaks) — swap for real Odoo pricelist lookups once available.
const PRODUCT_CONFIGS: Record<string, ProductConfig> = {
  // ── Products with Levels (Level 1–5, no Subscription/License Type/Package) ──
  "adobe acrobat pro": {
    kind: "levels",
    levels: [
      { id: "level-1", label: "Level 1", priceMultiplier: 1 },
      { id: "level-2", label: "Level 2", priceMultiplier: 1.4 },
      { id: "level-3", label: "Level 3", priceMultiplier: 1.8 },
    ],
  },
  "adobe premiere pro": {
    kind: "levels",
    levels: [
      { id: "level-1", label: "Level 1", priceMultiplier: 1 },
      { id: "level-2", label: "Level 2", priceMultiplier: 1.4 },
      { id: "level-3", label: "Level 3", priceMultiplier: 1.8 },
    ],
  },

  // ── Single Bundle products (perpetual license — quantity only, no subscription) ──
  // Per source doc: Primavera P6 is sold as an "Application User Perpetual" license.
  // Microsoft 365 Apps/Business, Visio, and Power BI remain named-user annual/3-year
  // subscriptions (source doc: NCE named-user terms) so they keep the default renewal config.
  "oracle primavera p6": { kind: "bundle" },

  // ── Software with Renewals + Package tiers ──
  revit: {
    kind: "renewal",
    packages: [
      { id: "single-user", label: "Single-User", priceMultiplier: 1 },
      { id: "team-studio", label: "Team Studio", priceMultiplier: 2.2 },
      { id: "enterprise", label: "Enterprise", priceMultiplier: 4 },
    ],
  },
  "bim collaborate pro": {
    kind: "renewal",
    // Source doc lists tiers Single/10/25/50/100/500/1000.
    packages: [
      { id: "single", label: "Single", priceMultiplier: 1 },
      { id: "10", label: "10 Users", priceMultiplier: 9 },
      { id: "25", label: "25 Users", priceMultiplier: 20 },
      { id: "50", label: "50 Users", priceMultiplier: 38 },
      { id: "100", label: "100 Users", priceMultiplier: 70 },
      { id: "500", label: "500 Users", priceMultiplier: 320 },
      { id: "1000", label: "1000 Users", priceMultiplier: 600 },
    ],
  },
  "autodesk docs": {
    kind: "renewal",
    packages: [
      { id: "single", label: "Single User", priceMultiplier: 1 },
      { id: "10", label: "10 Users", priceMultiplier: 9 },
      { id: "25", label: "25 Users", priceMultiplier: 20 },
      { id: "100", label: "100 Users", priceMultiplier: 70 },
      { id: "500", label: "500 Users", priceMultiplier: 320 },
    ],
  },
  "autodesk build": {
    kind: "renewal",
    packages: [
      { id: "550", label: "550 Sheets", priceMultiplier: 1 },
      { id: "5000", label: "5000 Sheets", priceMultiplier: 6 },
      { id: "unlimited", label: "Unlimited", priceMultiplier: 10 },
    ],
  },
  "3ds max": {
    kind: "renewal",
    packages: [
      { id: "standard-commercial", label: "Standard Commercial", priceMultiplier: 1 },
      { id: "indie", label: "3ds Max Indie", priceMultiplier: 0.5 },
      { id: "flex", label: "Autodesk Flex", priceMultiplier: 0.4 },
    ],
  },
  navisworks: {
    kind: "renewal",
    packages: [
      { id: "manage", label: "Manage", priceMultiplier: 1 },
      { id: "simulate", label: "Simulate", priceMultiplier: 0.7 },
    ],
  },
  infodrainage: {
    kind: "renewal",
    packages: [
      { id: "single-user", label: "Single-User", priceMultiplier: 1 },
      { id: "team-design", label: "Team Design", priceMultiplier: 2.2 },
      { id: "enterprise", label: "Enterprise", priceMultiplier: 4 },
    ],
  },
  "infoworks icm": {
    kind: "renewal",
    packages: [
      { id: "standard", label: "Standard", priceMultiplier: 1 },
      { id: "ultimate", label: "Ultimate", priceMultiplier: 1.8 },
    ],
  },
};

export function getProductConfig(productName: string): ProductConfig {
  return PRODUCT_CONFIGS[normalizeName(productName)] ?? DEFAULT_CONFIG;
}
