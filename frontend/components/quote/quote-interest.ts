import { quoteContextForFamily } from "@/components/quote/quote-modal-utils";

/** Product type options on Request Quote (hero + modal + CTA forms). */
export const QUOTE_PRODUCT_TYPES = [
  { value: "software", label: "SOFTWARE" },
  { value: "elv", label: "ELV" },
  { value: "solar", label: "SOLAR" },
] as const;

export type QuoteProductType = (typeof QUOTE_PRODUCT_TYPES)[number]["value"];

/** Map page/quote family onto Software / ELV / Solar. */
export function resolveQuoteProductType(
  family?: string | null,
  category?: string | null,
): QuoteProductType {
  const key = (family ?? category ?? "").trim().toLowerCase();
  if (key === "elv" || key === "elv-solutions") return "elv";
  if (key === "solar" || key === "aptus-solar") return "solar";
  return "software";
}

export function quoteContextForProductType(
  productType: QuoteProductType,
  defaultProduct?: string,
) {
  const family =
    productType === "elv"
      ? "elv"
      : productType === "solar"
        ? "solar"
        : "software-licensing";
  const context = quoteContextForFamily(family);
  if (!defaultProduct?.trim()) return context;
  const needle = defaultProduct.trim().toLowerCase();
  const exact = context.products.find((p) => p.toLowerCase() === needle);
  if (exact) return { ...context, defaultProduct: exact };
  const fuzzy = context.products.find((p) => {
    const value = p.toLowerCase();
    return value.includes(needle) || needle.includes(value.split(" - ")[0] ?? value);
  });
  return { ...context, defaultProduct: fuzzy ?? defaultProduct.trim() };
}

/** @deprecated use QUOTE_PRODUCT_TYPES — kept for Talk to Expert chips */
export const QUOTE_INTEREST_OPTIONS = [
  { label: "Software licensing", family: "software-licensing" },
  { label: "ELV & security", family: "elv" },
  { label: "Digital engineering", family: "autodesk" },
  { label: "Training & support", family: "educational" },
] as const;

export type QuoteInterestFamily =
  (typeof QUOTE_INTEREST_OPTIONS)[number]["family"];

export function resolveQuoteInterestFamily(
  family?: string | null,
): QuoteInterestFamily {
  const key = (family ?? "").trim().toLowerCase();
  if (key === "elv" || key === "elv-solutions") return "elv";
  if (key === "educational") return "educational";
  if (key === "autodesk" || key === "water-infrastructure") return "autodesk";
  if (key === "solar" || key === "aptus-solar") return "software-licensing";
  return "software-licensing";
}

export function quoteContextForInterest(
  family: QuoteInterestFamily,
  defaultProduct?: string,
) {
  const context = quoteContextForFamily(family);
  if (!defaultProduct?.trim()) return context;
  const needle = defaultProduct.trim().toLowerCase();
  const exact = context.products.find((p) => p.toLowerCase() === needle);
  if (exact) return { ...context, defaultProduct: exact };
  const fuzzy = context.products.find((p) => {
    const value = p.toLowerCase();
    return value.includes(needle) || needle.includes(value.split(" - ")[0] ?? value);
  });
  return { ...context, defaultProduct: fuzzy ?? defaultProduct.trim() };
}
