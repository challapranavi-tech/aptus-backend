/**
 * Module-level singleflight + short TTL for portal list GETs.
 * Multiple hook instances (shell badge + panel/overview) share one in-flight request.
 *
 * ponytail: TTL is 8s — enough to collapse mount storms / soft navigations;
 * invalidatePortalSharedFetch() on logout or write paths that need immediate freshness.
 */

import { authFetch } from "@/lib/access-token";

type Entry<T> = {
  at: number;
  value?: T;
  error?: string;
  promise?: Promise<T>;
};

const TTL_MS = 8_000;
const store = new Map<string, Entry<unknown>>();

export function invalidatePortalSharedFetch(pathPrefix?: string): void {
  if (!pathPrefix) {
    store.clear();
    return;
  }
  for (const key of store.keys()) {
    if (key === pathPrefix || key.startsWith(pathPrefix)) {
      store.delete(key);
    }
  }
}

export async function portalSharedGet<T>(
  path: string,
  parse: (response: Response) => Promise<{ ok: true; data: T } | { ok: false; error: string }>,
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  const existing = store.get(path) as Entry<T> | undefined;
  if (existing?.value !== undefined && Date.now() - existing.at < TTL_MS) {
    return { ok: true, data: existing.value };
  }
  if (existing?.error && Date.now() - existing.at < TTL_MS && !existing.promise) {
    return { ok: false, error: existing.error };
  }
  if (existing?.promise) {
    try {
      const data = await existing.promise;
      return { ok: true, data };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Request failed" };
    }
  }

  const entry: Entry<T> = { at: Date.now() };
  entry.promise = (async () => {
    const response = await authFetch(path);
    const parsed = await parse(response);
    if (!parsed.ok) {
      entry.error = parsed.error;
      entry.value = undefined;
      entry.at = Date.now();
      entry.promise = undefined;
      throw new Error(parsed.error);
    }
    entry.value = parsed.data;
    entry.error = undefined;
    entry.at = Date.now();
    entry.promise = undefined;
    return parsed.data;
  })();
  store.set(path, entry as Entry<unknown>);

  try {
    const data = await entry.promise;
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Request failed" };
  }
}

/** Warm list caches as soon as auth succeeds so dashboard hooks hit a warm singleflight. */
export function warmPortalListCaches(): void {
  if (typeof window === "undefined") return;
  void portalSharedGet("/api/notifications", async (response) => {
    const data = (await response.json().catch(() => ({}))) as {
      notifications?: unknown[];
      error?: string;
    };
    if (!response.ok) return { ok: false as const, error: data.error ?? "Failed to load notifications" };
    return { ok: true as const, data: data.notifications ?? [] };
  });
  void portalSharedGet("/api/orders", async (response) => {
    const data = (await response.json().catch(() => ({}))) as {
      orders?: unknown[];
      error?: string;
    };
    if (!response.ok) return { ok: false as const, error: data.error ?? "Failed to load orders" };
    return { ok: true as const, data: data.orders ?? [] };
  });
  void portalSharedGet("/api/subscriptions", async (response) => {
    const data = (await response.json().catch(() => ({}))) as {
      subscriptions?: unknown[];
      error?: string;
    };
    if (!response.ok) return { ok: false as const, error: data.error ?? "Failed to load subscriptions" };
    return { ok: true as const, data: data.subscriptions ?? [] };
  });
}

const SCOPE_PATH = {
  orders: "/api/orders",
  subscriptions: "/api/subscriptions",
  notifications: "/api/notifications",
} as const;

export function invalidatePortalSharedFetchForScope(
  scope: "orders" | "subscriptions" | "notifications" | "all",
): void {
  if (scope === "all") {
    invalidatePortalSharedFetch();
    return;
  }
  invalidatePortalSharedFetch(SCOPE_PATH[scope]);
}
