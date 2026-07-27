import {
  detectContactCategory,
  type ContactCategory,
} from "@shared/lib/contact-request";

export type ContactRouting = {
  category: ContactCategory;
  categoryLabel: string;
  to: string;
};

/**
 * Map detected category → sales inbox.
 * Falls back to CONTACT_TO_EMAIL so leads are never dropped when a
 * category-specific inbox is unset.
 */
export function resolveContactRouting(input: {
  product: string;
  categoryHint?: string | null;
}): ContactRouting {
  const category = detectContactCategory(input.product, input.categoryHint);
  const fallback =
    process.env.CONTACT_TO_EMAIL?.trim() || "info@aptusinfotech.com";
  const software = process.env.SOFTWARE_SALES_EMAIL?.trim();
  const elv = process.env.ELV_SALES_EMAIL?.trim();

  if (category === "elv") {
    return {
      category,
      categoryLabel: "ELV",
      to: elv || fallback,
    };
  }

  return {
    category,
    categoryLabel: "Software",
    to: software || fallback,
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
