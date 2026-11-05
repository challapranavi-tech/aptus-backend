import {
  detectContactCategory,
  type ContactCategory,
} from "@shared/lib/contact-request";

// Re-export so callers (route.ts) don't need a second @shared import.
export type { ContactCategory };

export type ContactRouting = {
  category: ContactCategory;
  categoryLabel: string;
  to: string;
};

function isQuoteProduct(product: string): boolean {
  const p = product.trim();
  return Boolean(p) && p !== "Others" && p !== "Select Product";
}

const PRODUCT_TYPES = new Set(["software", "elv", "solar"]);

/** Product Type dropdown wins over the page category hint. */
function explicitProductType(
  raw: string | null | undefined,
): ContactCategory | undefined {
  const value = (raw ?? "").trim().toLowerCase();
  return PRODUCT_TYPES.has(value) ? (value as ContactCategory) : undefined;
}

/**
 * Inbox routing. Product Type is the company key:
 *   software → SOFTWARE_SALES_EMAIL
 *   elv      → ELV_SALES_EMAIL (label Infra)
 *   solar    → SOLAR_SALES_EMAIL
 * Contact Us (no real product) → CONTACT_TO_EMAIL
 * A missing inbox falls back to CONTACT_TO_EMAIL.
 *
 * ponytail: keep category key "elv" (env vars / Odoo IDs); only categoryLabel is "Infra".
 */
export function resolveContactRouting(input: {
  product: string;
  categoryHint?: string | null;
  /** Request Quote "Product Type" (software | elv | solar). Overrides categoryHint. */
  productType?: string | null;
}): ContactRouting {
  const contactTo =
    process.env.CONTACT_TO_EMAIL?.trim() || "info@aptusinfotech.com";
  const software = process.env.SOFTWARE_SALES_EMAIL?.trim();
  const elv = process.env.ELV_SALES_EMAIL?.trim();
  const solar = process.env.SOLAR_SALES_EMAIL?.trim();

  if (!isQuoteProduct(input.product ?? "")) {
    return {
      category: "software",
      categoryLabel: "Contact",
      to: contactTo,
    };
  }

  const category = detectContactCategory(
    input.product,
    explicitProductType(input.productType) ?? input.categoryHint,
  );
  if (category === "elv") {
    return {
      category,
      categoryLabel: "Infra",
      to: elv || contactTo,
    };
  }
  if (category === "solar") {
    return {
      category,
      categoryLabel: "Solar",
      to: solar || contactTo,
    };
  }

  return {
    category,
    categoryLabel: "Software",
    to: software || contactTo,
  };
}

/** Asia/Muscat timestamp for quote notification emails. */
export function formatMuscatDateTime(date = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Muscat",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
