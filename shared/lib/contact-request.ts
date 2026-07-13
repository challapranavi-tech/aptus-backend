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

export type ContactRequest = {
  first_name: string;
  last_name: string;
  email: string;
  company: string;
  phone: string;
  product: string;
  message: string;
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
      allow: CONTACT_PRODUCTS,
      label: "Product",
    },
    message: {
      type: "string",
      required: false,
      max: 5000,
      sanitize: "multiline",
      label: "Message",
    },
  },
};

/** Normalize placeholder product before schema allowlist. */
function preprocessContactBody(input: unknown): unknown {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return input;
  }
  const body = { ...(input as Record<string, unknown>) };
  if (typeof body.product === "string") {
    const p = body.product.trim();
    body.product = p === "Select Product" || p === "" ? undefined : p;
  }
  if (typeof body.message === "string" && !body.message.trim()) {
    body.message = undefined;
  }
  return body;
}

export function parseContactRequest(input: unknown): ParseResult<ContactRequest> {
  const parsed = parseObject(preprocessContactBody(input), contactSchema);
  if (!parsed.ok) return parsed;
  // Optional product/message default to empty for callers.
  return {
    ok: true,
    data: {
      ...parsed.data,
      product: parsed.data.product ?? "",
      message: parsed.data.message ?? "",
    },
  };
}
