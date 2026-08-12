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
  // Strip leading "(NCE)" / similar vendor prefixes from Odoo-style titles.
  return label
    .trim()
    .toLowerCase()
    .replace(/^\([^)]*\)\s*/, "");
}

const BUNDLE: ProductConfig = { kind: "bundle" };

// Single Bundle (qty only — no subscription duration, license type, level, or package).
// Includes portal short names plus Odoo / product-detailing title aliases.
const BUNDLE_NAMES = [
  // Oracle / Primavera
  "oracle primavera p6",
  "primavera p6 professional project management",
  "primavera p6 professional project management - application user perpetual",
  "oracle primavera p6 professional project management",
  "primavera p6 enterprise project portfolio management",
  "primavera p6 enterprise project portfolio management - application user perpetual",
  "oracle primavera p6 enterprise project portfolio management",
  "oracle primavera p6 enterprise project portfolio management (eppm)",
  "software update license & support",
  "oracle software update license & support",
  // Microsoft — portal catalog short names
  "microsoft 365 apps",
  "microsoft 365 business",
  "microsoft visio",
  "power bi",
  // Microsoft — detailing titles / SKUs
  "microsoft 365 e3",
  "office 365 e1 (no teams)",
  "microsoft office 365 e1 (no teams)",
  "exchange online kiosk",
  "microsoft exchange online kiosk",
  "microsoft teams essentials",
  "planner and project plan 3",
  "microsoft planner and project plan 3",
  "microsoft defender for office 365 (plan 1)",
  "visio plan 2",
  "microsoft visio plan 2",
  "copilot for microsoft 365",
  "microsoft teams rooms pro without audio conferencing",
  "microsoft teams rooms pro (without audio conferencing)",
  "planner plan 1",
  "microsoft planner plan 1",
  "power bi pro",
  "microsoft power bi pro",
  "microsoft 365 business standard",
  "microsoft 365 business basic",
  "microsoft 365 apps for business",
  "power bi premium per user",
  "microsoft power bi premium per user",
  "microsoft power bi premium per user (ppu)",
  "windows 11 pro (perpetual commercial 0004)",
  "windows 11 pro commercial perpetual",
  "office ltsc standard 2024 commercial perpetual",
  "microsoft office ltsc standard 2024",
  "project professional 2024 commercial perpetual",
  "microsoft project professional 2024",
  "windows server 2025 standard",
  "windows server 2025 standard - 16 core license pack",
] as const;

// ponytail: seat/level price multipliers are placeholder guide-pricing (source docs list
// tier names only, no price breaks) — swap for real Odoo pricelist lookups once available.
const PRODUCT_CONFIGS: Record<string, ProductConfig> = {
  ...Object.fromEntries(BUNDLE_NAMES.map((name) => [name, BUNDLE])),

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

  // ── Software with Renewals: duration (1y/3y) + license type (new/renew) + qty ──
  // Most Autodesk commercial SKUs use DEFAULT_CONFIG (plain renewal). Only products
  // that also expose a package/seat/sheet tier are listed below.
  "bim collaborate pro": {
    kind: "renewal",
    packages: [
      { id: "single", label: "Single", priceMultiplier: 1 },
      { id: "10", label: "10 Users", priceMultiplier: 9 },
      { id: "25", label: "25 Users", priceMultiplier: 20 },
      { id: "100", label: "100 Users", priceMultiplier: 70 },
      { id: "500", label: "500 Users", priceMultiplier: 320 },
      { id: "1000", label: "1000 Users", priceMultiplier: 600 },
    ],
  },
  "bim collaborate": {
    kind: "renewal",
    packages: [
      { id: "single", label: "Single", priceMultiplier: 1 },
      { id: "10", label: "10 Users", priceMultiplier: 9 },
      { id: "25", label: "25 Users", priceMultiplier: 20 },
      { id: "100", label: "100 Users", priceMultiplier: 70 },
      { id: "500", label: "500 Users", priceMultiplier: 320 },
      { id: "1000", label: "1000 Users", priceMultiplier: 600 },
    ],
  },
  "autodesk docs": {
    kind: "renewal",
    packages: [
      { id: "single", label: "Single", priceMultiplier: 1 },
      { id: "10", label: "10 Users", priceMultiplier: 9 },
      { id: "25", label: "25 Users", priceMultiplier: 20 },
      { id: "100", label: "100 Users", priceMultiplier: 70 },
      { id: "500", label: "500 Users", priceMultiplier: 320 },
    ],
  },
  docs: {
    kind: "renewal",
    packages: [
      { id: "single", label: "Single", priceMultiplier: 1 },
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
  build: {
    kind: "renewal",
    packages: [
      { id: "550", label: "550 Sheets", priceMultiplier: 1 },
      { id: "5000", label: "5000 Sheets", priceMultiplier: 6 },
      { id: "unlimited", label: "Unlimited", priceMultiplier: 10 },
    ],
  },
};

export function getProductConfig(productName: string): ProductConfig {
  return PRODUCT_CONFIGS[normalizeName(productName)] ?? DEFAULT_CONFIG;
}
