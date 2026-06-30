import { unstable_cache } from "next/cache";
import { AUTODESK_INNER_PAGE_DEFS } from "@/lib/cms/autodesk-inner-registry";
import { getCmsRevalidateSec } from "@/lib/cms/revalidate";
import type {
  AutodeskProductCategory,
  AutodeskProductContent,
  AutodeskProductSummary,
} from "@/types/autodesk-product";
import { AUTODESK_CATEGORY_LABELS } from "@/types/autodesk-product";
import { getOdooClient } from "./client";
import { isOdooConfigured } from "../config";
import { logger } from "../logger";
import {
  AUTODESK_PRODUCT_FIELDS,
  AUTODESK_PRODUCT_SUMMARY_FIELDS,
  getAutodeskProductModelName,
  mapOdooAutodeskProductContent,
  mapOdooAutodeskProductSummary,
  type OdooAutodeskProductRecord,
} from "./autodesk-product-mapper";

function publishedDomain(): unknown[] {
  return [
    ["active", "=", true],
    ["is_published", "=", true],
  ];
}

async function searchAutodeskProductsUncached(
  fields: string[],
  extraDomain: unknown[] = [],
  limit = 100,
): Promise<OdooAutodeskProductRecord[]> {
  if (!isOdooConfigured()) return [];

  const client = getOdooClient();
  if (!client) return [];

  const model = getAutodeskProductModelName();

  try {
    return await client.searchRead<OdooAutodeskProductRecord>(
      model,
      [...publishedDomain(), ...extraDomain],
      fields,
      limit,
    );
  } catch (error) {
    logger.warn("Autodesk product search failed — model may not be installed", {
      action: "autodesk.product.search_failed",
      model,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

async function readRelatedSummaries(ids: number[]): Promise<AutodeskProductSummary[]> {
  if (!ids.length) return [];

  const client = getOdooClient();
  if (!client) return [];

  const model = getAutodeskProductModelName();

  try {
    const rows = await client.read<OdooAutodeskProductRecord>(
      model,
      ids,
      AUTODESK_PRODUCT_SUMMARY_FIELDS,
    );
    return rows
      .filter((row) => row.is_published && row.active !== false)
      .map(mapOdooAutodeskProductSummary);
  } catch {
    return [];
  }
}

async function fetchAutodeskProductBySlugUncached(
  slug: string,
): Promise<AutodeskProductContent | null> {
  const normalized = slug.replace(/^\//, "");
  const rows = await searchAutodeskProductsUncached(
    AUTODESK_PRODUCT_FIELDS,
    [["url_slug", "=", normalized]],
    1,
  );

  const record = rows[0];
  if (!record) return null;

  const relatedIds = Array.isArray(record.related_product_ids)
    ? record.related_product_ids.map((item) => (typeof item === "number" ? item : item[0]))
    : [];

  const related = await readRelatedSummaries(relatedIds);
  return mapOdooAutodeskProductContent(record, related);
}

async function listAutodeskProductsUncached(
  category?: AutodeskProductCategory,
): Promise<AutodeskProductSummary[]> {
  const extraDomain = category ? [["product_category", "=", category]] : [];
  const rows = await searchAutodeskProductsUncached(
    AUTODESK_PRODUCT_SUMMARY_FIELDS,
    extraDomain,
    200,
  );

  if (rows.length) {
    return rows
      .map(mapOdooAutodeskProductSummary)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  return AUTODESK_INNER_PAGE_DEFS.filter(
    (def) => !category || SLUG_CATEGORY[def.path.replace(/^\//, "")] === category,
  ).map((def) => {
    const slug = def.path.replace(/^\//, "");
    const cat = SLUG_CATEGORY[slug] ?? "engineering_design";
    return {
      id: 0,
      slug,
      name: def.label,
      category: cat,
      categoryLabel: AUTODESK_CATEGORY_LABELS[cat],
      heroTitle: def.label,
      heroSubtitle: def.description,
      isFeatured: false,
      seoTitle: `${def.label} | Aptus Infotech`,
      seoDescription: def.description,
    };
  });
}

const SLUG_CATEGORY: Record<string, AutodeskProductCategory> = {
  autocad: "engineering_design",
  "3ds-max": "engineering_design",
  revit: "engineering_design",
  "civil-3d": "engineering_design",
  "autocad-lt": "engineering_design",
  "aec-collection": "aec_bim",
  "bim-collaborate-pro": "aec_bim",
  "autodesk-docs": "aec_bim",
  "autodesk-build": "aec_bim",
  "autodesk-takeoff": "aec_bim",
  navisworks: "aec_bim",
  infodrainage: "water_infrastructure",
  "infowater-pro": "water_infrastructure",
  "infoworks-icm": "water_infrastructure",
  "infoworks-ws-pro": "water_infrastructure",
};

async function listAutodeskProductSlugsUncached(): Promise<string[]> {
  const rows = await searchAutodeskProductsUncached(["url_slug"], [], 500);
  if (rows.length) {
    return rows.map((row) => row.url_slug).filter(Boolean);
  }
  return AUTODESK_INNER_PAGE_DEFS.map((def) => def.path.replace(/^\//, ""));
}

function withProductCache<T>(
  key: string,
  tags: string[],
  fetcher: () => Promise<T>,
): Promise<T> {
  const revalidate = getCmsRevalidateSec();
  if (revalidate === 0) return fetcher();
  return unstable_cache(fetcher, [key], { revalidate, tags })();
}

export function fetchAutodeskProductBySlug(slug: string): Promise<AutodeskProductContent | null> {
  const normalized = slug.replace(/^\//, "");
  return withProductCache(
    `autodesk-product-${normalized}`,
    [`autodesk:product:${normalized}`, "autodesk:products"],
    () => fetchAutodeskProductBySlugUncached(normalized),
  );
}

export function listAutodeskProducts(
  category?: AutodeskProductCategory,
): Promise<AutodeskProductSummary[]> {
  return withProductCache(
    `autodesk-products-list-${category ?? "all"}`,
    ["autodesk:products", category ? `autodesk:category:${category}` : "autodesk:category:all"],
    () => listAutodeskProductsUncached(category),
  );
}

export function listAutodeskProductSlugs(): Promise<string[]> {
  return withProductCache("autodesk-product-slugs", ["autodesk:products"], () =>
    listAutodeskProductSlugsUncached(),
  );
}
