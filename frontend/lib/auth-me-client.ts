/**
 * Shared /api/auth/me for HeaderAuthActions + AuthProvider (one network trip per window).
 * Failures are not TTL-cached so a login-page probe cannot poison the post-login portal.
 */

import { authFetch, getAccessToken, setAccessToken } from "@/lib/access-token";
import type { ClientProfile } from "@/types/profile";

export type AuthMeResult =
  | { ok: true; user: ClientProfile; accessToken?: string; expiresIn?: number }
  | { ok: false; status: number };

type Shared = {
  promise: Promise<AuthMeResult> | null;
  result: AuthMeResult | null;
  at: number;
  /** Quiet peek used by public forms (Request Quote) — never hits /api/auth/refresh. */
  peekPromise: Promise<AuthMeResult> | null;
  peekResult: AuthMeResult | null;
  peekAt: number;
};

const TTL_MS = 60_000;
const PEEK_MISS_TTL_MS = 30_000;

function getShared(): Shared {
  if (typeof window === "undefined") {
    return {
      promise: null,
      result: null,
      at: 0,
      peekPromise: null,
      peekResult: null,
      peekAt: 0,
    };
  }
  const w = window as Window & { __aptusAuthMe?: Shared };
  if (!w.__aptusAuthMe) {
    w.__aptusAuthMe = {
      promise: null,
      result: null,
      at: 0,
      peekPromise: null,
      peekResult: null,
      peekAt: 0,
    };
  }
  return w.__aptusAuthMe;
}

export function invalidateAuthMeCache(): void {
  const shared = getShared();
  shared.promise = null;
  shared.result = null;
  shared.at = 0;
  shared.peekPromise = null;
  shared.peekResult = null;
  shared.peekAt = 0;
}

function parseMePayload(
  data: {
    user?: ClientProfile;
    accessToken?: string;
    expiresIn?: number;
  },
): AuthMeResult {
  if (data.accessToken && data.expiresIn) {
    setAccessToken(data.accessToken, data.expiresIn);
  }
  if (!data.user) {
    return { ok: false, status: 401 };
  }
  return {
    ok: true,
    user: data.user,
    accessToken: data.accessToken,
    expiresIn: data.expiresIn,
  };
}

/**
 * Optional profile for public forms (Request Quote). Login is never required.
 * Uses cookies + in-memory access token only — does not call /api/auth/refresh.
 */
export async function peekAuthMeOptional(): Promise<AuthMeResult> {
  const shared = getShared();
  if (shared.result?.ok && Date.now() - shared.at < TTL_MS) {
    return shared.result;
  }
  if (shared.peekResult?.ok && Date.now() - shared.peekAt < TTL_MS) {
    return shared.peekResult;
  }
  if (
    shared.peekResult &&
    !shared.peekResult.ok &&
    Date.now() - shared.peekAt < PEEK_MISS_TTL_MS
  ) {
    return shared.peekResult;
  }
  if (shared.peekPromise) return shared.peekPromise;

  shared.peekPromise = (async (): Promise<AuthMeResult> => {
    try {
      const headers = new Headers();
      const token = getAccessToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      const response = await fetch("/api/auth/me", {
        credentials: "include",
        headers,
      });
      if (!response.ok) {
        const miss: AuthMeResult = { ok: false, status: response.status };
        shared.peekResult = miss;
        shared.peekAt = Date.now();
        return miss;
      }
      const data = (await response.json()) as {
        user?: ClientProfile;
        accessToken?: string;
        expiresIn?: number;
      };
      const result = parseMePayload(data);
      shared.peekResult = result;
      shared.peekAt = Date.now();
      if (result.ok) {
        shared.result = result;
        shared.at = Date.now();
      }
      return result;
    } catch {
      return { ok: false, status: 0 };
    } finally {
      shared.peekPromise = null;
    }
  })();

  return shared.peekPromise;
}

export async function fetchAuthMeShared(): Promise<AuthMeResult> {
  const shared = getShared();
  if (shared.result?.ok && Date.now() - shared.at < TTL_MS) {
    return shared.result;
  }
  if (shared.promise) {
    return shared.promise;
  }

  shared.promise = (async (): Promise<AuthMeResult> => {
    try {
      const response = await authFetch("/api/auth/me");
      if (!response.ok) {
        return { ok: false, status: response.status };
      }
      const data = (await response.json()) as {
        user?: ClientProfile;
        accessToken?: string;
        expiresIn?: number;
      };
      const result = parseMePayload(data);
      if (result.ok) {
        shared.result = result;
        shared.at = Date.now();
      }
      return result;
    } catch {
      return { ok: false, status: 0 };
    } finally {
      shared.promise = null;
    }
  })();

  return shared.promise;
}
