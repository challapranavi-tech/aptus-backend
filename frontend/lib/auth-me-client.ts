/**
 * Shared /api/auth/me for HeaderAuthActions + AuthProvider (one network trip per window).
 * Failures are not TTL-cached so a login-page probe cannot poison the post-login portal.
 */

import { authFetch, setAccessToken } from "@/lib/access-token";
import type { ClientProfile } from "@/types/profile";

export type AuthMeResult =
  | { ok: true; user: ClientProfile; accessToken?: string; expiresIn?: number }
  | { ok: false; status: number };

type Shared = {
  promise: Promise<AuthMeResult> | null;
  result: AuthMeResult | null;
  at: number;
};

const TTL_MS = 60_000;


function getShared(): Shared {
  if (typeof window === "undefined") {
    return { promise: null, result: null, at: 0 };
  }
  const w = window as Window & { __aptusAuthMe?: Shared };
  if (!w.__aptusAuthMe) {
    w.__aptusAuthMe = { promise: null, result: null, at: 0 };
  }
  return w.__aptusAuthMe;
}

export function invalidateAuthMeCache(): void {
  const shared = getShared();
  shared.promise = null;
  shared.result = null;
  shared.at = 0;
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
      if (data.accessToken && data.expiresIn) {
        setAccessToken(data.accessToken, data.expiresIn);
      }
      if (!data.user) {
        return { ok: false, status: 401 };
      }
      const result: AuthMeResult = {
        ok: true,
        user: data.user,
        accessToken: data.accessToken,
        expiresIn: data.expiresIn,
      };
      shared.result = result;
      shared.at = Date.now();
      return result;
    } catch {
      return { ok: false, status: 0 };
    } finally {
      shared.promise = null;
    }
  })();

  return shared.promise;
}
