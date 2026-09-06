import {
  COUNTRY_CALLING_CODES,
  DEFAULT_COUNTRY_CALLING_CODE,
  digitsOnly,
} from "./country-calling-codes";
import {
  isQuoteProfessionSelected,
} from "./quote-professions";
import {
  EMAIL_RE,
  MEANINGFUL_TEXT_RE,
  PERSON_NAME_RE,
  PHONE_RE,
  meaningfulTextError,
  parseObject,
  personNameError,
  type FieldErrors,
  type ObjectSchema,
  type ParseResult,
} from "./schema";

/** Autodesk product options from SoftwareQuoteForm (trimmed). */
export const CONTACT_PRODUCTS = [
  "AutoCAD - including specialized toolsets AD",
  "Civil 3D",
  "Architecture Engineering & Construction Collection IC",
  "AutoCAD LT",
  "Forma Design Collaboration CLOUD",
  "3ds Max",
  "Build - 550 CLOUD",
  "Docs CLOUD",
  "Forma Collaborate CLOUD",
  "BIM 360 Build - Packs CLOUD",
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
  "Forma Design Collaboration",
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
export type CustomerType = "individual" | "company";

export const PRODUCT_PLACEHOLDER = "Select Product";
export const LEGACY_PRODUCT_PLACEHOLDER = "Select Product";

/** Quote attachment limits (frontend + backend). */
export const QUOTE_ATTACHMENT_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".png",
  ".jpg",
  ".jpeg",
  ".zip",
] as const;
export const QUOTE_ATTACHMENT_ACCEPT = QUOTE_ATTACHMENT_EXTENSIONS.join(",");
export const MAX_QUOTE_ATTACHMENT_BYTES = 2 * 1024 * 1024; // 2 MB

export const PHONE_LOCAL_MAX_DIGITS = 10;
/** Tax ID (Odoo partner tax / vat field): alphanumeric, max length. */
export const TAX_ID_MAX_LENGTH = 12;
/** @deprecated alias — prefer TAX_ID_MAX_LENGTH */
export const VAT_ID_MAX_LENGTH = TAX_ID_MAX_LENGTH;
/** @deprecated alias — prefer TAX_ID_MAX_LENGTH */
export const VAT_ID_MAX_DIGITS = TAX_ID_MAX_LENGTH;
export const CR_NUMBER_MAX_DIGITS = 10;

/** Letters + digits only, capped length (Tax IDs). */
export function alphanumOnly(value: string, max = TAX_ID_MAX_LENGTH): string {
  return value.replace(/[^a-zA-Z0-9]/g, "").slice(0, max);
}

/** Prefer tax_id; accept legacy vat_id from older clients. */
function rawTaxId(raw: Record<string, FormDataEntryValue | string | undefined>): string {
  const tax = String(raw.tax_id ?? "").trim();
  if (tax) return tax;
  return String(raw.vat_id ?? "").trim();
}

export type ContactRequest = {
  /** Empty string = legacy ContactLeadForm / older clients. */
  customer_type: CustomerType | "";
  first_name: string;
  last_name: string;
  /** Contact person full name (Individual / Company quote forms). */
  name: string;
  email: string;
  company: string;
  /** Full E.164-style phone used by CRM/email (`+96891234567`). */
  phone: string;
  country_code: string;
  phone_local: string;
  product: string;
  qty: string;
  message: string;
  category: ContactCategory | "";
  profession: string;
  /** Maps to Odoo tax ID (res.partner vat). */
  tax_id: string;
  cr_number: string;
};

const legacyContactSchema: ObjectSchema<{
  first_name: string;
  last_name: string;
  email: string;
  company: string;
  phone: string;
  product: string;
  qty: string;
  message: string;
  category: ContactCategory | "";
}> = {
  fields: {
    first_name: {
      type: "string",
      required: true,
      min: 2,
      max: 100,
      pattern: PERSON_NAME_RE,
      patternMessage:
        "First name can only include letters, spaces, hyphens, and apostrophes.",
      label: "First name",
    },
    last_name: {
      type: "string",
      required: true,
      min: 2,
      max: 100,
      pattern: PERSON_NAME_RE,
      patternMessage:
        "Last name can only include letters, spaces, hyphens, and apostrophes.",
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
      pattern: MEANINGFUL_TEXT_RE,
      patternMessage: "Company must include letters or numbers.",
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
      label: "Product",
    },
    qty: {
      type: "string",
      required: true,
      min: 1,
      max: 10,
      pattern: /^[1-9]\d{0,9}$/,
      patternMessage: "Enter a quantity of 1 or more.",
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

const VALID_COUNTRY_CODES = new Set(
  COUNTRY_CALLING_CODES.map((c) => c.value),
);

function splitFullName(fullName: string): { first_name: string; last_name: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first_name: "", last_name: "" };
  if (parts.length === 1) return { first_name: parts[0], last_name: parts[0] };
  return {
    first_name: parts[0],
    last_name: parts.slice(1).join(" "),
  };
}

function isProductSelected(product: string): boolean {
  return parseSelectedProducts(product).length > 0;
}

/** Split multi-select product payload (comma-separated). */
export function parseSelectedProducts(product: string): string[] {
  return product
    .split(",")
    .map((s) => s.trim())
    .filter(
      (p) =>
        Boolean(p) &&
        p !== PRODUCT_PLACEHOLDER &&
        p !== LEGACY_PRODUCT_PLACEHOLDER,
    );
}

/** Client-side quote field checks for Individual / Company forms. */
export function validateQuoteContactFields(
  raw: Record<string, FormDataEntryValue | string | undefined>,
): FieldErrors {
  const str = (key: string) => String(raw[key] ?? "").trim();
  const errors: FieldErrors = {};
  const customerType = str("customer_type").toLowerCase();

  // Legacy SoftwareQuoteForm / ContactLeadForm shape.
  if (customerType !== "individual" && customerType !== "company") {
    const first = personNameError(str("first_name"), "First name");
    if (first) errors.first_name = first;

    const last = personNameError(str("last_name"), "Last name");
    if (last) errors.last_name = last;

    const email = str("email");
    if (!email) errors.email = "Please enter a valid email address.";
    else if (!EMAIL_RE.test(email))
      errors.email = "Please enter a valid email address.";

    const company = meaningfulTextError(str("company"), "Company");
    if (company) errors.company = company;

    const phone = str("phone");
    if (!phone) errors.phone = "Please enter a valid phone number.";
    else if (!PHONE_RE.test(phone))
      errors.phone = "Please enter a valid phone number.";

    const qty = str("qty");
    if (!qty) errors.qty = "Please enter a valid quantity.";
    else if (!/^[1-9]\d{0,9}$/.test(qty))
      errors.qty = "Please enter a valid quantity.";

    return errors;
  }

  const name = str("name");
  if (!name) errors.name = "Please enter your name.";
  else if (name.length < 2) errors.name = "Please enter your name.";
  else if (!/[\p{L}\p{N}]/u.test(name)) {
    errors.name = "Please enter your name.";
  }

  const countryCode = str("country_code") || DEFAULT_COUNTRY_CALLING_CODE;
  if (!VALID_COUNTRY_CODES.has(countryCode)) {
    errors.country_code = "Please select a country code.";
  }

  const phoneDigits = (str("phone_local") || str("phone")).replace(/\D/g, "");
  if (!phoneDigits) {
    errors.phone_local = "Please enter a valid phone number.";
  } else if (phoneDigits.length > PHONE_LOCAL_MAX_DIGITS) {
    errors.phone_local = "Phone number must contain a maximum of 10 digits.";
  } else if (phoneDigits.length < 6) {
    errors.phone_local = "Please enter a valid phone number.";
  }

  const product = str("product");
  if (!isProductSelected(product)) {
    errors.product = "Please select at least one software product.";
  }

  const qty = str("qty");
  if (!qty) errors.qty = "Please enter a valid quantity.";
  else if (!/^[1-9]\d{0,9}$/.test(qty))
    errors.qty = "Please enter a valid quantity.";

  if (customerType === "individual") {
    const email = str("email");
    if (!email) errors.email = "Please enter a valid email address.";
    else if (!EMAIL_RE.test(email))
      errors.email = "Please enter a valid email address.";

    const professionRaw = str("profession");
    if (!isQuoteProfessionSelected(professionRaw)) {
      errors.profession = "Please select your profession.";
    } else {
      const profession = meaningfulTextError(professionRaw, "Profession");
      if (profession) errors.profession = profession;
    }
  } else {
    const companyRaw = str("company");
    if (!companyRaw) errors.company = "Please enter your company name.";
    else {
      const company = meaningfulTextError(companyRaw, "Company Name");
      if (company) errors.company = company;
    }

    const cleanedTax = rawTaxId(raw).replace(/[^a-zA-Z0-9]/g, "");
    if (!cleanedTax) errors.tax_id = "Please enter a valid Tax ID.";
    else if (cleanedTax.length > TAX_ID_MAX_LENGTH) {
      errors.tax_id = "Tax ID must contain a maximum of 12 characters.";
    }

    const crDigits = str("cr_number").replace(/\D/g, "");
    if (!crDigits) errors.cr_number = "Please enter a valid CR Number.";
    else if (crDigits.length > CR_NUMBER_MAX_DIGITS) {
      errors.cr_number = "CR Number must contain a maximum of 10 digits.";
    } else if (!/^\d+$/.test(crDigits)) {
      errors.cr_number = "CR Number must contain digits only.";
    }
  }

  return errors;
}

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

function trimRaw(raw: Record<string, unknown>, k: string): string {
  return typeof raw[k] === "string" ? (raw[k] as string).trim() : "";
}

/** Normalize placeholder product before schema allowlist. */
function preprocessContactBody(input: unknown): unknown {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return input;
  }
  const raw = input as Record<string, unknown>;
  let customerTypeRaw = trimRaw(raw, "customer_type").toLowerCase();

  // Infer Individual/Company quote forms when customer_type was dropped in transit
  // (proxy/older clients) but new-form fields are present.
  if (customerTypeRaw !== "individual" && customerTypeRaw !== "company") {
    const looksLikeNewQuote =
      Boolean(trimRaw(raw, "phone_local")) ||
      Boolean(trimRaw(raw, "profession")) ||
      Boolean(trimRaw(raw, "tax_id")) ||
      Boolean(trimRaw(raw, "vat_id")) ||
      Boolean(trimRaw(raw, "cr_number")) ||
      (Boolean(trimRaw(raw, "name")) && !trimRaw(raw, "first_name"));
    if (looksLikeNewQuote) {
      customerTypeRaw =
        trimRaw(raw, "tax_id") ||
        trimRaw(raw, "vat_id") ||
        trimRaw(raw, "cr_number") ||
        (Boolean(trimRaw(raw, "company")) &&
          trimRaw(raw, "company") !== "Individual" &&
          !trimRaw(raw, "profession"))
          ? "company"
          : "individual";
    }
  }

  const customer_type: CustomerType | "" =
    customerTypeRaw === "individual" || customerTypeRaw === "company"
      ? customerTypeRaw
      : "";

  if (customer_type) {
    const name = trimRaw(raw, "name");
    const { first_name, last_name } = splitFullName(name);
    const country_code =
      trimRaw(raw, "country_code") || DEFAULT_COUNTRY_CALLING_CODE;
    const phone_local = digitsOnly(
      trimRaw(raw, "phone_local") || trimRaw(raw, "phone"),
      PHONE_LOCAL_MAX_DIGITS,
    );
    const phone = phone_local
      ? `${country_code}${phone_local}`
      : trimRaw(raw, "phone");

    let product = trimRaw(raw, "product");
    if (
      !product ||
      product === PRODUCT_PLACEHOLDER ||
      product === LEGACY_PRODUCT_PLACEHOLDER
    ) {
      product = "";
    }

    const qtyRaw = trimRaw(raw, "qty");
    const qty = /^[1-9]\d{0,9}$/.test(qtyRaw) ? qtyRaw : qtyRaw;

    const categoryRaw = trimRaw(raw, "category").toLowerCase();
    const category =
      categoryRaw === "elv" || categoryRaw === "software" ? categoryRaw : "";

    return {
      customer_type,
      name,
      first_name,
      last_name,
      email: customer_type === "individual" ? trimRaw(raw, "email") : trimRaw(raw, "email"),
      company:
        customer_type === "company"
          ? trimRaw(raw, "company")
          : "Individual",
      phone,
      country_code,
      phone_local,
      product: product || undefined,
      qty,
      message: trimRaw(raw, "message") || undefined,
      category: category || undefined,
      profession:
        customer_type === "individual" ? trimRaw(raw, "profession") : "",
      tax_id:
        customer_type === "company"
          ? alphanumOnly(
              trimRaw(raw, "tax_id") || trimRaw(raw, "vat_id"),
              TAX_ID_MAX_LENGTH,
            )
          : "",
      cr_number:
        customer_type === "company"
          ? digitsOnly(trimRaw(raw, "cr_number"), CR_NUMBER_MAX_DIGITS)
          : "",
    };
  }

  // CTA contact/simple forms send city/country/state/heard_from instead of
  // company/product — map into the quote schema so one API serves both.
  const city = trimRaw(raw, "city");
  const region = trimRaw(raw, "country") || trimRaw(raw, "state");
  const heard = trimRaw(raw, "heard_from");
  let company = trimRaw(raw, "company");
  if (!company) {
    company = [city, region].filter(Boolean).join(", ") || "Website inquiry";
  }

  // New quote fields may arrive without customer_type on older proxies — map them.
  const fullName = trimRaw(raw, "name");
  const split = fullName ? splitFullName(fullName) : null;
  const first_name = trimRaw(raw, "first_name") || split?.first_name || "";
  const last_name = trimRaw(raw, "last_name") || split?.last_name || "";
  const country_code =
    trimRaw(raw, "country_code") || DEFAULT_COUNTRY_CALLING_CODE;
  const phone_local = digitsOnly(trimRaw(raw, "phone_local"), PHONE_LOCAL_MAX_DIGITS);
  const phone =
    trimRaw(raw, "phone") ||
    (phone_local ? `${country_code}${phone_local}` : "");

  let product: string | undefined = trimRaw(raw, "product");
  if (
    !product ||
    product === LEGACY_PRODUCT_PLACEHOLDER ||
    product === PRODUCT_PLACEHOLDER
  ) {
    product = undefined;
  }
  if (product === undefined) product = "Others";

  const qtyRaw = trimRaw(raw, "qty");
  const qty = /^[1-9]\d{0,9}$/.test(qtyRaw)
    ? qtyRaw
    : !qtyRaw && product === "Others"
      ? "1"
      : qtyRaw || undefined;

  let message = trimRaw(raw, "message");
  if (heard) {
    message = [message, `Heard from: ${heard}`].filter(Boolean).join("\n");
  }
  if (!message) message = "";

  const categoryRaw = trimRaw(raw, "category").toLowerCase();
  const category =
    categoryRaw === "elv" || categoryRaw === "software" ? categoryRaw : "";

  return {
    customer_type: "",
    first_name: first_name || raw.first_name,
    last_name: last_name || raw.last_name,
    name: fullName,
    email: raw.email,
    company,
    phone: phone || raw.phone,
    country_code: "",
    phone_local: "",
    product,
    qty,
    message: message || undefined,
    category: category || undefined,
    profession: "",
    tax_id: "",
    cr_number: "",
  };
}

function validateTypedQuote(
  data: Record<string, string>,
): ParseResult<ContactRequest> {
  const errors = validateQuoteContactFields(data);
  if (Object.keys(errors).length) {
    return { ok: false, errors };
  }

  const customer_type = data.customer_type as CustomerType;
  const name = data.name.trim();
  const { first_name, last_name } = splitFullName(name);
  const country_code = data.country_code || DEFAULT_COUNTRY_CALLING_CODE;
  const phone_local = digitsOnly(data.phone_local, PHONE_LOCAL_MAX_DIGITS);
  const phone = `${country_code}${phone_local}`;
  const email =
    customer_type === "individual"
      ? data.email.trim().toLowerCase()
      : (data.email || "").trim().toLowerCase();

  return {
    ok: true,
    data: {
      customer_type,
      name,
      first_name,
      last_name,
      email,
      company:
        customer_type === "company" ? data.company.trim() : "Individual",
      phone,
      country_code,
      phone_local,
      product: data.product.trim(),
      qty: data.qty.trim(),
      message: (data.message || "").trim(),
      category:
        data.category === "elv" || data.category === "software"
          ? data.category
          : "",
      profession:
        customer_type === "individual" ? data.profession.trim() : "",
      tax_id:
        customer_type === "company"
          ? alphanumOnly(
              data.tax_id || data.vat_id || "",
              TAX_ID_MAX_LENGTH,
            )
          : "",
      cr_number:
        customer_type === "company"
          ? digitsOnly(data.cr_number, CR_NUMBER_MAX_DIGITS)
          : "",
    },
  };
}

export function parseContactRequest(input: unknown): ParseResult<ContactRequest> {
  const pre = preprocessContactBody(input);
  if (typeof pre !== "object" || pre === null || Array.isArray(pre)) {
    return { ok: false, errors: { _form: "Invalid request body." } };
  }
  const raw = pre as Record<string, string>;

  if (raw.customer_type === "individual" || raw.customer_type === "company") {
    return validateTypedQuote({
      customer_type: raw.customer_type,
      name: String(raw.name ?? ""),
      email: String(raw.email ?? ""),
      company: String(raw.company ?? ""),
      country_code: String(raw.country_code ?? ""),
      phone_local: String(raw.phone_local ?? ""),
      phone: String(raw.phone ?? ""),
      product: String(raw.product ?? ""),
      qty: String(raw.qty ?? ""),
      message: String(raw.message ?? ""),
      category: String(raw.category ?? ""),
      profession: String(raw.profession ?? ""),
      tax_id: String(raw.tax_id ?? raw.vat_id ?? ""),
      vat_id: String(raw.vat_id ?? raw.tax_id ?? ""),
      cr_number: String(raw.cr_number ?? ""),
    });
  }

  const parsed = parseObject(
    {
      first_name: raw.first_name,
      last_name: raw.last_name,
      email: raw.email,
      company: raw.company,
      phone: raw.phone,
      product: raw.product,
      qty: raw.qty,
      message: raw.message,
      category: raw.category,
    },
    legacyContactSchema,
  );
  if (!parsed.ok) return parsed;
  return {
    ok: true,
    data: {
      customer_type: "",
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name,
      name: [parsed.data.first_name, parsed.data.last_name]
        .filter(Boolean)
        .join(" "),
      email: parsed.data.email,
      company: parsed.data.company,
      phone: parsed.data.phone,
      country_code: "",
      phone_local: "",
      product: parsed.data.product ?? "",
      qty: parsed.data.qty ?? "",
      message: parsed.data.message ?? "",
      category: parsed.data.category ?? "",
      profession: "",
      tax_id: "",
      cr_number: "",
    },
  };
}

export function quoteAttachmentExtensionOk(filename: string): boolean {
  const lower = filename.toLowerCase();
  return QUOTE_ATTACHMENT_EXTENSIONS.some((ext) => lower.endsWith(ext));
}
