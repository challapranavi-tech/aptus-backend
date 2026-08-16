import {
  getProductConfig,
  type ProductConfig,
  type ProductConfigOption,
} from "@/data/product-options";
import { lookupGuidePrice } from "@/data/software-purchase-catalog";
import type { OrderPricing } from "@/lib/order-pricing";
import type { PortalCartState } from "@/lib/portal-cart";
import type { OrderLineItem, PurchaseType } from "@/types/orders";

export type LineDuration = "1year" | "3year";

export function resolveLineDuration(
  item: OrderLineItem,
  cartDuration: LineDuration = "1year",
): LineDuration {
  return item.duration ?? cartDuration;
}

/** Selected package/seat tier for a line, or its default (first configured option). */
export function resolveLinePackage(
  item: OrderLineItem,
  config: ProductConfig = getProductConfig(item.productName),
): ProductConfigOption | undefined {
  const packages = config.kind === "bundle" ? undefined : config.packages;
  if (!packages?.length) return undefined;
  return packages.find((option) => option.id === item.packageId) ?? packages[0];
}

/** Selected level for a levels-kind line, or its default (Level 1). */
export function resolveLineLevel(
  item: OrderLineItem,
  config: ProductConfig = getProductConfig(item.productName),
): ProductConfigOption | undefined {
  if (config.kind !== "levels") return undefined;
  return config.levels.find((level) => level.id === item.levelId) ?? config.levels[0];
}

export type CartCheckoutStep = "cart" | "checkout";

export const CHECKOUT_STEPS = ["Cart", "Checkout", "Payment"] as const;

export function durationLabel(duration: LineDuration): string {
  return duration === "3year" ? "3 Years" : "Annual";
}

export function purchaseTypeLabel(type: PurchaseType | undefined): string {
  return type === "renew" ? "Renew" : "New Purchase";
}

export function renewalSerialRequired(item: OrderLineItem): boolean {
  const config = getProductConfig(item.productName);
  return config.kind === "renewal" && item.purchaseType === "renew";
}

/** Human-readable summary of a line's selected options, shaped by its product configuration. */
export function lineConfigSummary(item: OrderLineItem, cartDuration: LineDuration = "1year"): string {
  const config = getProductConfig(item.productName);
  if (config.kind === "bundle") return "Bundle";

  if (config.kind === "levels") {
    const level = resolveLineLevel(item, config);
    const pkg = resolveLinePackage(item, config);
    return [level?.label ?? "Level 1", pkg?.label].filter(Boolean).join(" · ");
  }

  const pkg = resolveLinePackage(item, config);
  const serial = item.serialNumber?.trim();
  return [
    durationLabel(resolveLineDuration(item, cartDuration)),
    purchaseTypeLabel(item.purchaseType),
    pkg?.label,
    serial ? `Serial: ${serial}` : undefined,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function cartLineUnitPrice(item: OrderLineItem, cartDuration: LineDuration = "1year"): number {
  const config = getProductConfig(item.productName);

  if (config.kind === "bundle") {
    return lookupGuidePrice(item.productName, "1year");
  }

  if (config.kind === "levels") {
    const base = lookupGuidePrice(item.productName, "1year");
    const level = resolveLineLevel(item, config);
    const pkg = resolveLinePackage(item, config);
    return base * (level?.priceMultiplier ?? 1) * (pkg?.priceMultiplier ?? 1);
  }

  const base = lookupGuidePrice(item.productName, resolveLineDuration(item, cartDuration));
  const pkg = resolveLinePackage(item, config);
  return base * (pkg?.priceMultiplier ?? 1);
}

export function cartLineTotal(item: OrderLineItem, cartDuration: LineDuration = "1year"): number {
  const unit = cartLineUnitPrice(item, cartDuration);
  return unit > 0 ? unit * item.quantity : 0;
}

export function estimateCartPricing(cart: PortalCartState): OrderPricing | null {
  if (!cart.items.length) return null;

  let subscriptionFee = 0;
  let pricedLines = 0;
  for (const item of cart.items) {
    const unit = cartLineUnitPrice(item, cart.duration);
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
    complete: pricedLines === cart.items.length,
  };
}

/** 1-based step index for the Cart → Checkout → Payment stepper. */
export function checkoutStepperIndex(step: CartCheckoutStep, paymentOpen = false): number {
  if (paymentOpen) return 3;
  if (step === "cart") return 1;
  return 2;
}

export function productInitials(productName: string): string {
  const words = productName.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[0]![0] ?? ""}${words[1]![0] ?? ""}`.toUpperCase();
  }
  return productName.slice(0, 2).toUpperCase();
}
