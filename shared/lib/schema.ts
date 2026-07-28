/**
 * Tiny schema validator for API trust boundaries.
 * Rejects unknown fields by default; returns sanitized values on success.
 */

export type FieldErrors = Record<string, string>;

export type ParseOk<T> = { ok: true; data: T };
export type ParseFail = { ok: false; errors: FieldErrors };
export type ParseResult<T> = ParseOk<T> | ParseFail;

export type StringRules = {
  type: "string";
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  patternMessage?: string;
  /** Exact allowlist (after sanitize). */
  allow?: readonly string[];
  /** Default: singleLine. */
  sanitize?: "singleLine" | "multiline" | "email" | "none";
  label?: string;
};

export type BooleanRules = {
  type: "boolean";
  required?: boolean;
  label?: string;
};

export type NumberRules = {
  type: "number";
  required?: boolean;
  int?: boolean;
  min?: number;
  max?: number;
  label?: string;
};

export type StringArrayRules = {
  type: "stringArray";
  required?: boolean;
  maxItems?: number;
  item: Omit<StringRules, "type" | "required">;
  label?: string;
};

export type FieldRules =
  | StringRules
  | BooleanRules
  | NumberRules
  | StringArrayRules;

export type ObjectSchema<T extends Record<string, unknown>> = {
  fields: { [K in keyof T]-?: FieldRules };
  /** When false, unknown keys are ignored. Default true. */
  rejectUnknown?: boolean;
};

function labelOf(key: string, rules: { label?: string }): string {
  return rules.label ?? key;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Strip C0 controls except tab/LF/CR; normalize newlines for multiline. */
export function sanitizeText(
  value: string,
  mode: "singleLine" | "multiline" | "email" | "none" = "singleLine",
): string {
  if (mode === "none") return value;
  let s = value.replace(/\0/g, "");
  if (mode === "multiline") {
    s = s.replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
    s = s.replace(/\r\n?/g, "\n").trim();
    return s;
  }
  // singleLine / email: no CR/LF (header injection)
  s = s.replace(/[\u0000-\u001F\u007F]/g, "").trim();
  if (mode === "email") s = s.toLowerCase();
  return s;
}

export function sanitizeFilename(name: string): string {
  const base = name
    .replace(/^.*[/\\]/, "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/[^\w.\- ()[\]]+/g, "_")
    .slice(0, 180)
    .trim();
  return base || "upload.bin";
}

/**
 * Intermediate extensions that must never appear before an allowlisted final
 * extension (blocks malware.exe.pdf / photo.svg.jpg style compound names).
 */
const COMPOUND_DANGEROUS_EXT =
  /\.(?:exe|bat|cmd|com|scr|dll|msi|js|mjs|cjs|vbs|ps1|sh|php|asp|aspx|jsp|html?|svg|jar|pif|hta|wsf|cpl)$/i;

/** True when the final extension is allowlisted and no dangerous mid-extension is present. */
export function hasAllowedExtension(
  fileName: string,
  allowed: readonly string[],
): boolean {
  const lower = fileName.toLowerCase();
  const matched = allowed.find((ext) => lower.endsWith(ext.toLowerCase()));
  if (!matched) return false;
  const stem = lower.slice(0, -matched.length);
  return !COMPOUND_DANGEROUS_EXT.test(stem);
}

function parseString(
  key: string,
  raw: unknown,
  rules: StringRules,
  errors: FieldErrors,
): string | undefined {
  const label = labelOf(key, rules);
  if (raw === undefined || raw === null) {
    if (rules.required) errors[key] = `${label} is required.`;
    return undefined;
  }
  if (typeof raw !== "string") {
    errors[key] = `${label} must be a string.`;
    return undefined;
  }

  const mode = rules.sanitize ?? "singleLine";
  const value = sanitizeText(raw, mode);

  if (rules.required && !value) {
    errors[key] = `${label} is required.`;
    return undefined;
  }
  if (!value && !rules.required) return "";

  if (rules.min !== undefined && value.length < rules.min) {
    errors[key] = `${label} must be at least ${rules.min} characters.`;
    return undefined;
  }
  if (rules.max !== undefined && value.length > rules.max) {
    errors[key] = `${label} must be at most ${rules.max} characters.`;
    return undefined;
  }
  if (rules.allow && !rules.allow.includes(value)) {
    errors[key] = `${label} is not an allowed value.`;
    return undefined;
  }
  if (rules.pattern && !rules.pattern.test(value)) {
    errors[key] = rules.patternMessage ?? `${label} has an invalid format.`;
    return undefined;
  }
  return value;
}

function parseBoolean(
  key: string,
  raw: unknown,
  rules: BooleanRules,
  errors: FieldErrors,
): boolean | undefined {
  const label = labelOf(key, rules);
  if (raw === undefined || raw === null) {
    if (rules.required) errors[key] = `${label} is required.`;
    return undefined;
  }
  if (typeof raw !== "boolean") {
    errors[key] = `${label} must be a boolean.`;
    return undefined;
  }
  return raw;
}

function parseNumber(
  key: string,
  raw: unknown,
  rules: NumberRules,
  errors: FieldErrors,
): number | undefined {
  const label = labelOf(key, rules);
  if (raw === undefined || raw === null || raw === "") {
    if (rules.required) errors[key] = `${label} is required.`;
    return undefined;
  }
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) {
    errors[key] = `${label} must be a number.`;
    return undefined;
  }
  if (rules.int && !Number.isInteger(n)) {
    errors[key] = `${label} must be an integer.`;
    return undefined;
  }
  if (rules.min !== undefined && n < rules.min) {
    errors[key] = `${label} must be at least ${rules.min}.`;
    return undefined;
  }
  if (rules.max !== undefined && n > rules.max) {
    errors[key] = `${label} must be at most ${rules.max}.`;
    return undefined;
  }
  return n;
}

function parseStringArray(
  key: string,
  raw: unknown,
  rules: StringArrayRules,
  errors: FieldErrors,
): string[] | undefined {
  const label = labelOf(key, rules);
  if (raw === undefined || raw === null) {
    if (rules.required) errors[key] = `${label} is required.`;
    return undefined;
  }
  if (!Array.isArray(raw)) {
    errors[key] = `${label} must be an array.`;
    return undefined;
  }
  if (rules.maxItems !== undefined && raw.length > rules.maxItems) {
    errors[key] = `${label} must have at most ${rules.maxItems} items.`;
    return undefined;
  }
  const out: string[] = [];
  for (let i = 0; i < raw.length; i++) {
    const itemErrors: FieldErrors = {};
    const item = parseString(
      `${key}[${i}]`,
      raw[i],
      { type: "string", required: true, ...rules.item },
      itemErrors,
    );
    if (itemErrors[`${key}[${i}]`]) {
      errors[key] = itemErrors[`${key}[${i}]`]!;
      return undefined;
    }
    if (item !== undefined) out.push(item);
  }
  return out;
}

/** Parse and sanitize a plain object against a schema. */
export function parseObject<T extends Record<string, unknown>>(
  input: unknown,
  schema: ObjectSchema<T>,
): ParseResult<T> {
  if (!isPlainObject(input)) {
    return { ok: false, errors: { _form: "Request body must be a JSON object." } };
  }

  const rejectUnknown = schema.rejectUnknown !== false;
  const allowed = new Set(Object.keys(schema.fields));
  const errors: FieldErrors = {};

  if (rejectUnknown) {
    for (const key of Object.keys(input)) {
      if (!allowed.has(key)) {
        errors[key] = "Unexpected field.";
      }
    }
  }

  const data: Record<string, unknown> = {};
  for (const key of Object.keys(schema.fields) as Array<keyof T & string>) {
    const rules = schema.fields[key];
    const raw = input[key];
    if (rules.type === "string") {
      const v = parseString(key, raw, rules, errors);
      if (v !== undefined) data[key] = v;
      else if (!rules.required && (raw === undefined || raw === null)) {
        /* omit optional missing */
      } else if (!rules.required && typeof raw === "string") {
        data[key] = "";
      }
    } else if (rules.type === "boolean") {
      const v = parseBoolean(key, raw, rules, errors);
      if (v !== undefined) data[key] = v;
    } else if (rules.type === "number") {
      const v = parseNumber(key, raw, rules, errors);
      if (v !== undefined) data[key] = v;
    } else if (rules.type === "stringArray") {
      const v = parseStringArray(key, raw, rules, errors);
      if (v !== undefined) data[key] = v;
    }
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, data: data as T };
}

/** Parse URLSearchParams / query object; only listed keys allowed. */
export function parseQuery<T extends Record<string, unknown>>(
  params: URLSearchParams | Record<string, string | undefined>,
  schema: ObjectSchema<T>,
): ParseResult<T> {
  const obj: Record<string, unknown> = {};
  if (params instanceof URLSearchParams) {
    for (const key of params.keys()) {
      const all = params.getAll(key);
      obj[key] = all.length > 1 ? all : (all[0] ?? undefined);
    }
  } else {
    Object.assign(obj, params);
  }
  return parseObject(obj, schema);
}

/** Local@labels… + final TLD ≥2 letters (rejects a@b.c). */
export const EMAIL_RE =
  /^[a-z0-9](?:[a-z0-9._%+-]{0,62}[a-z0-9])?@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;
/** Digits 8–15 after stripping; allows common spacing/punctuation. */
export const PHONE_RE = /^\+?(?=[\d\s().-]{8,30}$)(?=(?:\D*\d){8,15}\D*$)[\d\s().-]+$/;
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** Letters (any script), marks, spaces, hyphen, apostrophe — rejects `.?/…` junk. */
export const PERSON_NAME_RE = /^(?=.*\p{L})[\p{L}\p{M}'’\- ]{2,120}$/u;

/** At least one letter or digit — rejects punctuation-only junk like `/////`, `../.`, `''`. */
export const MEANINGFUL_TEXT_RE = /[\p{L}\p{N}]/u;

/** Null when valid; otherwise a short field error for first/last/full name. */
export function personNameError(
  value: string,
  label = "Name",
): string | null {
  const v = value.trim().replace(/\s+/g, " ");
  if (!v) return `${label} is required.`;
  if (v.length < 2) return "At least 2 characters.";
  if (!PERSON_NAME_RE.test(v)) {
    return `${label} can only include letters, spaces, hyphens, and apostrophes.`;
  }
  return null;
}

/** Null when the value has real content; rejects empty / whitespace / symbol-only. */
export function meaningfulTextError(
  value: string,
  label: string,
): string | null {
  const v = value.trim();
  if (!v) return `${label} is required.`;
  if (!MEANINGFUL_TEXT_RE.test(v)) {
    return `${label} must include letters or numbers.`;
  }
  return null;
}

/** Standard validation error payload (no stack / internals). */
export function validationErrorPayload(errors: FieldErrors) {
  return {
    error: "Validation failed.",
    errors,
  };
}
