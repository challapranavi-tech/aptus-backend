export const DEFAULT_NEXT_PATH = "/portal/dashboard";

/**
 * Resolves the post-login redirect target from a `?next=` query string.
 *
 * security: only same-origin absolute paths are accepted, so a crafted
 * `?next=https://evil.example` or protocol-relative `//evil.example` cannot
 * turn the login page into an open redirect.
 */
export function safeNextPath(search: string, fallback: string = DEFAULT_NEXT_PATH): string {
  const raw = new URLSearchParams(search).get("next");
  if (!raw) return fallback;
  return /^\/(?![/\\])/.test(raw) ? raw : fallback;
}
