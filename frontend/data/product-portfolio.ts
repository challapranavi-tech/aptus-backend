import portfolioRows from "@/data/product-portfolio.json";

export type PortfolioRow = {
  brand: string;
  product: string;
  /** Raw "Type of Solution" cell from the spreadsheet, including any padding. */
  solution: string;
};

/** Spreadsheet is the source of truth: Aptus_Product_Portfolio (1).xlsx */
export const PRODUCT_PORTFOLIO: readonly PortfolioRow[] = portfolioRows;

/**
 * Catalog label differs from the spreadsheet product name.
 * Value is the normalized catalog product name.
 */
const CATALOG_PRODUCT_ALIASES: Record<string, readonly string[]> = {
  "autodesk|forma build": ["autodesk build"],
  "autodesk|forma takeoff": ["autodesk takeoff"],
  "autodesk|forma data management": ["autodesk docs"],
  "oracle|primavera p6 ppm": ["primavera p6 professional"],
  "oracle|primavera p6 eppm": ["primavera p6 enterprise"],
};

export type CatalogFilters = {
  /** null = every brand; [] = none */
  brandIds: string[] | null;
  /** null = every solution type; [] = none */
  solutionTypes: string[] | null;
  query: string;
};

export type CatalogSearchInput = {
  id: string;
  label: string;
  href?: string;
  products: readonly { name: string; href: string }[];
};

export type CatalogSearchHit = {
  brandId: string;
  brandLabel: string;
  productName: string;
  href: string;
  solutionTypes: string[];
  /** Spreadsheet product names represented by this card. */
  portfolioProducts: string[];
  synthetic: boolean;
};

export function normalizeSearchText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Comma-separated solution cells are multiple types. Each part is trimmed. */
export function splitSolutionTypes(solution: string): string[] {
  const seen = new Set<string>();
  const types: string[] = [];
  for (const part of solution.split(",")) {
    const label = part.trim();
    if (!label || seen.has(label)) continue;
    seen.add(label);
    types.push(label);
  }
  return types;
}

export function portfolioSolutionTypes(): string[] {
  const seen = new Set<string>();
  const types: string[] = [];
  for (const row of PRODUCT_PORTFOLIO) {
    for (const label of splitSolutionTypes(row.solution)) {
      if (seen.has(label)) continue;
      seen.add(label);
      types.push(label);
    }
  }
  return types.sort((a, b) => a.localeCompare(b));
}

function aliasTargets(row: PortfolioRow): readonly string[] {
  const key = `${normalizeSearchText(row.brand)}|${normalizeSearchText(row.product)}`;
  return CATALOG_PRODUCT_ALIASES[key] ?? [];
}

/**
 * Match a spreadsheet row to one catalog card.
 * ponytail: substring match (shorter side >= 4) so "Creative Cloud" covers the
 * Creative Cloud SKUs and "Nitro PDF" covers the Nitro card. Ceiling: "AutoCAD"
 * also matches "AutoCAD LT". Upgrade path: replace includes() with the alias map only.
 * A brand with a single catalog card takes every row for that brand.
 */
export function portfolioRowMatchesProduct(
  row: PortfolioRow,
  productName: string,
  productCountForBrand: number,
): boolean {
  if (productCountForBrand === 1) return true;
  const aliases = aliasTargets(row);
  const catalogName = normalizeSearchText(productName);
  if (aliases.includes(catalogName)) return true;
  const portfolioName = normalizeSearchText(row.product);
  if (portfolioName === catalogName) return true;
  if (portfolioName.length >= 4 && catalogName.includes(portfolioName)) return true;
  if (catalogName.length >= 4 && portfolioName.includes(catalogName)) return true;
  return false;
}

function sameBrand(row: PortfolioRow, brandLabel: string): boolean {
  return normalizeSearchText(row.brand) === normalizeSearchText(brandLabel);
}

export function searchCatalogProducts(
  catalog: readonly CatalogSearchInput[],
  filters: CatalogFilters,
): CatalogSearchHit[] {
  const query = normalizeSearchText(filters.query);
  const hits: CatalogSearchHit[] = [];

  for (const brand of catalog) {
    if (filters.brandIds !== null && !filters.brandIds.includes(brand.id)) continue;
    const rows = PRODUCT_PORTFOLIO.filter((row) => sameBrand(row, brand.label));
    const claimed = new Set<number>();

    for (const product of brand.products) {
      const matched = rows.filter((row, index) => {
        if (!portfolioRowMatchesProduct(row, product.name, brand.products.length)) return false;
        claimed.add(index);
        return true;
      });
      const hit = hitFrom(brand, product.name, product.href, matched, false);
      if (hitMatches(hit, filters.solutionTypes, query)) hits.push(hit);
    }

    rows.forEach((row, index) => {
      if (claimed.has(index)) return;
      const hit = hitFrom(brand, row.product, brand.href || "/software-solutions", [row], true);
      if (hitMatches(hit, filters.solutionTypes, query)) hits.push(hit);
    });
  }

  return hits;
}

function hitFrom(
  brand: CatalogSearchInput,
  productName: string,
  href: string,
  rows: readonly PortfolioRow[],
  synthetic: boolean,
): CatalogSearchHit {
  const solutionTypes: string[] = [];
  const portfolioProducts: string[] = [];
  const seenTypes = new Set<string>();
  const seenProducts = new Set<string>();
  for (const row of rows) {
    if (!seenProducts.has(row.product)) {
      seenProducts.add(row.product);
      portfolioProducts.push(row.product);
    }
    for (const label of splitSolutionTypes(row.solution)) {
      if (seenTypes.has(label)) continue;
      seenTypes.add(label);
      solutionTypes.push(label);
    }
  }
  return {
    brandId: brand.id,
    brandLabel: brand.label,
    productName,
    href,
    solutionTypes,
    portfolioProducts,
    synthetic,
  };
}

function hitMatches(
  hit: CatalogSearchHit,
  solutionTypes: string[] | null,
  query: string,
): boolean {
  if (solutionTypes !== null) {
    if (!hit.solutionTypes.some((label) => solutionTypes.includes(label))) return false;
  }
  if (!query) return true;
  const haystack = [
    hit.productName,
    hit.brandLabel,
    ...hit.solutionTypes,
    ...hit.portfolioProducts,
  ];
  return haystack.some((value) => normalizeSearchText(value).includes(query));
}

export type PortfolioAudit = {
  rowCount: number;
  blankRows: { brand: string; product: string; solution: string }[];
  duplicateKeys: string[];
  paddedSolutionCells: { brand: string; product: string; solution: string }[];
  multiSolutionRows: { brand: string; product: string; solutionTypes: string[] }[];
  /** Distinct labels that partial-match each other but are not the same type. */
  nearDuplicateSolutions: string[][];
};

export function auditProductPortfolio(): PortfolioAudit {
  const blankRows: PortfolioAudit["blankRows"] = [];
  const paddedSolutionCells: PortfolioAudit["paddedSolutionCells"] = [];
  const multiSolutionRows: PortfolioAudit["multiSolutionRows"] = [];
  const seen = new Map<string, number>();
  const duplicateKeys: string[] = [];

  for (const row of PRODUCT_PORTFOLIO) {
    const brand = String(row.brand ?? "");
    const product = String(row.product ?? "");
    const solution = String(row.solution ?? "");
    if (!brand.trim() || !product.trim() || !solution.trim()) {
      blankRows.push({ brand, product, solution });
    }
    if (solution !== solution.trim()) {
      paddedSolutionCells.push({ brand, product, solution });
    }
    const types = splitSolutionTypes(solution);
    if (types.length > 1) {
      multiSolutionRows.push({ brand, product, solutionTypes: types });
    }
    const key = `${normalizeSearchText(brand)}|${normalizeSearchText(product)}`;
    const count = (seen.get(key) ?? 0) + 1;
    seen.set(key, count);
    if (count === 2) duplicateKeys.push(key);
  }

  const labels = portfolioSolutionTypes();
  const nearDuplicateSolutions: string[][] = [];
  for (let i = 0; i < labels.length; i++) {
    for (let j = i + 1; j < labels.length; j++) {
      const a = normalizeSearchText(labels[i]!);
      const b = normalizeSearchText(labels[j]!);
      if (a.includes(b) || b.includes(a)) nearDuplicateSolutions.push([labels[i]!, labels[j]!]);
    }
  }

  return {
    rowCount: PRODUCT_PORTFOLIO.length,
    blankRows,
    duplicateKeys,
    paddedSolutionCells,
    multiSolutionRows,
    nearDuplicateSolutions,
  };
}
