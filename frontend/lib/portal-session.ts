export const PORTAL_SESSION_KEY = "aptusPortalSession";
export const PORTAL_PROFILE_KEY = "aptusPortalProfile";

export type PortalUser = {
  id: string;
  email: string;
  name: string;
  initials: string;
  company: string;
  avatarDataUrl?: string;
};

const PROFILES: PortalUser[] = [];

type SessionPayload = {
  userId: string;
  email?: string;
  name?: string;
  initials?: string;
  company?: string;
  expiresAt?: number;
};

type ApiProfile = {
  id: string;
  email: string;
  name: string;
  initials: string;
  company: string;
};

function initialsFromName(name: string): string {
  return String(name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

export function profileToPortalUser(profile: ApiProfile): PortalUser {
  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    initials: profile.initials || initialsFromName(profile.name),
    company: profile.company || "Aptus account",
  };
}

function userFromSession(session: SessionPayload): PortalUser {
  const name = session.name || session.email || "Customer";
  const overrides = readProfileOverrides();
  return {
    id: session.userId,
    email: overrides.email ?? session.email ?? "",
    name: overrides.name ?? name,
    initials: overrides.initials ?? session.initials ?? initialsFromName(name),
    company: overrides.company ?? session.company ?? "Aptus account",
    avatarDataUrl: overrides.avatarDataUrl,
  };
}

function readSession(): SessionPayload | null {
  if (typeof window === "undefined") {
    return null;
  }
  for (const storage of [window.localStorage, window.sessionStorage]) {
    try {
      const raw = storage.getItem(PORTAL_SESSION_KEY);
      if (!raw) {
        continue;
      }
      const session = JSON.parse(raw) as SessionPayload;
      if (!session.userId || Date.now() > Number(session.expiresAt || 0)) {
        storage.removeItem(PORTAL_SESSION_KEY);
        continue;
      }
      return session;
    } catch {
      storage.removeItem(PORTAL_SESSION_KEY);
    }
  }
  return null;
}

function readProfileOverrides(): Partial<PortalUser> {
  try {
    const raw = window.localStorage.getItem(PORTAL_PROFILE_KEY);
    return raw ? (JSON.parse(raw) as Partial<PortalUser>) : {};
  } catch {
    return {};
  }
}

/** Reads the signed-in portal user from the same storage as aptus_portal_auth.js */
export function getPortalUserFromStorage(): PortalUser | null {
  const session = readSession();
  if (!session) {
    return null;
  }
  const base = PROFILES.find((p) => p.id === session.userId);
  if (!base) {
    return userFromSession(session);
  }
  const overrides = readProfileOverrides();
  return {
    ...base,
    ...overrides,
    id: base.id,
    email: overrides.email ?? session.email ?? base.email,
    name: overrides.name ?? session.name ?? base.name,
  };
}

/** Resolves the current user from the HTTP-only session cookie (API auth). */
export async function fetchPortalUserFromApi(): Promise<PortalUser | null> {
  try {
    const response = await fetch("/api/auth/me", { credentials: "include" });
    if (!response.ok) {
      return null;
    }
    const data = (await response.json()) as { user?: ApiProfile };
    return data.user ? profileToPortalUser(data.user) : null;
  } catch {
    return null;
  }
}

/** Storage first, then API cookie session (matches aptus_portal_auth.js sync). */
export async function resolvePortalUser(): Promise<PortalUser | null> {
  return getPortalUserFromStorage() ?? (await fetchPortalUserFromApi());
}
