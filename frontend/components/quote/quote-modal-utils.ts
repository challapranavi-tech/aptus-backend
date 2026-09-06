import { isElvHubSlug, isElvInnerSlug } from "@/data/elv-product-media";
import { getSoftwarePageScope } from "@/data/software-page-scope";
import {
  SOFTWARE_SUBNAV_BY_FAMILY,
  softwareSubnavForFamily,
} from "@/data/software-subnav";
import { CONTACT_PRODUCTS, ELV_PRODUCTS, EXTRA_SOFTWARE_PRODUCTS } from "@shared/lib/contact-request";

const QUOTE_MODAL_LABELS = new Set([
  "Request a Quote",
  "Request Quote",
  "Renew Subscription",
  "Get Your Quote Now",
]);

/**
 * Top-of-page / product-card "Request Quote" CTAs to hide — keep mid/bottom
 * "Get Your Quote Now" and Renew Subscription visible.
 */
export function isTopRequestQuoteCta(label?: string | null): boolean {
  const t = (label ?? "").replace(/\s+/g, " ").trim().toLowerCase();
  return t === "request a quote" || t === "request quote";
}

/** Slug → ELV product name (matches contactCta.productName in content JSON). */
const ELV_SLUG_PRODUCT: Record<string, string> = {
  "access-control-system": "Access Control Systems",
  "audio-video-solutions": "Audio Video Solutions",
  "cctv-camera": "CCTV Surveillance Solutions",
  "conference-room-solution": "Conference Room Solutions",
  "data-center-solutions": "Data Center Solutions",
  "gate-automation": "Gate Automation Solutions",
  "guest-room-management": "Guestroom Management System",
  "home-automation": "Smart Home Solutions",
  "network-and-structured-cabling-solutions": "Network & Structured Cabling Solutions",
  "nurse-calling-system": "Nurse Calling System",
  "rsi-queue-management": "Queue Management Solutions",
  "smatv-iptv": "SMATV/IPTV Solutions",
  "switching-and-routing": "Switching and Routing",
  "telephone-systems": "Telephone Systems",
  "thermal-scanners": "Thermal Scanner Solutions",
  ups: "Uninterruptible Power Supply - UPS",
  "elv-solutions": "ELV Solutions",
};

/** Hub / card CTAs that point at #Form still need a family when opened from software-solutions. */
const TITLE_FAMILY_HINT: Record<string, string> = {
  Autodesk: "autodesk",
  Adobe: "adobe",
  Microsoft: "microsoft",
  Multimedia: "multimedia",
  Oracle: "oracle",
  "Electrical Software": "electrical",
  "Quantity Takeoff": "quantity-takeoff",
  "Structural Software": "structural",
  "Cyber Security Solutions": "cyber-security",
  "Educational Software": "educational",
  "Educational Documents Management": "edms",
};

/** Full product catalog for generic Request Quote (software + ELV). */
const ALL_QUOTE_PRODUCTS: string[] = (() => {
  const names = new Set<string>();
  for (const [family, links] of Object.entries(SOFTWARE_SUBNAV_BY_FAMILY)) {
    // Hub entries are brand/category tiles, not sellable line items.
    if (family === "software" || family === "software-solutions") continue;
    for (const link of links) {
      if (link.label.trim()) names.add(link.label.trim());
    }
  }
  for (const product of CONTACT_PRODUCTS) {
    if (product !== "Others") names.add(product);
  }
  for (const product of EXTRA_SOFTWARE_PRODUCTS) {
    names.add(product);
  }
  for (const product of ELV_PRODUCTS) {
    names.add(product);
  }
  return Array.from(names).sort((a, b) => a.localeCompare(b));
})();

const ELV_QUOTE_PRODUCTS = [
  ...new Set(
    ELV_PRODUCTS.filter((product) => product !== "ELV Solutions"),
  ),
].sort((a, b) => a.localeCompare(b));

const SOFTWARE_QUOTE_PRODUCTS = ALL_QUOTE_PRODUCTS.filter(
  (product) => !(ELV_PRODUCTS as readonly string[]).includes(product),
);

/** Aptus Solar quote options (hub content still expanding). */
export const SOLAR_QUOTE_PRODUCTS = [
  "Residential Solar Systems",
  "Commercial Solar Systems",
  "Industrial Solar Solutions",
  "Solar Hybrid Systems",
  "Off-Grid Solar Solutions",
  "Solar Water Heating",
  "Solar Maintenance & Support",
  "Aptus Solar Consultation",
] as const;

function productsForFamily(family: string): string[] {
  if (family === "all") return [...ALL_QUOTE_PRODUCTS];
  if (family === "elv") return [...ELV_QUOTE_PRODUCTS];
  if (family === "solar" || family === "aptus-solar") {
    return [...SOLAR_QUOTE_PRODUCTS];
  }
  if (family === "software-licensing" || family === "software") {
    return [...SOFTWARE_QUOTE_PRODUCTS];
  }

  const links = softwareSubnavForFamily(
    family === "water-infrastructure" ? "autodesk" : family,
  );
  if (links?.length) {
    return [...new Set(links.map((link) => link.label.trim()).filter(Boolean))].sort(
      (a, b) => a.localeCompare(b),
    );
  }

  if (family === "autodesk" || family === "water-infrastructure") {
    return CONTACT_PRODUCTS.filter((p) => p !== "Others").map(String);
  }

  return [...SOFTWARE_QUOTE_PRODUCTS];
}

export type QuoteModalContext = {
  category: "software" | "elv";
  family: string;
  productLabel: string;
  products: string[];
  defaultProduct?: string;
};

export function shouldOpenQuoteModal(link: HTMLAnchorElement): boolean {
  if (link.closest(".aptus-quote-modal")) return false;

  // Portal / explicit quote CTAs
  if (
    link.getAttribute("data-aptus-quote") === "true" ||
    link.hasAttribute("data-quote-product") ||
    link.hasAttribute("data-quote-family")
  ) {
    return true;
  }

  const href = link.getAttribute("href")?.trim() ?? "";
  const hrefLower = href.toLowerCase();

  if (hrefLower === "#form") return true;
  if (href.includes("popup") || href.includes("elementor-action")) return true;

  const label = link.textContent?.replace(/\s+/g, " ").trim();
  return label ? QUOTE_MODAL_LABELS.has(label) : false;
}

function pathSlug(pathname: string): string {
  return pathname.replace(/^\/+|\/+$/g, "").split("/")[0] ?? "";
}

function defaultProductForSlug(family: string, slug: string): string | undefined {
  if (family === "elv") return ELV_SLUG_PRODUCT[slug];

  const navFamily = family === "water-infrastructure" ? "autodesk" : family;
  const links = softwareSubnavForFamily(navFamily);
  const match = links?.find((link) => link.href.replace(/^\//, "") === slug);
  if (match) return match.label;

  if (family === "autodesk" || family === "water-infrastructure") {
    const AUTODESK_SLUG_PRODUCT: Record<string, string> = {
      autocad: "AutoCAD",
      "3ds-max": "3ds Max",
      "civil-3d": "Civil 3D",
      "autocad-lt": "AutoCAD LT",
      revit: "Revit",
      "infowater-pro": "InfoWater Pro",
      navisworks: "Navisworks",
    };
    return AUTODESK_SLUG_PRODUCT[slug];
  }

  return undefined;
}

/** Build Request Quote context for a product family (used by Talk to Expert + CTAs). */
export function quoteContextForFamily(
  family: string,
  slug?: string,
): QuoteModalContext {
  const products = productsForFamily(family);
  const defaultProduct = slug ? defaultProductForSlug(family, slug) : undefined;
  return {
    category: family === "elv" ? "elv" : "software",
    family,
    productLabel: "Products",
    products,
    defaultProduct:
      defaultProduct && products.includes(defaultProduct) ? defaultProduct : undefined,
  };
}

function contextForFamily(family: string, slug?: string): QuoteModalContext {
  return quoteContextForFamily(family, slug);
}

/** Resolve quote catalog from the current page path. */
export function quoteContextFromPathname(pathname: string): QuoteModalContext {
  const slug = pathSlug(pathname);

  if (!slug) {
    return contextForFamily("all");
  }

  if (slug === "aptus-solar") {
    return contextForFamily("solar", slug);
  }

  if (isElvHubSlug(slug) || isElvInnerSlug(slug)) {
    return contextForFamily("elv", slug);
  }

  const scope = getSoftwarePageScope(slug);
  if (!scope?.family || scope.family === "software" || scope.family === "software-solutions") {
    return contextForFamily("software-licensing", slug);
  }

  let family = scope.family;
  // Electrical Software cards link to /etap — keep a dedicated ETAP catalog.
  if (slug === "etap") family = "electrical";
  return contextForFamily(family, slug);
}

/**
 * Family hint for hub cards whose CTA is `#Form` (no destination page).
 * Also used when the CTA href is a category hub (`/adobe`) — pathname still
 * resolves via quoteContextFromPathname(href).
 */
export function quoteFamilyHint(href?: string, title?: string): string | undefined {
  const path = (href ?? "").trim();
  if (path.startsWith("/") && !path.startsWith("/#") && path.toLowerCase() !== "#form") {
    return undefined;
  }
  if (!title) return undefined;
  return TITLE_FAMILY_HINT[title.trim()];
}

/** Prefer the clicked link’s destination/family over the hub page pathname. */
export function quoteContextFromLink(
  link: HTMLAnchorElement,
  pathname: string,
): QuoteModalContext {
  const href = link.getAttribute("href")?.trim() ?? "";
  const dataFamily = link.getAttribute("data-quote-family")?.trim();
  const dataProduct = link.getAttribute("data-quote-product")?.trim();
  const hrefSlug =
    href.startsWith("/") && !href.startsWith("/#") && !href.startsWith("/portal")
      ? pathSlug(href)
      : undefined;

  let context: QuoteModalContext;
  if (dataFamily) {
    context = contextForFamily(dataFamily, hrefSlug);
  } else if (href.startsWith("/") && !href.startsWith("/#") && !href.startsWith("/portal")) {
    context = quoteContextFromPathname(href);
  } else {
    // Never resolve family from /portal/* — fall back to full product catalog.
    const path = pathname.startsWith("/portal") ? "/" : pathname;
    context = quoteContextFromPathname(path);
  }

  return withDefaultProduct(context, dataProduct);
}

/** Build the same quote modal context used on marketing CTAs, for portal products. */
export function quoteContextForPortalProduct(options: {
  family: string;
  productName: string;
  productHref?: string;
}): QuoteModalContext {
  const family = options.family === "elv-solutions" ? "elv" : options.family;
  const slug =
    options.productHref && options.productHref.startsWith("/")
      ? pathSlug(options.productHref)
      : undefined;
  const context = contextForFamily(family, slug);
  return withDefaultProduct(context, options.productName);
}

function withDefaultProduct(
  context: QuoteModalContext,
  productName?: string | null,
): QuoteModalContext {
  if (!productName?.trim()) return context;
  const needle = productName.trim().toLowerCase();
  const exact = context.products.find((product) => product.toLowerCase() === needle);
  if (exact) return { ...context, defaultProduct: exact };

  const fuzzy = context.products.find((product) => {
    const p = product.toLowerCase();
    return p.includes(needle) || needle.includes(p.split(" - ")[0] ?? p);
  });

  // Keep portal product name even if not in family list — form unshifts it into options.
  return { ...context, defaultProduct: fuzzy ?? productName.trim() };
}

// ponytail: self-check — fails if quote link / family catalog detection regresses
if (process.env.NODE_ENV === "development") {
  const mk = (href: string, text: string, family?: string, product?: string) =>
    ({
      getAttribute: (name: string) => {
        if (name === "href") return href;
        if (name === "data-quote-family") return family ?? null;
        if (name === "data-quote-product") return product ?? null;
        if (name === "data-aptus-quote") return product || family ? "true" : null;
        return null;
      },
      hasAttribute: (name: string) =>
        (name === "data-quote-family" && Boolean(family)) ||
        (name === "data-quote-product" && Boolean(product)),
      textContent: text,
      closest: () => null,
    }) as unknown as HTMLAnchorElement;

  console.assert(shouldOpenQuoteModal(mk("#form", "Request a Quote")) === true);
  console.assert(shouldOpenQuoteModal(mk("#Products", "Browse Products")) === false);
  console.assert(
    shouldOpenQuoteModal(mk("#form", "Request Quote", "autodesk", "AutoCAD")) === true,
  );

  const elv = quoteContextFromPathname("/thermal-scanners");
  console.assert(elv.category === "elv");
  console.assert(elv.productLabel === "Products");
  console.assert(elv.defaultProduct === "Thermal Scanner Solutions");
  console.assert(!elv.products.includes("Adobe Photoshop"));
  console.assert(elv.products.includes("Thermal Scanner Solutions"));

  const adobe = quoteContextFromPathname("/adobe-business-creative-solutions");
  console.assert(adobe.family === "adobe");
  console.assert(adobe.productLabel === "Products");
  console.assert(adobe.products.includes("Adobe Photoshop"));
  console.assert(!adobe.products.includes("AutoCAD"));

  const fromAdobeCard = quoteContextFromLink(
    mk("/adobe", "Request a Quote"),
    "/software-solutions",
  );
  console.assert(fromAdobeCard.family === "adobe");
  console.assert(fromAdobeCard.products.includes("Adobe Illustrator"));

  const fromQtyCard = quoteContextFromLink(
    mk("#Form", "Request a Quote", "quantity-takeoff"),
    "/software-solutions",
  );
  console.assert(fromQtyCard.family === "quantity-takeoff");
  console.assert(fromQtyCard.productLabel === "Products");

  const fromPortal = quoteContextForPortalProduct({
    family: "autodesk",
    productName: "AutoCAD",
    productHref: "/autocad",
  });
  console.assert(fromPortal.family === "autodesk");
  console.assert(fromPortal.defaultProduct === "AutoCAD" || Boolean(fromPortal.defaultProduct));

  const portalPathSafe = quoteContextFromLink(
    mk("#form", "Request Quote", "adobe", "Adobe Photoshop"),
    "/software-solutions",
  );
  console.assert(portalPathSafe.family === "adobe");
  console.assert(portalPathSafe.defaultProduct === "Adobe Photoshop");

  const homeQuote = quoteContextFromPathname("/");
  console.assert(homeQuote.family === "all");
  console.assert(homeQuote.productLabel === "Products");
  console.assert(homeQuote.products.length > 20);

  const expertElv = quoteContextForFamily("elv");
  console.assert(expertElv.category === "elv");
  console.assert(expertElv.products.every((p) => !p.toLowerCase().includes("photoshop")));
  console.assert(expertElv.products.includes("CCTV Surveillance Solutions"));
}
