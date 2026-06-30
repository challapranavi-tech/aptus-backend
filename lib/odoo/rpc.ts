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

/** Authenticated JSON-RPC session — one instance per worker lifecycle. */
export interface OdooRpcSession {
  url: string;
  db: string;
  uid: number;
  apiKey: string;
  /** ISR revalidation in seconds (passed to Next.js `next.revalidate`). */
  revalidate: number;
}

// ─── Counter for JSON-RPC `id` field ─────────────────────────────────────────
let _id = 0;
function nextId() {
  return ++_id;
}

// ─── Low-level fetch ──────────────────────────────────────────────────────────
async function rpcFetch<T>(
  endpoint: string,
  body: object,
  revalidate: number,
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
      next: { revalidate },
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
 * @param url      - Base URL e.g. "https://aptusinfotech-staging-33910464.dev.odoo.com"
 * @param db       - Database name e.g. "aptusinfotech-staging-33910464"
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
  const base = url.replace(/\/$/, "");
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
    0, // never cache auth calls
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
    session.revalidate,
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
    session.revalidate,
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
  const base = url.replace(/\/$/, "");
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
    3600,
  );
}
