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

/** How-did-you-hear options used on Contact Us (career + default selects). */
export const ENQUIRY_HEARD_FROM = [
  "Media",
  "Referals",
  "Referrals",
  "Social Media",
  "Events",
  "Search Engine",
  "LinkedIn",
  "Other",
] as const;

export type EnquiryRequest = {
  first_name: string;
  last_name: string;
  city: string;
  country: string;
  email: string;
  phone: string;
  heard_from: string;
  message: string;
};

const enquirySchema: ObjectSchema<EnquiryRequest> = {
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
    city: {
      type: "string",
      required: true,
      min: 1,
      max: 100,
      pattern: MEANINGFUL_TEXT_RE,
      patternMessage: "City must include letters or numbers.",
      label: "City",
    },
    country: {
      type: "string",
      required: true,
      min: 1,
      max: 100,
      pattern: MEANINGFUL_TEXT_RE,
      patternMessage: "Country must include letters or numbers.",
      label: "Country",
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
    phone: {
      type: "string",
      required: true,
      max: 30,
      pattern: PHONE_RE,
      patternMessage: "Enter a valid phone number.",
      label: "Phone",
    },
    heard_from: {
      type: "string",
      required: true,
      max: 50,
      allow: [...ENQUIRY_HEARD_FROM],
      label: "How did you hear about us",
    },
    message: {
      type: "string",
      required: true,
      min: 1,
      max: 5000,
      sanitize: "multiline",
      label: "Message",
    },
  },
};

/** Map contact-form aliases (state → country); drop unknown keys. */
function preprocessEnquiryBody(input: unknown): unknown {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return input;
  }
  const raw = input as Record<string, unknown>;
  const trim = (k: string) =>
    typeof raw[k] === "string" ? (raw[k] as string).trim() : "";

  return {
    first_name: raw.first_name,
    last_name: raw.last_name,
    city: raw.city,
    country: trim("country") || trim("state") || raw.country,
    email: raw.email,
    phone: raw.phone,
    heard_from: raw.heard_from,
    message: raw.message,
  };
}

export function parseEnquiryRequest(
  input: unknown,
): ParseResult<EnquiryRequest> {
  return parseObject(preprocessEnquiryBody(input), enquirySchema);
}

/** Client-side Contact Form checks (matches /api/enquiry rules). */
export function validateEnquiryFields(
  raw: Record<string, FormDataEntryValue | string | undefined>,
): FieldErrors {
  const str = (key: string) => String(raw[key] ?? "").trim();
  const errors: FieldErrors = {};

  const first = personNameError(str("first_name"), "First name");
  if (first) errors.first_name = first;

  const last = personNameError(str("last_name"), "Last name");
  if (last) errors.last_name = last;

  const city = meaningfulTextError(str("city"), "City");
  if (city) errors.city = city;

  const countryVal = str("country") || str("state");
  const country = meaningfulTextError(countryVal, "Country");
  if (country) {
    // Highlight whichever field the form actually renders.
    if (str("state") && !str("country")) errors.state = country;
    else errors.country = country;
  }

  const email = str("email");
  if (!email) errors.email = "Email is required.";
  else if (!EMAIL_RE.test(email)) errors.email = "Enter a valid email address.";

  const phone = str("phone");
  if (!phone) errors.phone = "Phone is required.";
  else if (!PHONE_RE.test(phone)) errors.phone = "Enter a valid phone number.";

  const message = str("message");
  if (!message) errors.message = "Message is required.";

  const heard = str("heard_from");
  if (!heard) errors.heard_from = "Please select how you heard about us.";
  else if (
    !(ENQUIRY_HEARD_FROM as readonly string[]).includes(heard)
  ) {
    errors.heard_from = "How did you hear about us is not an allowed value.";
  }

  return errors;
}
