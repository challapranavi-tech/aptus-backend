import { getOdooConfig, isOdooConfigured } from "../config";
import { logger } from "../logger";

export class OdooNotConfiguredError extends Error {
  constructor() {
    super("Odoo credentials are not configured");
    this.name = "OdooNotConfiguredError";
  }
}

type JsonRecord = Record<string, unknown>;

export class OdooClient {
  private baseUrl: string;
  private apiKey: string;
  private db: string;

  constructor() {
    if (!isOdooConfigured()) {
      throw new OdooNotConfiguredError();
    }
    const config = getOdooConfig();
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
    this.db = config.db;
  }

  private headers(): HeadersInit {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      "X-Odoo-Database": this.db,
    };
  }

  /** Odoo 17+ JSON-2 API: POST /json/2/{model}/{method} */
  async call<T = unknown>(
    model: string,
    method: string,
    body: JsonRecord,
  ): Promise<T> {
    const url = `${this.baseUrl}/json/2/${model}/${method}`;
    const debug = process.env.ODOO_DEBUG === "true";
    const timeoutMs = Number(process.env.ODOO_REQUEST_TIMEOUT_MS ?? 10_000);

    if (debug) {
      logger.info("Odoo API request", {
        action: "odoo.api.request",
        model,
        method,
        bodyKeys: Object.keys(body),
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (error) {
      const isTimeout = error instanceof Error && error.name === "AbortError";
      logger.error("Odoo API request failed", {
        action: "odoo.api.request_failed",
        model,
        method,
        timeoutMs,
        isTimeout,
        error: error instanceof Error ? error.message : String(error),
      });
      if (isTimeout) {
        throw new Error(`Odoo ${model}.${method} timed out after ${timeoutMs}ms`);
      }
      throw new Error(`Odoo ${model}.${method} request failed`);
    } finally {
      clearTimeout(timeout);
    }

    const text = await response.text().catch(() => "");

    if (!response.ok) {
      logger.error("Odoo API error", {
        action: "odoo.api.error",
        model,
        method,
        status: response.status,
        response: text.slice(0, 500),
      });
      throw new Error(`Odoo ${model}.${method} failed (${response.status}): ${text}`);
    }

    if (!text.trim()) {
      throw new Error(`Odoo ${model}.${method} returned an empty response body`);
    }

    let result: T;
    try {
      result = JSON.parse(text) as T;
    } catch (parseError) {
      logger.error("Odoo API returned invalid JSON", {
        action: "odoo.api.invalid_json",
        model,
        method,
        response: text.slice(0, 500),
        error: parseError instanceof Error ? parseError.message : String(parseError),
      });
      throw new Error(`Odoo ${model}.${method} returned invalid JSON`);
    }

    if (debug) {
      logger.info("Odoo API response", {
        action: "odoo.api.response",
        model,
        method,
        resultPreview:
          typeof result === "object" && result !== null
            ? JSON.stringify(result).slice(0, 300)
            : String(result).slice(0, 300),
      });
    }

    return result;
  }

  async searchRead<T extends JsonRecord>(
    model: string,
    domain: unknown[],
    fields: string[],
    limit = 1,
  ): Promise<T[]> {
    return this.call<T[]>(model, "search_read", { domain, fields, limit });
  }

  async create(model: string, values: JsonRecord): Promise<number> {
    const result = await this.call<number | number[]>(model, "create", { vals_list: [values] });
    return Array.isArray(result) ? result[0] : result;
  }

  async read<T extends JsonRecord>(
    model: string,
    ids: number[],
    fields: string[],
  ): Promise<T[]> {
    return this.call<T[]>(model, "read", { ids, fields });
  }

  async write(model: string, ids: number[], values: JsonRecord): Promise<boolean> {
    return this.call<boolean>(model, "write", { ids, vals: values });
  }
}

let cachedClient: OdooClient | null = null;
let cachedConfigKey: string | null = null;

export function getOdooClient(): OdooClient | null {
  const config = getOdooConfig();
  if (!isOdooConfigured()) return null;

  const configKey = `${config.baseUrl}|${config.db}|${config.apiKey}`;
  if (cachedClient && cachedConfigKey === configKey) {
    return cachedClient;
  }

  try {
    cachedClient = new OdooClient();
    cachedConfigKey = configKey;
    return cachedClient;
  } catch (error) {
    if (error instanceof OdooNotConfiguredError) return null;
    throw error;
  }
}
