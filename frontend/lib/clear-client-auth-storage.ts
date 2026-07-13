/**
 * Browser storage hygiene (OWASP session management).
 *
 * Aptus has no end-user auth cookies or tokens today. This helper exists so
 * that if auth is added later, logout can clear client stores in one place —
 * and so any accidental writes can be wiped without inventing a login UI.
 *
 * security: call only from a future authenticated logout path (or ops tooling).
 * Do not use for normal browsing — it would wipe unrelated site data if we
 * later store non-auth preferences in these stores.
 */
export function clearClientAuthStorage(): void {
  if (typeof window === "undefined") return;

  try {
    // Prefer selective removal when auth keys are known; full clear is the
    // safe default while HAS_END_USER_SESSIONS is false and nothing is stored.
    window.localStorage.clear();
    window.sessionStorage.clear();
  } catch {
    // Private mode / disabled storage — ignore
  }

  // Clear any non-HttpOnly cookies this origin may have set (none for auth today).
  try {
    const cookies = document.cookie ? document.cookie.split(";") : [];
    for (const part of cookies) {
      const name = part.split("=")[0]?.trim();
      if (!name) continue;
      document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
    }
  } catch {
    // ignore
  }
}
