import { fetchAuthMeShared } from "@/lib/auth-me-client";

/** Redirect unauthenticated users to sign in before purchasing. Returns true when signed in. */
export async function ensureSignedInForPurchase(message?: (text: string) => void): Promise<boolean> {
  const me = await fetchAuthMeShared();
  if (me.ok) return true;

  message?.("Sign in to purchase this product. Redirecting to sign in…");

  const next = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  window.setTimeout(() => {
    window.location.href = `/login?next=${encodeURIComponent(next)}`;
  }, 1400);

  return false;
}
