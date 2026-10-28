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

/** Partner name linked into many2many "Website Enquiries" fields. */
export const WEBSITE_ENQUIRY_SOURCE_PARTNER_NAME = "Contact Form";

/**
 * Candidate Studio / custom field names for Enquiry Reference.
 * Production and staging have used different technical names for the same label.
 */
export const ENQUIRY_REF_FIELD_CANDIDATES = [
  "x_studio_x_enquiry_reference",
  "x_studio_enquiry_reference",
  "x_enquiry_reference",
] as const;

/**
 * Candidate char/text/selection fields labeled "Website Enquiry".
 */
export const ENQUIRY_SOURCE_CHAR_CANDIDATES = [
  "x_studio_x_website_enquiry",
  "x_studio_website_enquiry",
  "x_website_enquiry",
] as const;

/**
 * Candidate many2many fields labeled "Website Enquiries".
 */
export const ENQUIRY_SOURCE_M2M_CANDIDATES = [
  "x_studio_x_website_enquiries",
  "x_studio_website_enquiries",
  "x_website_enquiries",
] as const;

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
 * Studio field on res.partner for Website Enquiry source (char or many2many).
 * Older DBs used a many2many; newer Studio setups use a text/char field.
 */
export function enquirySourceField(): string {
  return (
    process.env.ODOO_ENQUIRY_SOURCE_FIELD?.trim() ||
    "x_studio_x_website_enquiry"
  );
}

/** Literal value written into char/text Website Enquiry fields. */
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

export type PartnerEnquiryFieldMap = {
  /** Char/text fields that store the ENQ-… reference. */
  refFields: string[];
  /** Char/text/selection fields that store "Contact Form". */
  sourceCharFields: string[];
  /** many2many(res.partner) fields that link the Contact Form partner. */
  sourceM2mFields: string[];
};

export type PartnerEnquiryValuesOptions = {
  refFields?: string[];
  /** res.partner.category ids to link (additive (4, id) commands). */
  categoryIds?: number[];
  /** Literal for char/text Website Enquiry fields. */
  websiteEnquirySourceValue?: string;
  /** Partner id to link into many2many Website Enquiries fields. */
  websiteEnquirySourcePartnerId?: number;
  sourceCharFields?: string[];
  sourceM2mFields?: string[];
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

function uniqueNames(names: Iterable<string>): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of names) {
    const name = raw.trim();
    if (!name || seen.has(name)) continue;
    seen.add(name);
    out.push(name);
  }
  return out;
}

/** Pure res.partner field map — unit-tested in enquiry.check.ts. */
export function buildPartnerEnquiryValues(
  input: EnquiryRequest,
  enquiryRef: string,
  options: PartnerEnquiryValuesOptions = {},
): Record<string, unknown> {
  const refs = uniqueNames(
    options.refFields?.length
      ? options.refFields
      : [enquiryReferenceField()],
  );

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
    comment: formatEnquiryPartnerNote(input, enquiryRef),
  };

  for (const field of refs) {
    values[field] = enquiryRef;
  }

  if (options.websiteEnquirySourceValue) {
    const charFields =
      options.sourceCharFields !== undefined
        ? uniqueNames(options.sourceCharFields)
        : [enquirySourceField()];
    for (const field of charFields) {
      values[field] = options.websiteEnquirySourceValue;
    }
  }

  if (
    options.websiteEnquirySourcePartnerId &&
    Number.isInteger(options.websiteEnquirySourcePartnerId) &&
    options.websiteEnquirySourcePartnerId > 0
  ) {
    for (const field of uniqueNames(options.sourceM2mFields ?? [])) {
      values[field] = [[4, options.websiteEnquirySourcePartnerId]];
    }
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

/**
 * Find/create the res.partner named "Contact Form" for many2many source fields.
 */
export async function resolveWebsiteEnquirySourcePartnerId(
  session: OdooRpcSession,
): Promise<number> {
  const { create, searchRead } = await import("./rpc");
  const existing = await searchRead<{ id: number }>(
    session,
    "res.partner",
    [["name", "=", WEBSITE_ENQUIRY_SOURCE_PARTNER_NAME]],
    { fields: ["id"], limit: 1 },
  );
  if (existing[0]?.id) return existing[0].id;

  const id = await create(session, "res.partner", {
    name: WEBSITE_ENQUIRY_SOURCE_PARTNER_NAME,
    company_type: "company",
    comment: "Website enquiry source marker (Contact Form).",
  });
  if (!id) {
    throw new Error(
      `Failed to create res.partner "${WEBSITE_ENQUIRY_SOURCE_PARTNER_NAME}"`,
    );
  }
  return id;
}

type IrModelFieldRow = {
  name: string;
  ttype: string;
  field_description: string;
  relation: string | false;
};

function matchesEnquiryRefLabel(label: string): boolean {
  return /enquir/i.test(label) && /ref/i.test(label);
}

function matchesWebsiteEnquiryLabel(label: string): boolean {
  return /^website enquir/i.test(label.trim());
}

/**
 * Discover which Studio/custom fields exist on this DB.
 * Writes every matching field so Contacts list columns populate regardless of
 * whether production used x_enquiry_reference or x_studio_x_enquiry_reference.
 */
export async function resolvePartnerEnquiryFields(
  session: OdooRpcSession,
): Promise<PartnerEnquiryFieldMap> {
  const { searchRead } = await import("./rpc");

  const envRef = process.env.ODOO_ENQUIRY_REF_FIELD?.trim();
  const envSource = process.env.ODOO_ENQUIRY_SOURCE_FIELD?.trim();

  const candidateNames = uniqueNames([
    ...(envRef ? [envRef] : []),
    ...(envSource ? [envSource] : []),
    ...ENQUIRY_REF_FIELD_CANDIDATES,
    ...ENQUIRY_SOURCE_CHAR_CANDIDATES,
    ...ENQUIRY_SOURCE_M2M_CANDIDATES,
  ]);

  const byName = await searchRead<IrModelFieldRow>(
    session,
    "ir.model.fields",
    [
      ["model", "=", "res.partner"],
      ["name", "in", candidateNames],
    ],
    { fields: ["name", "ttype", "field_description", "relation"], limit: 80 },
  );

  // Also catch Studio fields whose technical name is not in our candidate list
  // but whose label is what the Contacts list shows.
  const byLabel = await searchRead<IrModelFieldRow>(
    session,
    "ir.model.fields",
    [
      ["model", "=", "res.partner"],
      "|",
      ["field_description", "ilike", "enquiry ref"],
      ["field_description", "ilike", "website enquir"],
    ],
    { fields: ["name", "ttype", "field_description", "relation"], limit: 80 },
  );

  const rows = new Map<string, IrModelFieldRow>();
  for (const row of [...byName, ...byLabel]) {
    if (row?.name) rows.set(row.name, row);
  }

  const refFields: string[] = [];
  const sourceCharFields: string[] = [];
  const sourceM2mFields: string[] = [];

  for (const row of rows.values()) {
    const label = row.field_description || "";
    const isRefCandidate =
      ENQUIRY_REF_FIELD_CANDIDATES.includes(
        row.name as (typeof ENQUIRY_REF_FIELD_CANDIDATES)[number],
      ) ||
      row.name === envRef ||
      matchesEnquiryRefLabel(label);
    const isSourceCandidate =
      ENQUIRY_SOURCE_CHAR_CANDIDATES.includes(
        row.name as (typeof ENQUIRY_SOURCE_CHAR_CANDIDATES)[number],
      ) ||
      ENQUIRY_SOURCE_M2M_CANDIDATES.includes(
        row.name as (typeof ENQUIRY_SOURCE_M2M_CANDIDATES)[number],
      ) ||
      row.name === envSource ||
      matchesWebsiteEnquiryLabel(label);

    if (isRefCandidate && (row.ttype === "char" || row.ttype === "text")) {
      refFields.push(row.name);
      continue;
    }

    if (!isSourceCandidate) continue;

    if (
      row.ttype === "many2many" &&
      (!row.relation || row.relation === "res.partner")
    ) {
      sourceM2mFields.push(row.name);
      continue;
    }

    if (
      row.ttype === "char" ||
      row.ttype === "text" ||
      row.ttype === "selection"
    ) {
      sourceCharFields.push(row.name);
    }
  }

  // Env overrides always included when the field exists on the model.
  if (envRef && rows.has(envRef) && !refFields.includes(envRef)) {
    refFields.unshift(envRef);
  }
  if (envSource && rows.has(envSource)) {
    const row = rows.get(envSource)!;
    if (
      row.ttype === "many2many" &&
      !sourceM2mFields.includes(envSource)
    ) {
      sourceM2mFields.unshift(envSource);
    } else if (
      (row.ttype === "char" ||
        row.ttype === "text" ||
        row.ttype === "selection") &&
      !sourceCharFields.includes(envSource)
    ) {
      sourceCharFields.unshift(envSource);
    }
  }

  // Last-resort defaults when ir.model.fields search is empty (ACL).
  if (!refFields.length) refFields.push(enquiryReferenceField());
  if (!sourceCharFields.length && !sourceM2mFields.length) {
    sourceCharFields.push(enquirySourceField());
  }

  return {
    refFields: uniqueNames(refFields),
    sourceCharFields: uniqueNames(sourceCharFields),
    sourceM2mFields: uniqueNames(sourceM2mFields),
  };
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

async function writePartnerEnquiry(
  session: OdooRpcSession,
  partnerId: number | null,
  values: Record<string, unknown>,
): Promise<number> {
  const { create, write } = await import("./rpc");
  if (partnerId) {
    await write(session, "res.partner", partnerId, values);
    return partnerId;
  }
  const id = await create(session, "res.partner", values);
  if (!id) throw new Error("Odoo returned no res.partner id after create");
  return id;
}

/**
 * Create or update res.partner by email, storing enquiry reference + source.
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
    const { searchRead } = await import("./rpc");
    const email = input.email.trim();
    const categoryId = await resolveWebsiteEnquiryCategoryId(session);
    const fields = await resolvePartnerEnquiryFields(session);
    const sourceValue = enquirySourceValue();

    let sourcePartnerId: number | undefined;
    if (fields.sourceM2mFields.length) {
      sourcePartnerId = await resolveWebsiteEnquirySourcePartnerId(session);
    }

    console.info(
      `[enquiry] partner fields ref=[${fields.refFields.join(",")}] ` +
        `sourceChar=[${fields.sourceCharFields.join(",")}] ` +
        `sourceM2m=[${fields.sourceM2mFields.join(",")}]`,
    );

    const fullValues = buildPartnerEnquiryValues(input, ref, {
      refFields: fields.refFields,
      categoryIds: [categoryId],
      websiteEnquirySourceValue: sourceValue,
      websiteEnquirySourcePartnerId: sourcePartnerId,
      sourceCharFields: fields.sourceCharFields,
      sourceM2mFields: fields.sourceM2mFields,
    });
    const countryId = await resolveCountryId(session, input.country);
    if (countryId) fullValues.country_id = countryId;

    const noteHtml = formatEnquiryPartnerNote(input, ref);

    const existing = await searchRead<{ id: number }>(
      session,
      "res.partner",
      [["email", "=ilike", email]],
      { fields: ["id"], limit: 1 },
    );
    const existingId = existing[0]?.id ?? null;

    try {
      const partnerId = await writePartnerEnquiry(session, existingId, fullValues);
      await postEnquiryChatter(session, partnerId, noteHtml);
      return { partnerId, created: !existingId };
    } catch (err) {
      // Retry without source fields only — never drop enquiry reference fields.
      console.error(
        "[enquiry] partner write with source fields failed; retrying refs+tag only:",
        err instanceof Error ? err.message : err,
      );
      const fallback = buildPartnerEnquiryValues(input, ref, {
        refFields: fields.refFields,
        categoryIds: [categoryId],
      });
      if (countryId) fallback.country_id = countryId;
      const partnerId = await writePartnerEnquiry(session, existingId, fallback);
      await postEnquiryChatter(session, partnerId, noteHtml);
      return { partnerId, created: !existingId };
    }
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

export type BackfillWebsiteEnquiryResult = {
  scanned: number;
  updated: number;
  skipped: number;
  errors: Array<{ partnerId: number; error: string }>;
};

/**
 * Backfill Studio enquiry fields on existing website-created contacts.
 * Matches partners already tagged / noted / referenced as website enquiries.
 */
export async function backfillWebsiteEnquiryFields(options?: {
  limit?: number;
  dryRun?: boolean;
}): Promise<BackfillWebsiteEnquiryResult> {
  const limit = options?.limit ?? 500;
  const dryRun = options?.dryRun ?? false;

  return withAuthRetry(async (session) => {
    const { searchRead, write } = await import("./rpc");
    const fields = await resolvePartnerEnquiryFields(session);
    const categoryId = await resolveWebsiteEnquiryCategoryId(session);
    const sourceValue = enquirySourceValue();
    let sourcePartnerId: number | undefined;
    if (fields.sourceM2mFields.length) {
      sourcePartnerId = await resolveWebsiteEnquirySourcePartnerId(session);
    }

    const readFields = uniqueNames([
      "id",
      "name",
      "email",
      "ref",
      "comment",
      "category_id",
      ...fields.refFields,
      ...fields.sourceCharFields,
      ...fields.sourceM2mFields,
    ]);

    const partners = await searchRead<Record<string, unknown>>(
      session,
      "res.partner",
      [
        "|",
        "|",
        "|",
        ["ref", "=like", "ENQ-%"],
        ["comment", "ilike", "Website Contact Form"],
        ["category_id", "in", [categoryId]],
        ["name", "ilike", "PRODUCTION test"],
      ],
      { fields: readFields, limit, order: "id desc" },
    );

    const result: BackfillWebsiteEnquiryResult = {
      scanned: partners.length,
      updated: 0,
      skipped: 0,
      errors: [],
    };

    for (const partner of partners) {
      const partnerId = Number(partner.id);
      if (!Number.isInteger(partnerId) || partnerId <= 0) {
        result.skipped += 1;
        continue;
      }

      const values: Record<string, unknown> = {};
      const existingRef =
        (typeof partner.ref === "string" && partner.ref.startsWith("ENQ-")
          ? partner.ref.trim()
          : "") ||
        fields.refFields
          .map((f) => partner[f])
          .find((v): v is string => typeof v === "string" && v.startsWith("ENQ-")) ||
        "";

      let enquiryRef = existingRef;
      if (!enquiryRef) {
        try {
          enquiryRef = await nextWebsiteEnquiryRef();
        } catch (err) {
          result.errors.push({
            partnerId,
            error:
              err instanceof Error
                ? err.message
                : "failed to allocate enquiry reference",
          });
          continue;
        }
      }

      values.ref = enquiryRef;
      for (const field of fields.refFields) {
        const cur = partner[field];
        if (cur !== enquiryRef) values[field] = enquiryRef;
      }
      for (const field of fields.sourceCharFields) {
        if (partner[field] !== sourceValue) values[field] = sourceValue;
      }
      if (sourcePartnerId) {
        for (const field of fields.sourceM2mFields) {
          const cur = partner[field];
          const ids = Array.isArray(cur)
            ? cur.map((x) => (Array.isArray(x) ? Number(x[0]) : Number(x)))
            : [];
          if (!ids.includes(sourcePartnerId)) {
            values[field] = [[4, sourcePartnerId]];
          }
        }
      }

      const cats = Array.isArray(partner.category_id)
        ? partner.category_id.map((x) =>
            Array.isArray(x) ? Number(x[0]) : Number(x),
          )
        : [];
      if (!cats.includes(categoryId)) {
        values.category_id = [[4, categoryId]];
      }

      if (Object.keys(values).length === 0) {
        result.skipped += 1;
        continue;
      }

      if (dryRun) {
        result.updated += 1;
        continue;
      }

      try {
        await write(session, "res.partner", partnerId, values);
        result.updated += 1;
      } catch (err) {
        result.errors.push({
          partnerId,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return result;
  });
}
