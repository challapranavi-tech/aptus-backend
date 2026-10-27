import { lookupPortalSku } from "@/data/software-purchase-catalog";
import {
  isPortalPurchasableProduct,
  lookupFullCatalogProductBySlug,
  PORTAL_PURCHASABLE_SLUGS,
} from "@/data/software-full-catalog";

/** The 8 Autodesk products that support online add-to-cart and checkout. */
export const PORTAL_PURCHASABLE_PRODUCT_COUNT = PORTAL_PURCHASABLE_SLUGS.size;

/** Match cart line display name to a purchasable SKU (8 portal Autodesk products). */
export function isPortalPurchasableProductName(productName: string): boolean {
  return Boolean(lookupPortalSku(productName, "1year", "new"));
}

export function isPortalPurchasableLineItem(item: {
  productName: string;
  category?: string;
}): boolean {
  if (isPortalPurchasableProductName(item.productName)) return true;

  const needle = item.productName.trim().toLowerCase();
  for (const slug of PORTAL_PURCHASABLE_SLUGS) {
    const found = lookupFullCatalogProductBySlug(slug);
    if (found?.product.name.trim().toLowerCase() === needle) {
      return isPortalPurchasableProduct(found.product.href);
    }
  }
  return false;
}

export function filterPortalPurchasableCartItems<
  T extends { productName: string; category?: string },
>(items: T[]): T[] {
  return items.filter((item) => isPortalPurchasableLineItem(item));
}

export function portalPurchasableValidationError(productName: string): string {
  return `${productName} is not available for online purchase. Request a quote instead.`;
}
