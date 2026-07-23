/**
 * lib/odoo/rpc.ts
 *
 * Stateless JSON-RPC 2.0 client for Odoo.
 *
 * Architecture decisions:
 *  - Uses the `/jsonrpc` endpoint (not `/web/dataset/call_kw`).
 *    This allows credentials to be sent per-request in the body,
 *    which is essential for stateless Next.js server-side fetches.
 *  - Authentication is performed once per OdooRpcSession instance.
 *    Cache OdooRpcSession singletons at the module level so that
 *    cold-start auth only happens once per worker/edge instance.
 *  - API key is used in place of password (Odoo 14+).
 *    Path: Odoo → top-right avatar → Preferences → Account Security → API Keys.
 */

import type { OdooRpcErrorData, OdooRpcResponse } from "@/types";

// ─── Error class ──────────────────────────────────────────────────────────────
export class OdooRpcError extends Error {
  constructor(
    message: string,
    public readonly httpStatus?: number,
    public readonly rpcCode?: number,
    public readonly odooData?: OdooRpcErrorData,
  ) {
    super(message);
    this.name = "OdooRpcError";
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────
/** Odoo domain element: either a condition triple or a logical operator string */
export type OdooDomainItem = [string, string, unknown] | "|" | "&" | "!";
export type OdooDomain = OdooDomainItem[];

export interface SearchReadOptions {
  fields?: string[];
  limit?: number;
  offset?: number;
  order?: string;
}

/** Authenticated JSON-RPC handle for the Odoo service account.
 *
 * security: This is NOT a browser/user session. It holds ODOO_API_KEY in
 * process memory only — never serialize it into cookies, responses, or logs.
 * Drop the cached client after rotating credentials (see invalidateOdooClientSession).
 */
export interface OdooRpcSession {
  url: string;
  db: string;
  uid: number;
  apiKey: string;
  /** ISR revalidation in seconds (used by unstable_cache TTLs, not fetch cache). */
  revalidate: number;
}

// ─── Counter for JSON-RPC `id` field ─────────────────────────────────────────
let _id = 0;
function nextId() {
  return ++_id;
}

/**
 * Normalize ODOO_URL to the JSON-RPC host.
 * Editors often paste the browser login URL (`…/odoo` or `…/web`), which makes
 * `{base}/jsonrpc` hit the web client (400 CSRF) and takes down CMS + careers.
 * Also trims whitespace from env-var paste mistakes.
 */
export function normalizeOdooBaseUrl(raw: string): string {
  let u = raw.trim().replace(/\/+$/, "");
  // Strip web-client path + anything after it (…/odoo, …/odoo/…, …/web/login).
  u = u.replace(/\/(?:odoo|web)(?:\/.*)?$/i, "");
  return u.replace(/\/+$/, "");
}

// ─── Low-level fetch ──────────────────────────────────────────────────────────
/**
 * @param cacheMode
 *   - `no-store` — required when the request body includes ODOO_API_KEY (or any
 *     long-lived secret). Never put secret-bearing POSTs into Next.js Data Cache.
 *   - `revalidate` — only for unauthenticated public RPC (e.g. version_info).
 */
async function rpcFetch<T>(
  endpoint: string,
  body: object,
  cacheMode: { kind: "no-store" } | { kind: "revalidate"; seconds: number },
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      ...(cacheMode.kind === "no-store"
        ? { cache: "no-store" as const }
        : { next: { revalidate: cacheMode.seconds } }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch (err) {
    throw new OdooRpcError(
      `Network error reaching Odoo: ${(err as Error).message}`,
    );
  }

  if (!response.ok) {
    throw new OdooRpcError(
      `Odoo HTTP ${response.status}: ${response.statusText}`,
      response.status,
    );
  }

  let json: OdooRpcResponse<T>;
  try {
    json = (await response.json()) as OdooRpcResponse<T>;
  } catch {
    throw new OdooRpcError("Odoo returned non-JSON response");
  }

  if (json.error) {
    const msg =
      json.error.data?.message ??
      json.error.message ??
      "Unknown Odoo RPC error";
    throw new OdooRpcError(msg, undefined, json.error.code, json.error.data);
  }

  return json.result as T;
}

// ─── Authenticate ─────────────────────────────────────────────────────────────
/**
 * Authenticates against Odoo and returns a session object.
 * Use the returned session with `searchRead`, `read`, etc.
 *
 * @param url      - Base URL e.g. "https://aptusinfotech-staging-35193445.dev.odoo.com"
 * @param db       - Database name e.g. "aptusinfotech-staging-35193445"
 * @param user     - Login email or username
 * @param apiKey   - API key (from Preferences → Account Security → API Keys)
 * @param revalidate - ISR cache TTL in seconds (default 60)
 */
export async function authenticate(
  url: string,
  db: string,
  user: string,
  apiKey: string,
  revalidate = 60,
): Promise<OdooRpcSession> {
  const base = normalizeOdooBaseUrl(url);
  const endpoint = `${base}/jsonrpc`;

  const uid = await rpcFetch<number | false>(
    endpoint,
    {
      jsonrpc: "2.0",
      id: nextId(),
      method: "call",
      params: {
        service: "common",
        method: "authenticate",
        args: [db, user, apiKey, {}],
      },
    },
    // security: API key is in the body — never cache this request.
    { kind: "no-store" },
  );

  if (!uid) {
    throw new OdooRpcError(
      "Authentication failed: check ODOO_USER and ODOO_API_KEY",
      401,
    );
  }

  return { url: base, db, uid, apiKey, revalidate };
}

// ─── search_read ──────────────────────────────────────────────────────────────
/**
 * Calls `model.search_read(domain, fields, offset, limit, order)` on Odoo.
 */
export async function searchRead<T>(
  session: OdooRpcSession,
  model: string,
  domain: OdooDomain,
  options: SearchReadOptions = {},
): Promise<T[]> {
  const { fields = [], limit = 100, offset = 0, order } = options;
  const endpoint = `${session.url}/jsonrpc`;

  const kwargs: Record<string, unknown> = { fields, limit, offset };
  if (order) kwargs.order = order;

  return rpcFetch<T[]>(
    endpoint,
    {
      jsonrpc: "2.0",
      id: nextId(),
      method: "call",
      params: {
        service: "object",
        method: "execute_kw",
        args: [
          session.db,
          session.uid,
          session.apiKey,
          model,
          "search_read",
          [domain],
          kwargs,
        ],
      },
    },
    // security: execute_kw sends apiKey in the body — cache responses via
    // unstable_cache in OdooClient, not Next fetch Data Cache.
    { kind: "no-store" },
  );
}

// ─── create ─────────────────────────────────────────────────────────────────
/**
 * Calls `model.create(values)` on Odoo and returns the new record id.
 * security: execute_kw sends apiKey in the body — never cache this request.
 */
export async function create(
  session: OdooRpcSession,
  model: string,
  values: Record<string, unknown>,
): Promise<number> {
  const endpoint = `${session.url}/jsonrpc`;
  return rpcFetch<number>(
    endpoint,
    {
      jsonrpc: "2.0",
      id: nextId(),
      method: "call",
      params: {
        service: "object",
        method: "execute_kw",
        args: [session.db, session.uid, session.apiKey, model, "create", [values]],
      },
    },
    { kind: "no-store" },
  );
}

// ─── read ─────────────────────────────────────────────────────────────────────
/**
 * Calls `model.read(ids, fields)` on Odoo.
 */
export async function read<T>(
  session: OdooRpcSession,
  model: string,
  ids: number[],
  fields: string[] = [],
): Promise<T[]> {
  if (ids.length === 0) return [];
  const endpoint = `${session.url}/jsonrpc`;

  return rpcFetch<T[]>(
    endpoint,
    {
      jsonrpc: "2.0",
      id: nextId(),
      method: "call",
      params: {
        service: "object",
        method: "execute_kw",
        args: [
          session.db,
          session.uid,
          session.apiKey,
          model,
          "read",
          [ids],
          { fields },
        ],
      },
    },
    { kind: "no-store" },
  );
}

// ─── version_info (no auth required) ─────────────────────────────────────────
export interface OdooVersionInfo {
  server_version: string;
  server_version_info: [number, number, number, string, number];
  server_serie: string;
  protocol_version: number;
}

export async function getVersionInfo(url: string): Promise<OdooVersionInfo> {
  const base = normalizeOdooBaseUrl(url);
  return rpcFetch<OdooVersionInfo>(
    `${base}/jsonrpc`,
    {
      jsonrpc: "2.0",
      id: nextId(),
      method: "call",
      params: {
        service: "common",
        method: "version",
        args: [],
      },
    },
    // version_info is unauthenticated — safe to cache briefly.
    { kind: "revalidate", seconds: 3600 },
  );
}
