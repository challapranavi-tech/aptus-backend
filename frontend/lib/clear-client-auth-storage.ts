/**
 * Browser storage hygiene (OWASP session management).
 *
 * Clears client-side portal session helpers. HttpOnly refresh cookies are
 * cleared by /api/auth/logout.
 *
 * security: call from authenticated logout paths only.
 */
export function clearClientAuthStorage(): void {
  if (typeof window === "undefined") return;

  const AUTH_KEYS = ["aptusPortalSession", "aptusPortalProfile"];

  try {
    for (const key of AUTH_KEYS) {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    }
  } catch {
    // Private mode / disabled storage — ignore
  }
}
