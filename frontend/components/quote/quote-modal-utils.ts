import { isElvHubSlug, isElvInnerSlug } from "@/data/elv-product-media";
import { getSoftwarePageScope } from "@/data/software-page-scope";
import { softwareSubnavForFamily } from "@/data/software-subnav";
import { CONTACT_PRODUCTS, ELV_PRODUCTS } from "@shared/lib/contact-request";

const QUOTE_MODAL_LABELS = new Set(["Request a Quote", "Renew Subscription", "Get Your Quote Now"]);

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

const AUTODESK_QUOTE_PRODUCTS = CONTACT_PRODUCTS.filter((p) => p !== "Others");

const FAMILY_PRODUCT_LABEL: Record<string, string> = {
  elv: "ELV Product",
  adobe: "Adobe Product",
  microsoft: "Microsoft Product",
  autodesk: "Autodesk Product",
  "water-infrastructure": "Autodesk Product",
  multimedia: "Multimedia Product",
  oracle: "Oracle Product",
  edms: "EDMS Product",
  educational: "Educational Product",
  electrical: "Electrical Product",
  "cyber-security": "Cyber Security Product",
  antivirus: "Product",
  structural: "Structural Product",
  csi: "Structural Product",
  "quantity-takeoff": "Quantity Takeoff Product",
  "cubicost-group": "Product",
};

export type QuoteModalContext = {
  category: "software" | "elv";
  family: string;
  productLabel: string;
  products: string[];
  defaultProduct?: string;
};

export function shouldOpenQuoteModal(link: HTMLAnchorElement): boolean {
  if (link.closest(".aptus-quote-modal")) return false;

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

function productsForFamily(family: string): string[] {
  if (family === "elv") return [...ELV_PRODUCTS];
  // Prefer live subnav labels so product-page names (e.g. AutoCAD) match
  // and can be pre-selected / multi-selected.
  const links = softwareSubnavForFamily(
    family === "water-infrastructure" ? "autodesk" : family,
  );
  if (links?.length) {
    return [...new Set(links.map((link) => link.label))];
  }
  if (family === "autodesk" || family === "water-infrastructure") {
    return [...AUTODESK_QUOTE_PRODUCTS];
  }
  return [...AUTODESK_QUOTE_PRODUCTS];
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

function contextForFamily(family: string, slug?: string): QuoteModalContext {
  const products = productsForFamily(family);
  const defaultProduct = slug ? defaultProductForSlug(family, slug) : undefined;
  return {
    category: family === "elv" ? "elv" : "software",
    family,
    productLabel: FAMILY_PRODUCT_LABEL[family] ?? "Product",
    products,
    defaultProduct:
      defaultProduct && products.includes(defaultProduct) ? defaultProduct : undefined,
  };
}

/** Resolve quote catalog from the current page path. */
export function quoteContextFromPathname(pathname: string): QuoteModalContext {
  const slug = pathSlug(pathname);

  if (isElvHubSlug(slug) || isElvInnerSlug(slug)) {
    return contextForFamily("elv", slug);
  }

  const scope = getSoftwarePageScope(slug);
  let family =
    scope?.family && scope.family !== "software" && scope.family !== "software-solutions"
      ? scope.family
      : "autodesk";
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

  if (dataFamily) {
    return contextForFamily(dataFamily);
  }

  if (href.startsWith("/") && !href.startsWith("/#")) {
    return quoteContextFromPathname(href);
  }

  return quoteContextFromPathname(pathname);
}

// ponytail: self-check — fails if quote link / family catalog detection regresses
if (process.env.NODE_ENV === "development") {
  const mk = (href: string, text: string, family?: string) =>
    ({
      getAttribute: (name: string) => {
        if (name === "href") return href;
        if (name === "data-quote-family") return family ?? null;
        return null;
      },
      textContent: text,
      closest: () => null,
    }) as unknown as HTMLAnchorElement;

  console.assert(shouldOpenQuoteModal(mk("#form", "Request a Quote")) === true);
  console.assert(shouldOpenQuoteModal(mk("#Products", "Browse Products")) === false);

  const elv = quoteContextFromPathname("/thermal-scanners");
  console.assert(elv.category === "elv");
  console.assert(elv.defaultProduct === "Thermal Scanner Solutions");

  const adobe = quoteContextFromPathname("/adobe-business-creative-solutions");
  console.assert(adobe.family === "adobe");
  console.assert(adobe.products.includes("Adobe Photoshop"));

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
}
