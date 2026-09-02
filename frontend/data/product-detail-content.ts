/**
 * Product detail tab content for the software catalog.
 * - 8 Autodesk portal products: rich hand-crafted copy in product-detail-autodesk-portal.ts
 * - Adobe + all other products: structured generic tabs from buildGenericProductContent()
 */

import {
  PORTAL_AUTODESK_DETAIL_CONTENT,
  PORTAL_AUTODESK_DETAIL_SLUGS,
} from "@/data/product-detail-autodesk-portal";

export type ProductDetailBlock =
  | { type: "p"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] };

export type ProductDetailContent = {
  overview: ProductDetailBlock[];
  keyFeatures: ProductDetailBlock[];
  whatsIncluded: ProductDetailBlock[];
  subscriptionLicensing: ProductDetailBlock[];
};

export const PORTAL_PRODUCT_NAMES = [
  "AutoCAD",
  "Civil 3D",
  "AEC Collection",
  "AutoCAD LT",
  "AutoCAD Revit LT Suite",
  "3ds Max",
  "Navisworks Manage",
  "Revit",
] as const;

export function buildProductContent(input: {
  overview: string;
  keyFeatures: string[];
  whatsIncluded: Array<[string, string, string]>;
  subscriptionLicensing: string[];
}): ProductDetailContent {
  const subscriptionRows = input.subscriptionLicensing.map((item) => {
    const splitAt = item.indexOf(": ");
    if (splitAt === -1) return [item, ""] as [string, string];
    return [item.slice(0, splitAt), item.slice(splitAt + 2)] as [string, string];
  });

  return {
    overview: [{ type: "p", text: input.overview }],
    keyFeatures: [{ type: "ul", items: input.keyFeatures }],
    whatsIncluded: [
      {
        type: "table",
        headers: ["Included Component", "Description", "Delivery Method"],
        rows: input.whatsIncluded,
      },
    ],
    subscriptionLicensing: [
      {
        type: "table",
        headers: ["Licensing Option", "Description"],
        rows: subscriptionRows,
      },
    ],
  };
}

function genericFeatureBullets(productName: string): string[] {
  const lower = productName.toLowerCase();
  if (lower.includes("autocad") || lower.includes("revit") || lower.includes("civil")) {
    return [
      "Professional design and documentation workflows",
      "Industry-specific toolsets and libraries",
      "Cloud collaboration and file sharing",
      "Automation, standards, and productivity tools",
    ];
  }
  if (lower.includes("adobe") || lower.includes("photoshop") || lower.includes("illustrator")) {
    return [
      "Creative production and editing tools",
      "Cloud libraries and asset management",
      "Team collaboration and review workflows",
      "Regular feature updates and security patches",
    ];
  }
  if (lower.includes("microsoft") || lower.includes("365") || lower.includes("visio") || lower.includes("power bi")) {
    return [
      "Business productivity and analytics",
      "Secure cloud sync across devices",
      "Enterprise-grade security and compliance",
      "Ongoing updates and publisher support",
    ];
  }
  if (lower.includes("security") || lower.includes("fortinet") || lower.includes("sophos") || lower.includes("kaspersky")) {
    return [
      "Threat protection and monitoring",
      "Centralized administration",
      "Policy-based access control",
      "Vendor updates and security intelligence",
    ];
  }
  return [
    "Genuine commercial licensing",
    "Publisher-backed support options",
    "Implementation and renewal assistance from Aptus",
    "Flexible subscription or perpetual terms where available",
  ];
}

export function buildGenericProductContent(
  productName: string,
  brandLabel: string,
  description?: string,
): ProductDetailContent {
  return buildProductContent({
    overview:
      description ??
      `${productName} from ${brandLabel} is available through Aptus Infotech with genuine licensing, expert guidance, and local support in Oman. We help you choose the right edition, deploy seats, and manage renewals so your team stays productive.`,
    keyFeatures: genericFeatureBullets(productName),
    whatsIncluded: [
      [
        "Software license",
        `Authorized ${productName} license or subscription as quoted for your organization.`,
        "Electronic delivery (ELD)",
      ],
      [
        "Publisher support",
        "Access to vendor support and updates according to your license agreement.",
        "Vendor portal",
      ],
      [
        "Aptus account management",
        "Dedicated Aptus team for quoting, provisioning, renewals, and billing.",
        "Aptus customer portal",
      ],
    ],
    subscriptionLicensing: [
      "Commercial New: For organizations adding new seats or starting a new agreement.",
      "Renewal Subscription: Extend an active contract to avoid interruption of service.",
      "Term options: Annual (12-month) and multi-year agreements where offered by the publisher.",
      "Delivery: Licenses are provisioned electronically through Aptus with setup guidance as needed.",
    ],
  });
}

const NAME_ALIASES: Record<string, string> = {
  autocad: "autocad",
  "civil 3d": "civil-3d",
  "aec collection": "aec-collection",
  "autocad lt": "autocad-lt",
  "autocad revit lt suite": "autocad-revit-lt-suite",
  "3ds max": "3ds-max",
  navisworks: "navisworks",
  "navisworks manage": "navisworks",
  revit: "revit",
  "oracle primavera p6": "oracle-primavera-p6",
  "power bi": "power-bi",
  "power bi pro": "power-bi",
  "microsoft visio": "microsoft-visio",
  "microsoft 365 business": "microsoft-365-business",
  "microsoft 365 business standard": "microsoft-365-business",
  "forma design collaboration": "bim-collaborate-pro",
  "bim collaborate pro": "bim-collaborate-pro",
};

function normalizeName(label: string): string {
  return label.trim().toLowerCase().replace(/^\([^)]*\)\s*/, "");
}

function slugify(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function resolveSlug(productName: string, slug?: string): string {
  return slug ?? NAME_ALIASES[normalizeName(productName)] ?? slugify(productName);
}

export function getProductDetailContent(
  productName: string,
  fallback?: { brandLabel: string; description?: string; slug?: string },
): ProductDetailContent {
  const slug = resolveSlug(productName, fallback?.slug);

  if (PORTAL_AUTODESK_DETAIL_SLUGS.has(slug)) {
    return PORTAL_AUTODESK_DETAIL_CONTENT[slug]!;
  }

  return buildGenericProductContent(
    productName,
    fallback?.brandLabel ?? "Software",
    fallback?.description,
  );
}

export function productDetailContentKeys(): string[] {
  return [...PORTAL_AUTODESK_DETAIL_SLUGS];
}
