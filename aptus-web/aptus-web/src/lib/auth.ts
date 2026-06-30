export type PortalUser = {
  id: string;
  email: string;
  password: string;
  name: string;
  company: string;
  role: string;
  phone: string;
  accountManager: string;
  supportEmail: string;
};

export const SESSION_KEY = "aptus_portal_session";

export const DEMO_USERS: PortalUser[] = [];

export type SessionUser = Omit<PortalUser, "password">;

export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function validateCredentials(
  email: string,
  password: string,
): SessionUser | null {
  const normalized = email.trim().toLowerCase();
  const user = DEMO_USERS.find(
    (u) => u.email.toLowerCase() === normalized && u.password === password,
  );
  if (!user) return null;
  const { password: _stored, ...session } = user;
  void _stored;
  return session;
}

function isSessionUser(value: unknown): value is SessionUser {
  if (!value || typeof value !== "object") return false;
  const u = value as Record<string, unknown>;
  return (
    typeof u.id === "string" &&
    typeof u.email === "string" &&
    typeof u.name === "string" &&
    typeof u.company === "string"
  );
}

export function readSession(): SessionUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isSessionUser(parsed)) {
      clearSession();
      return null;
    }
    return parsed;
  } catch {
    clearSession();
    return null;
  }
}

export function writeSession(user: SessionUser, persistent: boolean): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  if (!persistent) {
    sessionStorage.setItem(SESSION_KEY, "1");
  } else {
    sessionStorage.removeItem(SESSION_KEY);
  }
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}
