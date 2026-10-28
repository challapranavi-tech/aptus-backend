import {
  parseQuery,
  sanitizeText,
  type ObjectSchema,
  type ParseResult,
} from "./schema";

export const ODOO_DEBUG_MODELS = [
  "status",
  "version",
  "pages",
  "menus",
  "view",
] as const;

export type OdooDebugModel = (typeof ODOO_DEBUG_MODELS)[number];

export type OdooDebugQuery = {
  model: OdooDebugModel;
  id?: number;
};

const odooQuerySchema: ObjectSchema<{
  model?: string;
  id?: string;
}> = {
  fields: {
    model: {
      type: "string",
      required: false,
      max: 32,
      allow: ODOO_DEBUG_MODELS,
      label: "Model",
    },
    id: {
      type: "string",
      required: false,
      max: 16,
      pattern: /^\d+$/,
      patternMessage: "id must be a positive integer.",
      label: "id",
    },
  },
};

export function parseOdooDebugQuery(
  params: URLSearchParams,
): ParseResult<OdooDebugQuery> {
  const parsed = parseQuery(params, odooQuerySchema);
  if (!parsed.ok) return parsed;

  const model = (parsed.data.model ?? "status") as OdooDebugModel;
  const id =
    parsed.data.id !== undefined ? Number(parsed.data.id) : undefined;

  if (model === "view" && (id === undefined || !Number.isInteger(id) || id < 1)) {
    return {
      ok: false,
      errors: { id: "Pass a positive integer id when model=view." },
    };
  }

  return {
    ok: true,
    data: {
      model,
      ...(id !== undefined ? { id } : {}),
    },
  };
}

/**
 * Validate debug token from X-Debug-Token header only.
 * security: never accept secrets via query string (logs / Referer).
 */
export function parseDebugTokenHeader(
  value: string | null,
): ParseResult<{ token?: string }> {
  if (value === null || value === undefined || value === "") {
    return { ok: true, data: {} };
  }
  if (typeof value !== "string") {
    return { ok: false, errors: { "x-debug-token": "Invalid token header." } };
  }
  const token = sanitizeText(value, "singleLine");
  if (!token || token.length > 512) {
    return { ok: false, errors: { "x-debug-token": "Invalid token header." } };
  }
  return { ok: true, data: { token } };
}
