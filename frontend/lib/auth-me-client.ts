/** Minimal portal profile shape used to prefill quote/contact forms. */
export type AuthMeUser = {
  id?: string;
  contactType?: string;
  company?: string;
  name?: string;
  email?: string;
  phone?: string;
  taxId?: string;
};

export type AuthMeResult = { ok: true; user: AuthMeUser } | { ok: false };

let inflight: Promise<AuthMeResult> | null = null;

async function fetchAuthMeOnce(): Promise<AuthMeResult> {
  if (typeof window === "undefined") return { ok: false };

  try {
    const res = await fetch("/api/auth/me", {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return { ok: false };

    const data = (await res.json()) as { user?: AuthMeUser } | AuthMeUser;
    const user = "user" in data && data.user ? data.user : (data as AuthMeUser);
    if (!user?.email && !user?.name) return { ok: false };

    return { ok: true, user };
  } catch {
    return { ok: false };
  }
}

/** Deduped client fetch for /api/auth/me (quote prefill + portal session sync). */
export function fetchAuthMeShared(): Promise<AuthMeResult> {
  if (!inflight) {
    inflight = fetchAuthMeOnce().finally(() => {
      inflight = null;
    });
  }
  return inflight;
}
