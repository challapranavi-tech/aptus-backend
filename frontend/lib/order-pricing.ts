import {
  ELV_PURCHASE_CATALOG,
  SOFTWARE_PURCHASE_CATALOG,
  getProductCardMeta,
  getPurchaseProductImage,
  portalProductDetailHref,
  portalProductsHref,
  productSlugFromHref,
  lookupPurchaseProductBySlug,
  type SoftwarePurchaseCategory,
  type SoftwarePurchaseProduct,
} from "@/data/software-purchase-catalog";
import { cartLineUnitPrice } from "@/lib/portal-cart-checkout";
import type { PortalOrder } from "@/types/orders";

export type { SoftwarePurchaseCategory, SoftwarePurchaseProduct };
export {
  ELV_PURCHASE_CATALOG,
  SOFTWARE_PURCHASE_CATALOG,
  getProductCardMeta,
  getPurchaseProductImage,
  portalProductDetailHref,
  portalProductsHref,
};

export type OrderPricing = {
  subscriptionFee: number;
  vat: number;
  total: number;
  /** True when every selected line has a guide price. */
  complete: boolean;
};

export function estimateOrderPricing(order: PortalOrder): OrderPricing | null {
  if (!order.items.length) return null;

  let subscriptionFee = 0;
  let pricedLines = 0;
  for (const item of order.items) {
    const unit = cartLineUnitPrice(item, order.duration);
    if (unit > 0) {
      subscriptionFee += unit * item.quantity;
      pricedLines += 1;
    }
  }

  if (subscriptionFee <= 0) {
    return {
      subscriptionFee: 0,
      vat: 0,
      total: 0,
      complete: false,
    };
  }

  const vat = subscriptionFee * 0.05;
  const total = subscriptionFee + vat;

  return {
    subscriptionFee,
    vat,
    total,
    complete: pricedLines === order.items.length,
  };
}

export function formatOmanAmount(amount: number): string {
  return `OMR ${amount.toLocaleString("en-OM", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  })}`;
}

export function orderTotalToBaisa(total: number): number {
  return Math.max(50, Math.round(total * 1000));
}
