/**
 * lib/odoo/rpc.ts
 *
 * Odoo external API client.
 *
 * Odoo 19+ uses JSON-2 (`POST /json/2/{model}/{method}`) with an API key as
 * `Authorization: bearer …`. Legacy `/jsonrpc` authenticate-as-password still
 * works on older servers and as a fallback when the env value is a login
 * password rather than an API key.
 *
 * security: ODOO_API_KEY stays in process memory on OdooRpcSession — never
 * serialize it into cookies, responses, or logs.
 */

import type { OdooRpcErrorData, OdooRpcResponse } from "@/types";

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

export type OdooDomainItem = [string, string, unknown] | "|" | "&" | "!";
export type OdooDomain = OdooDomainItem[];

export interface SearchReadOptions {
  fields?: string[];
  limit?: number;
  offset?: number;
  order?: string;
}

export type OdooTransport = "jsonrpc" | "json2";

export interface OdooRpcSession {
  url: string;
  db: string;
  uid: number;
  apiKey: string;
  /** ISR revalidation in seconds (used by unstable_cache TTLs, not fetch cache). */
  revalidate: number;
  transport: OdooTransport;
}

let _id = 0;
function nextId() {
  return ++_id;
}

export function normalizeOdooBaseUrl(raw: string): string {
  let u = raw.trim().replace(/\/+$/, "");
  u = u.replace(/\/(?:odoo|web)(?:\/.*)?$/i, "");
  return u.replace(/\/+$/, "");
}

async function rpcFetch<T>(
  endpoint: string,
  body: object,
  cacheMode: { kind: "no-store" } | { kind: "revalidate"; seconds: number },
): Promise<T> {
  let response: Response;
  try {
    const timeoutMs = cacheMode.kind === "no-store" ? 45_000 : 15_000;
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
      signal: AbortSignal.timeout(timeoutMs),
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

function json2ErrorMessage(status: number, raw: string): string {
  try {
    const json = JSON.parse(raw) as {
      message?: string;
      name?: string;
    };
    const msg = json.message?.trim();
    if (status === 401 || /invalid apikey|unauthorized/i.test(msg ?? json.name ?? "")) {
      return "Authentication failed: check ODOO_USER and ODOO_API_KEY";
    }
    if (msg) return msg;
  } catch {
    /* not JSON */
  }
  return `Odoo HTTP ${status}`;
}

async function json2Fetch<T>(
  session: Pick<OdooRpcSession, "url" | "db" | "apiKey">,
  model: string,
  method: string,
  body: Record<string, unknown>,
): Promise<T> {
  const endpoint = `${session.url}/json/2/${model}/${method}`;
  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Accept: "application/json",
        Authorization: `bearer ${session.apiKey}`,
        "X-Odoo-Database": session.db,
        "User-Agent": "Aptus-Backend/1.0",
      },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(45_000),
    });
  } catch (err) {
    throw new OdooRpcError(
      `Network error reaching Odoo: ${(err as Error).message}`,
    );
  }

  const raw = await response.text();
  if (!response.ok) {
    throw new OdooRpcError(json2ErrorMessage(response.status, raw), response.status);
  }
  if (!raw) return undefined as T;
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new OdooRpcError("Odoo returned non-JSON response");
  }
}

/**
 * Map execute_kw positional args to JSON-2 named params.
 * JSON-2 has no positional calling convention.
 */
export function json2BodyFromExecuteKw(
  method: string,
  args: unknown[] = [],
  kwargs: Record<string, unknown> = {},
): Record<string, unknown> {
  const body: Record<string, unknown> = { ...kwargs };

  if (method === "search_read" || method === "search" || method === "search_count") {
    if (args[0] !== undefined) body.domain = args[0];
    return body;
  }
  if (method === "create") {
    const vals = args[0];
    body.vals_list = Array.isArray(vals) ? vals : [vals];
    return body;
  }
  if (method === "write") {
    if (args[0] !== undefined) body.ids = args[0];
    if (args[1] !== undefined) body.vals = args[1];
    return body;
  }
  if (method === "read" || method === "unlink") {
    if (args[0] !== undefined) body.ids = args[0];
    return body;
  }
  if (method === "next_by_code") {
    if (args[0] !== undefined) body.sequence_code = args[0];
    return body;
  }
  if (method === "message_post") {
    const ids = args[0];
    body.ids = Array.isArray(ids) ? ids : ids !== undefined ? [ids] : [];
    return body;
  }
  if (method === "context_get") {
    return body;
  }
  if (args.length === 0) return body;
  throw new OdooRpcError(
    `JSON-2 cannot call ${method} with positional args`,
  );
}

function asRecordId(raw: unknown): number {
  if (typeof raw === "number" && Number.isInteger(raw) && raw > 0) return raw;
  if (Array.isArray(raw) && raw.length > 0) return asRecordId(raw[0]);
  throw new OdooRpcError("Odoo create returned no record id");
}

async function tryJson2Session(
  url: string,
  db: string,
  apiKey: string,
  revalidate: number,
): Promise<OdooRpcSession | null> {
  const probe: Pick<OdooRpcSession, "url" | "db" | "apiKey"> = {
    url,
    db,
    apiKey,
  };
  try {
    const ctx = await json2Fetch<{ uid?: number }>(
      probe,
      "res.users",
      "context_get",
      {},
    );
    const uid = ctx?.uid;
    if (typeof uid !== "number" || uid <= 0) return null;
    return { url, db, uid, apiKey, revalidate, transport: "json2" };
  } catch (err) {
    if (err instanceof OdooRpcError && err.httpStatus === 404) return null;
    throw err;
  }
}

async function jsonrpcAuthenticate(
  url: string,
  db: string,
  user: string,
  apiKey: string,
): Promise<number | false> {
  return rpcFetch<number | false>(
    `${url}/jsonrpc`,
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
    { kind: "no-store" },
  );
}

export async function authenticate(
  url: string,
  db: string,
  user: string,
  apiKey: string,
  revalidate = 60,
): Promise<OdooRpcSession> {
  const base = normalizeOdooBaseUrl(url);
  let major = 0;
  try {
    major = (await getVersionInfo(base)).server_version_info[0] ?? 0;
  } catch {
    major = 0;
  }

  if (major >= 19) {
    try {
      const json2 = await tryJson2Session(base, db, apiKey, revalidate);
      if (json2) return json2;
    } catch (err) {
      // Invalid API key on JSON-2: still try jsonrpc in case ODOO_API_KEY is a login password.
      if (!(err instanceof OdooRpcError && err.httpStatus === 401)) throw err;
    }
  }

  const uid = await jsonrpcAuthenticate(base, db, user, apiKey);
  if (!uid) {
    throw new OdooRpcError(
      "Authentication failed: check ODOO_USER and ODOO_API_KEY",
      401,
    );
  }
  return { url: base, db, uid, apiKey, revalidate, transport: "jsonrpc" };
}

async function objectCall<T>(
  session: OdooRpcSession,
  model: string,
  method: string,
  args: unknown[] = [],
  kwargs: Record<string, unknown> = {},
): Promise<T> {
  if (session.transport === "json2") {
    return json2Fetch<T>(
      session,
      model,
      method,
      json2BodyFromExecuteKw(method, args, kwargs),
    );
  }

  return rpcFetch<T>(
    `${session.url}/jsonrpc`,
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
          method,
          args,
          kwargs,
        ],
      },
    },
    { kind: "no-store" },
  );
}

export async function searchRead<T>(
  session: OdooRpcSession,
  model: string,
  domain: OdooDomain,
  options: SearchReadOptions = {},
): Promise<T[]> {
  const { fields = [], limit = 100, offset = 0, order } = options;
  const kwargs: Record<string, unknown> = { fields, limit, offset };
  if (order) kwargs.order = order;
  return objectCall<T[]>(session, model, "search_read", [domain], kwargs);
}

export async function executeKw<T>(
  session: OdooRpcSession,
  model: string,
  method: string,
  args: unknown[] = [],
  kwargs: Record<string, unknown> = {},
): Promise<T> {
  return objectCall<T>(session, model, method, args, kwargs);
}

export async function create(
  session: OdooRpcSession,
  model: string,
  values: Record<string, unknown>,
): Promise<number> {
  const raw = await executeKw<unknown>(session, model, "create", [values]);
  return asRecordId(raw);
}

export async function write(
  session: OdooRpcSession,
  model: string,
  id: number,
  values: Record<string, unknown>,
): Promise<boolean> {
  return executeKw<boolean>(session, model, "write", [[id], values]);
}

export async function read<T>(
  session: OdooRpcSession,
  model: string,
  ids: number[],
  fields: string[] = [],
): Promise<T[]> {
  if (ids.length === 0) return [];
  return objectCall<T[]>(session, model, "read", [ids], { fields });
}

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
    { kind: "revalidate", seconds: 3600 },
  );
}
