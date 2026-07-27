import {
  EMAIL_RE,
  PHONE_RE,
  parseObject,
  type ObjectSchema,
  type ParseResult,
} from "./schema";

/** Autodesk product options from SoftwareQuoteForm (trimmed). */
export const CONTACT_PRODUCTS = [
  "AutoCAD - including specialized toolsets AD",
  "Civil 3D",
  "Architecture Engineering & Construction Collection IC",
  "AutoCAD LT",
  "BIM Collaborate Pro CLOUD",
  "3ds Max",
  "Build - 550 CLOUD",
  "Docs CLOUD",
  "BIM Collaborate CLOUD",
  "BIM 360 Build - Packs CLOUD",
  "InfraWorks",
  "Navisworks Manage",
  "Revit",
  "InfoWater Pro",
  "Others",
] as const;

/** Extra software names used as hidden product fields on product pages. */
export const EXTRA_SOFTWARE_PRODUCTS = [
  "AutoCAD",
  "Autodesk AEC Collection",
  "Autodesk Build",
  "Autodesk Docs",
  "Autodesk Takeoff",
  "Autodesk BIM Collaborate Pro",
  "Autodesk Civil 3D",
  "Autodesk InfoDrainage",
  "Autodesk InfoWater Pro",
  "Autodesk InfoWorks ICM",
  "Autodesk InfoWorks WS Pro",
  "Autodesk Revit",
  "Navisworks",
  "Adobe",
  "Adobe Creative Cloud",
] as const;

/** ELV product page names (hidden product field). */
export const ELV_PRODUCTS = [
  "Access Control Systems",
  "Audio Video Solutions",
  "CCTV Surveillance Solutions",
  "Conference Room Solutions",
  "Data Center Solutions",
  "Gate Automation Solutions",
  "Guestroom Management System",
  "Smart Home Solutions",
  "Network & Structured Cabling Solutions",
  "Nurse Calling System",
  "Queue Management Solutions",
  "SMATV/IPTV Solutions",
  "Switching and Routing",
  "Telephone Systems",
  "Thermal Scanner Solutions",
  "Uninterruptible Power Supply - UPS",
  "ELV Solutions",
] as const;

export const ALL_CONTACT_PRODUCTS = [
  ...CONTACT_PRODUCTS,
  ...EXTRA_SOFTWARE_PRODUCTS,
  ...ELV_PRODUCTS,
] as const;

export type ContactCategory = "software" | "elv";

export type ContactRequest = {
  first_name: string;
  last_name: string;
  email: string;
  company: string;
  phone: string;
  product: string;
  qty: string;
  message: string;
  category: ContactCategory | "";
};

const contactSchema: ObjectSchema<ContactRequest> = {
  fields: {
    first_name: {
      type: "string",
      required: true,
      min: 1,
      max: 100,
      label: "First name",
    },
    last_name: {
      type: "string",
      required: true,
      min: 1,
      max: 100,
      label: "Last name",
    },
    email: {
      type: "string",
      required: true,
      max: 254,
      sanitize: "email",
      pattern: EMAIL_RE,
      patternMessage: "Enter a valid email address.",
      label: "Email",
    },
    company: {
      type: "string",
      required: true,
      min: 1,
      max: 200,
      label: "Company",
    },
    phone: {
      type: "string",
      required: true,
      max: 30,
      pattern: PHONE_RE,
      patternMessage: "Enter a valid phone number.",
      label: "Phone",
    },
    product: {
      type: "string",
      required: false,
      max: 200,
      // ponytail: no allowlist — quote modal catalogs differ by family (Adobe/Autodesk/ELV/…)
      label: "Product",
    },
    qty: {
      type: "string",
      required: false,
      max: 10,
      pattern: /^\d{1,10}$/,
      patternMessage: "Enter a valid quantity.",
      label: "QTY",
    },
    message: {
      type: "string",
      required: false,
      max: 5000,
      sanitize: "multiline",
      label: "Message",
    },
    category: {
      type: "string",
      required: false,
      max: 20,
      allow: ["software", "elv", ""],
      label: "Category",
    },
  },
};

const ELV_KEYWORDS = [
  "cctv",
  "access control",
  "elv",
  "gate automation",
  "nurse call",
  "smatv",
  "iptv",
  "ups",
  "structured cabling",
  "home automation",
  "thermal scanner",
  "queue management",
  "telephone system",
  "data center",
  "conference room",
  "audio video",
  "switching and routing",
];

const SOFTWARE_KEYWORDS = [
  "autodesk",
  "adobe",
  "revit",
  "autocad",
  "navisworks",
  "civil 3d",
  "3ds max",
  "bim",
  "infowater",
  "infoworks",
  "infodrainage",
];

function inCatalog(product: string, catalog: readonly string[]): boolean {
  const lower = product.toLowerCase();
  return catalog.some((entry) => entry.toLowerCase() === lower);
}

function hasKeyword(product: string, keywords: readonly string[]): boolean {
  const lower = product.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

/**
 * Resolve software vs ELV from an explicit hidden-field hint, else catalog /
 * keyword match on the product name. Defaults to software.
 */
export function detectContactCategory(
  product: string,
  categoryHint?: string | null,
): ContactCategory {
  const hint = (categoryHint ?? "").trim().toLowerCase();
  if (hint === "elv" || hint === "software") return hint;

  const name = product.trim();
  if (!name || name === "Others") return "software";

  if (inCatalog(name, ELV_PRODUCTS) || hasKeyword(name, ELV_KEYWORDS)) return "elv";
  if (
    inCatalog(name, CONTACT_PRODUCTS) ||
    inCatalog(name, EXTRA_SOFTWARE_PRODUCTS) ||
    hasKeyword(name, SOFTWARE_KEYWORDS)
  ) {
    return "software";
  }

  return "software";
}

/** Normalize placeholder product before schema allowlist. */
function preprocessContactBody(input: unknown): unknown {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return input;
  }
  const raw = input as Record<string, unknown>;
  const trim = (k: string) =>
    typeof raw[k] === "string" ? (raw[k] as string).trim() : "";

  // CTA contact/simple forms send city/country/state/heard_from instead of
  // company/product — map into the quote schema so one API serves both.
  const city = trim("city");
  const region = trim("country") || trim("state");
  const heard = trim("heard_from");
  let company = trim("company");
  if (!company) {
    company = [city, region].filter(Boolean).join(", ") || "Website inquiry";
  }

  let product: string | undefined = trim("product");
  if (!product || product === "Select Product") product = undefined;
  // Contact/simple CTAs omit product; quote form may leave the placeholder.
  // Default so allowlist + inbound mail subject stay consistent.
  if (product === undefined) product = "Others";

  const qtyRaw = trim("qty");
  const qty = /^\d{1,10}$/.test(qtyRaw) ? qtyRaw : undefined;

  let message = trim("message");
  if (heard) {
    message = [message, `Heard from: ${heard}`].filter(Boolean).join("\n");
  }
  if (!message) message = "";

  const categoryRaw = trim("category").toLowerCase();
  const category =
    categoryRaw === "elv" || categoryRaw === "software" ? categoryRaw : "";

  // Drop unknown keys (city/country/…) before rejectUnknown parse.
  return {
    first_name: raw.first_name,
    last_name: raw.last_name,
    email: raw.email,
    company,
    phone: raw.phone,
    product,
    qty,
    message: message || undefined,
    category: category || undefined,
  };
}

export function parseContactRequest(input: unknown): ParseResult<ContactRequest> {
  const parsed = parseObject(preprocessContactBody(input), contactSchema);
  if (!parsed.ok) return parsed;
  // Optional product/message/category/qty default to empty for callers.
  return {
    ok: true,
    data: {
      ...parsed.data,
      product: parsed.data.product ?? "",
      qty: parsed.data.qty ?? "",
      message: parsed.data.message ?? "",
      category: parsed.data.category ?? "",
    },
  };
}
