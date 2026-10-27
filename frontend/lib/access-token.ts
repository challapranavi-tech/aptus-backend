"use client";

/**
 * In-memory access token store — never persisted to localStorage/sessionStorage.
 * Refresh token lives in httpOnly cookie managed by the server.
 */

import { clearClientAuthStorage } from "./clear-client-auth-storage";

type SharedPortalRefresh = {
  accessToken: string | null;
  expiresAt: number;
  promise: Promise<string | null> | null;
};

function getSharedPortalRefresh(): SharedPortalRefresh {
  if (typeof window === "undefined") {
    return { accessToken: null, expiresAt: 0, promise: null };
  }
  const w = window as Window & { __aptusPortalRefresh?: SharedPortalRefresh };
  if (!w.__aptusPortalRefresh) {
    w.__aptusPortalRefresh = { accessToken: null, expiresAt: 0, promise: null };
  }
  return w.__aptusPortalRefresh;
}

function readSharedAccessToken(): string | null {
  const shared = getSharedPortalRefresh();
  if (!shared.accessToken || Date.now() >= shared.expiresAt) {
    return null;
  }
  return shared.accessToken;
}

function writeSharedAccessToken(token: string, expiresInSec: number): void {
  const shared = getSharedPortalRefresh();
  shared.accessToken = token;
  shared.expiresAt = Date.now() + expiresInSec * 1000 - 30_000;
  accessToken = token;
  expiresAt = shared.expiresAt;
}

let accessToken: string | null = null;
let expiresAt = 0;

type AuthTokens = {
  accessToken: string;
  expiresIn: number;
};

export function setAccessToken(token: string, expiresInSec: number): void {
  writeSharedAccessToken(token, expiresInSec);
}

export function clearAccessToken(): void {
  const shared = getSharedPortalRefresh();
  shared.accessToken = null;
  shared.expiresAt = 0;
  shared.promise = null;
  accessToken = null;
  expiresAt = 0;
}

const SESSION_TTL_MS = 1000 * 60 * 60 * 8;
const LEGACY_SESSION_KEY = "aptusPortalSession";

export type LegacySessionUser = {
  id: string;
  email: string;
  name: string;
  initials: string;
  company: string;
  phone?: string;
  role?: string;
  location?: string;
  accountManager?: string;
  supportTier?: string;
  customerSince?: string;
  billingCycle?: string;
  paymentTerms?: string;
  contactType?: string;
  street?: string;
  street2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  taxId?: string;
  website?: string;
  language?: string;
  tags?: string;
};

type SyncLegacyOptions = {
  /** When true, update storage without firing aptus:session-changed (avoids refresh loops). */
  silent?: boolean;
};

/** Mirrors aptus_portal_auth.js setSession so dashboard pages keep the user after React login. */
export function syncLegacyPortalSession(
  user: LegacySessionUser,
  remember = true,
  options?: SyncLegacyOptions,
): void {
  if (typeof window === "undefined") return;

  const storage = remember ? window.localStorage : window.sessionStorage;
  let authenticatedAt = Date.now();
  try {
    const previous = JSON.parse(storage.getItem(LEGACY_SESSION_KEY) || "null") as {
      userId?: string;
      email?: string;
      authenticatedAt?: number;
    } | null;
    if (previous?.userId === user.id && previous?.email === user.email && previous.authenticatedAt) {
      authenticatedAt = previous.authenticatedAt;
    }
  } catch {
    /* use fresh timestamp */
  }

  const payload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    initials: user.initials,
    role: user.role ?? "Customer",
    company: user.company,
    phone: user.phone ?? "",
    location: user.location ?? "",
    accountManager: user.accountManager ?? "Aptus Support",
    supportTier: user.supportTier ?? "Standard",
    customerSince: user.customerSince ?? "",
    billingCycle: user.billingCycle ?? "",
    paymentTerms: user.paymentTerms ?? "",
    contactType: user.contactType ?? "person",
    street: user.street ?? "",
    street2: user.street2 ?? "",
    city: user.city ?? "",
    state: user.state ?? "",
    zip: user.zip ?? "",
    country: user.country ?? "",
    taxId: user.taxId ?? "",
    website: user.website ?? "",
    language: user.language ?? "en_US",
    tags: user.tags ?? "",
    authenticatedAt,
    expiresAt: authenticatedAt + SESSION_TTL_MS,
  };

  window.localStorage.removeItem(LEGACY_SESSION_KEY);
  window.sessionStorage.removeItem(LEGACY_SESSION_KEY);

  const serialized = JSON.stringify(payload);
  const existing = storage.getItem(LEGACY_SESSION_KEY);
  storage.setItem(LEGACY_SESSION_KEY, serialized);

  if (!options?.silent && existing !== serialized) {
    window.dispatchEvent(new CustomEvent("aptus:session-changed"));
  }
}

export function clearLegacyPortalSession(): void {
  if (typeof window === "undefined") return;
  const had =
    Boolean(window.localStorage.getItem(LEGACY_SESSION_KEY)) ||
    Boolean(window.sessionStorage.getItem(LEGACY_SESSION_KEY));
  window.localStorage.removeItem(LEGACY_SESSION_KEY);
  window.sessionStorage.removeItem(LEGACY_SESSION_KEY);
  if (had) {
    window.dispatchEvent(new CustomEvent("aptus:session-changed"));
  }
}

/** Optimistic portal chrome from the last successful session (may be stale). */
export function readLegacyPortalSessionUser(): LegacySessionUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw =
      window.localStorage.getItem(LEGACY_SESSION_KEY) ||
      window.sessionStorage.getItem(LEGACY_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LegacySessionUser & {
      userId?: string;
      expiresAt?: number;
    };
    if (parsed.expiresAt && Date.now() > parsed.expiresAt) return null;
    const id = parsed.id || parsed.userId;
    if (!id || !parsed.email) return null;
    return { ...parsed, id };
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  const shared = readSharedAccessToken();
  if (shared) return shared;
  if (!accessToken || Date.now() >= expiresAt) {
    return null;
  }
  return accessToken;
}

export async function refreshAccessToken(): Promise<string | null> {
  const shared = getSharedPortalRefresh();
  const cached = readSharedAccessToken();
  if (cached) return cached;

  if (shared.promise) return shared.promise;

  shared.promise = (async () => {
    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        // Only a genuine rejection of the refresh token ends the session. A rate
        // limit or a server error is transient, and signing the user out would
        // turn a brief throttle into lost work.
        if (response.status === 401 || response.status === 403) {
          clearAccessToken();
          clearLegacyPortalSession();
        } else {
          clearAccessToken();
        }
        return null;
      }
      const data = (await response.json()) as AuthTokens;
      setAccessToken(data.accessToken, data.expiresIn);
      return data.accessToken;
    } catch {
      // Network failure is not proof the session is invalid; keep it and retry.
      clearAccessToken();
      return null;
    } finally {
      shared.promise = null;
    }
  })();

  return shared.promise;
}

export async function getValidAccessToken(): Promise<string | null> {
  const current = getAccessToken();
  if (current) return current;
  return refreshAccessToken();
}

export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  let token = await getValidAccessToken();
  const headers = new Headers(init.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response = await fetch(input, { ...init, headers, credentials: "include" });

  if (response.status === 401 && token) {
    token = await refreshAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
      response = await fetch(input, { ...init, headers, credentials: "include" });
    }
  }

  return response;
}

export async function loginViaApi(
  email: string,
  password: string,
): Promise<{ ok: true; user: unknown } | { ok: false; error: string }> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password, remember: true }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return { ok: false, error: data.error ?? "Invalid email or password" };
  }

  if (data.accessToken && data.expiresIn) {
    setAccessToken(data.accessToken, data.expiresIn);
  }

  if (data.user && typeof data.user === "object") {
    syncLegacyPortalSession(data.user as LegacySessionUser, true);
  }

  return { ok: true, user: data.user };
}

export async function logoutViaApi(): Promise<void> {
  try {
    await authFetch("/api/auth/logout", { method: "POST" });
  } catch {
    /* ignore */
  }
  clearAccessToken();
  clearClientAuthStorage();
}
