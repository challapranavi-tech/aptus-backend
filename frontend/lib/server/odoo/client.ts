import { getOdooConfig, isOdooConfigured } from "../config";
import { logger } from "../logger";

export class OdooNotConfiguredError extends Error {
  constructor() {
    super("Odoo credentials are not configured");
    this.name = "OdooNotConfiguredError";
  }
}

type JsonRecord = Record<string, unknown>;

type RpcResponse<T> = {
  result?: T;
  error?: {
    code?: number;
    message?: string;
    data?: { message?: string };
  };
};

/** Strip /odoo or /web paths editors often paste from the browser login URL. */
export function normalizeOdooBaseUrl(raw: string): string {
  let u = raw.trim().replace(/\/+$/, "");
  u = u.replace(/\/(?:odoo|web)(?:\/.*)?$/i, "");
  return u.replace(/\/+$/, "");
}

let rpcId = 0;
function nextId() {
  return ++rpcId;
}

/**
 * Portal Odoo client — JSON-RPC `/jsonrpc` + `execute_kw`
 * (same transport as backend/lib/odoo/rpc.ts; not Odoo JSON-2).
 */
export class OdooClient {
  private baseUrl: string;
  private apiKey: string;
  private db: string;
  private user: string;
  private uid: number | null = null;
  private authPromise: Promise<number> | null = null;

  constructor() {
    if (!isOdooConfigured()) {
      throw new OdooNotConfiguredError();
    }
    const config = getOdooConfig();
    this.baseUrl = normalizeOdooBaseUrl(config.baseUrl);
    this.apiKey = config.apiKey;
    this.db = config.db;
    this.user = config.user;
  }

  private endpoint(): string {
    return `${this.baseUrl}/jsonrpc`;
  }

  private async rpcFetch<T>(body: object): Promise<T> {
    const timeoutMs = Number(process.env.ODOO_REQUEST_TIMEOUT_MS ?? 45_000);
    const debug = process.env.ODOO_DEBUG === "true";

    if (debug) {
      logger.info("Odoo JSON-RPC request", {
        action: "odoo.rpc.request",
        bodyKeys: Object.keys(body as JsonRecord),
      });
    }

    let response: Response;
    try {
      response = await fetch(this.endpoint(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
        cache: "no-store",
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (error) {
      const isTimeout =
        error instanceof Error &&
        (error.name === "AbortError" || error.name === "TimeoutError");
      logger.error("Odoo JSON-RPC request failed", {
        action: "odoo.rpc.request_failed",
        timeoutMs,
        isTimeout,
        error: error instanceof Error ? error.message : String(error),
      });
      if (isTimeout) {
        throw new Error(`Odoo JSON-RPC timed out after ${timeoutMs}ms`);
      }
      throw new Error(
        `Odoo JSON-RPC request failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      logger.error("Odoo JSON-RPC HTTP error", {
        action: "odoo.rpc.http_error",
        status: response.status,
        response: text.slice(0, 500),
      });
      throw new Error(`Odoo HTTP ${response.status}: ${response.statusText}`);
    }

    let json: RpcResponse<T>;
    try {
      json = (await response.json()) as RpcResponse<T>;
    } catch {
      throw new Error("Odoo returned non-JSON response");
    }

    if (json.error) {
      const data = json.error.data as
        | { message?: string; name?: string; debug?: string; arguments?: unknown[] }
        | undefined;
      const msg =
        data?.message ?? json.error.message ?? "Unknown Odoo RPC error";
      const detail = [data?.name, Array.isArray(data?.arguments) ? data.arguments.join(", ") : ""]
        .filter(Boolean)
        .join(" | ");
      throw new Error(detail ? `${msg} (${detail})` : msg);
    }

    return json.result as T;
  }

  private async ensureUid(): Promise<number> {
    if (this.uid != null) return this.uid;
    if (this.authPromise) return this.authPromise;

    this.authPromise = (async () => {
      const uid = await this.rpcFetch<number | false>({
        jsonrpc: "2.0",
        id: nextId(),
        method: "call",
        params: {
          service: "common",
          method: "authenticate",
          args: [this.db, this.user, this.apiKey, {}],
        },
      });

      if (!uid) {
        throw new Error("Authentication failed: check ODOO_USER and ODOO_API_KEY");
      }
      this.uid = uid;
      return uid;
    })();

    try {
      return await this.authPromise;
    } catch (error) {
      this.authPromise = null;
      this.uid = null;
      throw error;
    }
  }

  /**
   * Generic `execute_kw(model, method, args, kwargs)`.
   */
  async call<T = unknown>(
    model: string,
    method: string,
    args: unknown[] = [],
    kwargs: Record<string, unknown> = {},
  ): Promise<T> {
    const uid = await this.ensureUid();
    const debug = process.env.ODOO_DEBUG === "true";

    if (debug) {
      logger.info("Odoo execute_kw", {
        action: "odoo.rpc.execute_kw",
        model,
        method,
      });
    }

    return this.rpcFetch<T>({
      jsonrpc: "2.0",
      id: nextId(),
      method: "call",
      params: {
        service: "object",
        method: "execute_kw",
        args: [this.db, uid, this.apiKey, model, method, args, kwargs],
      },
    });
  }

  async searchRead<T extends JsonRecord>(
    model: string,
    domain: unknown[],
    fields: string[],
    limit = 1,
  ): Promise<T[]> {
    return this.call<T[]>(model, "search_read", [domain], { fields, limit, offset: 0 });
  }

  async create(model: string, values: JsonRecord): Promise<number> {
    const result = await this.call<number | number[]>(model, "create", [values]);
    return Array.isArray(result) ? result[0]! : result;
  }

  async read<T extends JsonRecord>(
    model: string,
    ids: number[],
    fields: string[],
  ): Promise<T[]> {
    return this.call<T[]>(model, "read", [ids], { fields });
  }

  async write(model: string, ids: number[], values: JsonRecord): Promise<boolean> {
    return this.call<boolean>(model, "write", [ids, values]);
  }
}

let cachedClient: OdooClient | null = null;
let cachedConfigKey: string | null = null;

export function getOdooClient(): OdooClient | null {
  const config = getOdooConfig();
  if (!isOdooConfigured()) return null;

  const configKey = `${config.baseUrl}|${config.db}|${config.user}|${config.apiKey}`;
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
