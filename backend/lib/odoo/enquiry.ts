/**
 * lib/odoo/enquiry.ts
 *
 * Contact Form → Odoo sequence + res.partner upsert.
 * Independent of Request Quote / crm.lead (see crm.ts).
 */
import type { EnquiryRequest } from "@shared/lib/enquiry-request";
import type { OdooRpcSession } from "./rpc";

/** Odoo ir.sequence code for Website Enquiry (already provisioned). */
export const WEBSITE_ENQUIRY_SEQUENCE = "website.enquiry";

/** Contacts tag used to filter website form partners in Odoo. */
export const WEBSITE_ENQUIRY_CATEGORY_NAME = "Website Enquiry";

/**
 * Studio field on res.partner (technical name is x_studio_x_enquiry_reference).
 * Override with ODOO_ENQUIRY_REF_FIELD if the DB uses a different name.
 */
export function enquiryReferenceField(): string {
  return (
    process.env.ODOO_ENQUIRY_REF_FIELD?.trim() || "x_studio_x_enquiry_reference"
  );
}

/**
 * Studio many2many field on res.partner that groups website enquiries.
 * Older DBs used a many2many; newer Studio setups use a text/char field.
 */
export function enquirySourceField(): string {
  return (
    process.env.ODOO_ENQUIRY_SOURCE_FIELD?.trim() ||
    "x_studio_x_website_enquiry"
  );
}

/** Literal value written into `enquirySourceField()` for Contact Form enquiries. */
export function enquirySourceValue(): string {
  return process.env.ODOO_ENQUIRY_SOURCE_VALUE?.trim() || "Contact Form";
}

/** Optional pin via ODOO_ENQUIRY_CATEGORY_ID; else resolve by name. */
export function enquiryCategoryIdFromEnv(): number | undefined {
  const n = Number(process.env.ODOO_ENQUIRY_CATEGORY_ID?.trim());
  return Number.isInteger(n) && n > 0 ? n : undefined;
}

export type PartnerEnquiryResult = {
  enquiryRef: string;
  partnerId: number;
  created: boolean;
};

export type PartnerEnquiryValuesOptions = {
  refField?: string;
  /** res.partner.category ids to link (additive (4, id) commands). */
  categoryIds?: number[];
  /**
   * Optional literal to write into the Studio "Website Enquiry" field.
   */
  websiteEnquirySourceValue?: string;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** HTML notes shown on the Contact (Notes + chatter). */
export function formatEnquiryPartnerNote(
  input: EnquiryRequest,
  enquiryRef: string,
): string {
  const rows: [string, string][] = [
    ["Enquiry Reference", enquiryRef],
    ["Name", [input.first_name, input.last_name].filter(Boolean).join(" ")],
    ["City", input.city],
    ["Country", input.country],
    ["Email", input.email],
    ["Phone", input.phone],
    ["How Did You Hear About Us", input.heard_from],
    ["Message", input.message],
    ["Source", "Website Contact Form"],
  ];
  return [
    "<p><strong>Website Contact Form enquiry</strong></p>",
    "<ul>",
    ...rows.map(
      ([label, value]) =>
        `<li><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value.trim())}</li>`,
    ),
    "</ul>",
  ].join("");
}

/** Pure res.partner field map — unit-tested in enquiry.check.ts. */
export function buildPartnerEnquiryValues(
  input: EnquiryRequest,
  enquiryRef: string,
  options: PartnerEnquiryValuesOptions = {},
): Record<string, unknown> {
  const refField = options.refField ?? enquiryReferenceField();
  const name = [input.first_name, input.last_name]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" ");

  const values: Record<string, unknown> = {
    name,
    email: input.email.trim(),
    phone: input.phone.trim(),
    city: input.city.trim(),
    // Standard Contacts “Reference” column — visible even if Studio field is hidden.
    ref: enquiryRef,
    [refField]: enquiryRef,
    comment: formatEnquiryPartnerNote(input, enquiryRef),
  };

  if (options.websiteEnquirySourceValue) {
    const field = enquirySourceField();
    values[field] = options.websiteEnquirySourceValue;
  }

  // (4, id) adds the tag without wiping existing partner categories.
  const categoryIds = (options.categoryIds ?? []).filter(
    (id) => Number.isInteger(id) && id > 0,
  );
  if (categoryIds.length) {
    values.category_id = categoryIds.map((id) => [4, id]);
  }

  return values;
}

async function withAuthRetry<T>(fn: (session: OdooRpcSession) => Promise<T>): Promise<T> {
  const {
    getOdooServiceSession,
    invalidateOdooServiceSession,
    isOdooConfigured,
  } = await import("./client");
  const { OdooRpcError } = await import("./rpc");

  if (!isOdooConfigured()) {
    throw new Error("Odoo is not configured");
  }

  try {
    return await fn(await getOdooServiceSession());
  } catch (err) {
    const unauthorized =
      err instanceof OdooRpcError &&
      (err.httpStatus === 401 || /access|denied|auth/i.test(err.message));
    if (!unauthorized) throw err;
    invalidateOdooServiceSession();
    return fn(await getOdooServiceSession());
  }
}

async function resolveCountryId(
  session: OdooRpcSession,
  country: string,
): Promise<number | undefined> {
  const name = country.trim();
  if (!name) return undefined;
  const { searchRead } = await import("./rpc");
  const byName = await searchRead<{ id: number }>(
    session,
    "res.country",
    [["name", "=ilike", name]],
    { fields: ["id"], limit: 1 },
  );
  if (byName[0]?.id) return byName[0].id;
  if (name.length <= 3) {
    const byCode = await searchRead<{ id: number }>(
      session,
      "res.country",
      [["code", "=ilike", name]],
      { fields: ["id"], limit: 1 },
    );
    if (byCode[0]?.id) return byCode[0].id;
  }
  return undefined;
}

/**
 * Resolve (or create) the "Website Enquiry" Contacts tag.
 * Prefer ODOO_ENQUIRY_CATEGORY_ID when set.
 */
export async function resolveWebsiteEnquiryCategoryId(
  session: OdooRpcSession,
): Promise<number> {
  const pinned = enquiryCategoryIdFromEnv();
  if (pinned) return pinned;

  const { create, searchRead } = await import("./rpc");
  const existing = await searchRead<{ id: number }>(
    session,
    "res.partner.category",
    [["name", "=", WEBSITE_ENQUIRY_CATEGORY_NAME]],
    { fields: ["id"], limit: 1 },
  );
  if (existing[0]?.id) return existing[0].id;

  const id = await create(session, "res.partner.category", {
    name: WEBSITE_ENQUIRY_CATEGORY_NAME,
  });
  if (!id) {
    throw new Error(
      `Failed to create res.partner.category "${WEBSITE_ENQUIRY_CATEGORY_NAME}"`,
    );
  }
  return id;
}

async function postEnquiryChatter(
  session: OdooRpcSession,
  partnerId: number,
  bodyHtml: string,
): Promise<void> {
  const { executeKw } = await import("./rpc");
  await executeKw(session, "res.partner", "message_post", [partnerId], {
    body: bodyHtml,
    message_type: "comment",
    subtype_xmlid: "mail.mt_note",
  });
}

/**
 * Next value from ir.sequence `website.enquiry`.
 * Throws when Odoo returns empty / falsy — never invent a JS fallback.
 */
export async function nextWebsiteEnquiryRef(): Promise<string> {
  return withAuthRetry(async (session) => {
    const { executeKw } = await import("./rpc");
    const raw = await executeKw<string | false | null>(
      session,
      "ir.sequence",
      "next_by_code",
      [WEBSITE_ENQUIRY_SEQUENCE],
    );
    const ref = typeof raw === "string" ? raw.trim() : "";
    if (!ref) {
      throw new Error(
        `Odoo sequence ${WEBSITE_ENQUIRY_SEQUENCE} returned an empty reference`,
      );
    }
    return ref;
  });
}

/**
 * Create or update res.partner by email, storing enquiry reference + tag.
 * Call only after a real sequence value is obtained.
 */
export async function upsertPartnerEnquiry(
  input: EnquiryRequest,
  enquiryRef: string,
): Promise<{ partnerId: number; created: boolean }> {
  const ref = enquiryRef.trim();
  if (!ref) {
    throw new Error("Cannot upsert partner without an enquiry reference");
  }

  return withAuthRetry(async (session) => {
    const { create, searchRead, write } = await import("./rpc");
    const email = input.email.trim();
    const categoryId = await resolveWebsiteEnquiryCategoryId(session);
    const sourceValue = enquirySourceValue();

    // Avoid breaking the whole sync if the Studio field type/name isn't writable.
    const valuesNoSource = buildPartnerEnquiryValues(input, ref, {
      categoryIds: [categoryId],
    });
    const valuesWithSource = buildPartnerEnquiryValues(input, ref, {
      categoryIds: [categoryId],
      websiteEnquirySourceValue: sourceValue,
    });
    const countryId = await resolveCountryId(session, input.country);

    const noteHtml = formatEnquiryPartnerNote(input, ref);

    const existing = await searchRead<{ id: number }>(
      session,
      "res.partner",
      [["email", "=ilike", email]],
      { fields: ["id"], limit: 1 },
    );

    if (existing[0]?.id) {
      const partnerId = existing[0].id;
      const values = valuesWithSource;
      if (countryId) values.country_id = countryId;
      try {
        await write(session, "res.partner", partnerId, values);
      } catch (err) {
        console.error(
          "[enquiry] write failed for website enquiry source field; retrying without it:",
          err instanceof Error ? err.message : err,
        );
        const fallback = valuesNoSource;
        if (countryId) fallback.country_id = countryId;
        await write(session, "res.partner", partnerId, fallback);
      }
      await postEnquiryChatter(session, partnerId, noteHtml);
      return { partnerId, created: false };
    }

    const createValues = valuesWithSource;
    if (countryId) createValues.country_id = countryId;
    let partnerId: number;
    try {
      partnerId = await create(session, "res.partner", createValues);
    } catch (err) {
      console.error(
        "[enquiry] create failed for website enquiry source field; retrying without it:",
        err instanceof Error ? err.message : err,
      );
      const fallback = valuesNoSource;
      if (countryId) fallback.country_id = countryId;
      partnerId = await create(session, "res.partner", fallback);
    }
    if (!partnerId) {
      throw new Error("Odoo returned no res.partner id after create");
    }
    await postEnquiryChatter(session, partnerId, noteHtml);
    return { partnerId, created: true };
  });
}

/**
 * Sequence → partner upsert. No partner write if sequence fails.
 */
export async function registerWebsiteEnquiry(
  input: EnquiryRequest,
): Promise<PartnerEnquiryResult> {
  const enquiryRef = await nextWebsiteEnquiryRef();
  const { partnerId, created } = await upsertPartnerEnquiry(input, enquiryRef);
  return { enquiryRef, partnerId, created };
}
