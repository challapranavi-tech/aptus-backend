import {
  detectContactCategory,
  type ContactCategory,
} from "@shared/lib/contact-request";

export type ContactRouting = {
  category: ContactCategory;
  categoryLabel: string;
  to: string;
};

function isQuoteProduct(product: string): boolean {
  const p = product.trim();
  return Boolean(p) && p !== "Others" && p !== "Select Product";
}

/**
 * Inbox routing:
 *   Contact Us (no real product) → CONTACT_TO_EMAIL
 *   Software quote               → SOFTWARE_SALES_EMAIL (fallback CONTACT_TO_EMAIL)
 *   ELV quote                    → ELV_SALES_EMAIL (fallback CONTACT_TO_EMAIL)
 */
export function resolveContactRouting(input: {
  product: string;
  categoryHint?: string | null;
}): ContactRouting {
  const contactTo =
    process.env.CONTACT_TO_EMAIL?.trim() || "info@aptusinfotech.com";
  const software = process.env.SOFTWARE_SALES_EMAIL?.trim();
  const elv = process.env.ELV_SALES_EMAIL?.trim();

  if (!isQuoteProduct(input.product ?? "")) {
    return {
      category: "software",
      categoryLabel: "Contact",
      to: contactTo,
    };
  }

  const category = detectContactCategory(input.product, input.categoryHint);
  if (category === "elv") {
    return {
      category,
      categoryLabel: "ELV",
      to: elv || contactTo,
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
