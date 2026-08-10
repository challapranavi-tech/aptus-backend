import type { OrderLineItem } from "@/types/orders";
import { authFetch, getValidAccessToken } from "./access-token";

const CART_KEY = "aptus:portal-cart";
export const PORTAL_CART_EVENT = "aptus:portal-cart-changed";

export type PortalCartItem = OrderLineItem;

export type PortalCartState = {
  duration: "1year" | "3year";
  items: PortalCartItem[];
};

function emptyCart(): PortalCartState {
  return { duration: "1year", items: [] };
}

export function readPortalCart(): PortalCartState {
  if (typeof window === "undefined") return emptyCart();
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    if (!raw) return emptyCart();
    const parsed = JSON.parse(raw) as PortalCartState;
    if (!parsed || !Array.isArray(parsed.items)) return emptyCart();
    return {
      duration: parsed.duration === "3year" ? "3year" : "1year",
      items: parsed.items
        .filter(
          (item) =>
            item &&
            typeof item.category === "string" &&
            typeof item.productName === "string" &&
            typeof item.quantity === "number",
        )
        .map((item) => ({
          ...item,
          duration: item.duration === "3year" ? "3year" : item.duration === "1year" ? "1year" : undefined,
          purchaseType: item.purchaseType === "renew" ? "renew" : item.purchaseType === "new" ? "new" : undefined,
          packageId: typeof item.packageId === "string" ? item.packageId : undefined,
          levelId: typeof item.levelId === "string" ? item.levelId : undefined,
        })),
    };
  } catch {
    return emptyCart();
  }
}

export function writePortalCart(cart: PortalCartState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new CustomEvent(PORTAL_CART_EVENT, { detail: cart }));
}

export function portalCartCount(cart: PortalCartState = readPortalCart()): number {
  return cart.items.reduce((sum, item) => sum + Math.max(0, item.quantity), 0);
}

export function clearPortalCart(): void {
  writePortalCart(emptyCart());
}

/**
 * Merge local + remote carts for the same product lines.
 * Never sum quantities — reload after a successful persist would double forever.
 * Conflicting qty: keep the higher (covers offline adds that haven't fully round-tripped).
 */
export function mergePortalCarts(local: PortalCartState, remote: PortalCartState): PortalCartState {
  const map = new Map<string, PortalCartItem>();
  for (const item of [...remote.items, ...local.items]) {
    const key = `${item.category}::${item.productName}`;
    const prev = map.get(key);
    map.set(key, {
      ...item,
      quantity: Math.min(999, Math.max(prev?.quantity ?? 0, item.quantity)),
      duration: item.duration ?? prev?.duration,
      purchaseType: item.purchaseType ?? prev?.purchaseType,
      packageId: item.packageId ?? prev?.packageId,
      levelId: item.levelId ?? prev?.levelId,
    });
  }
  return {
    duration: remote.items.length ? remote.duration : local.duration,
    items: Array.from(map.values()),
  };
}

export async function fetchServerPortalCart(): Promise<PortalCartState | null> {
  const token = await getValidAccessToken();
  if (!token) return null;

  const response = await authFetch("/api/cart");
  if (!response.ok) return null;

  const data = (await response.json()) as { cart?: PortalCartState };
  if (!data.cart || !Array.isArray(data.cart.items)) return null;

  return {
    duration: data.cart.duration === "3year" ? "3year" : "1year",
    items: data.cart.items,
  };
}

/** Change signature for a cart. Item order and key order must not affect it. */
export function cartSignature(cart: PortalCartState): string {
  const items = cart.items
    .map((item) =>
      [
        item.category,
        item.productName,
        item.quantity,
        item.duration ?? "",
        item.purchaseType ?? "",
        item.packageId ?? "",
        item.levelId ?? "",
      ].join("\u0000"),
    )
    .sort();
  return [cart.duration, ...items].join("\u0001");
}

/**
 * Signature the server is already known to hold. Every portal panel re-persists on
 * hydration, so without this each page view fired several identical PUTs and burned
 * the cart rate limit — which silently skipped the Odoo CRM cart sync.
 */
let lastPersistedSignature: string | null = null;

export async function persistPortalCartToServer(cart: PortalCartState): Promise<boolean> {
  const token = await getValidAccessToken();
  if (!token) return false;

  const signature = cartSignature(cart);
  if (signature === lastPersistedSignature) return true;

  const response = await authFetch("/api/cart", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cart),
  });
  if (response.ok) lastPersistedSignature = signature;
  return response.ok;
}

export async function syncPortalCartWithServer(): Promise<PortalCartState> {
  const local = readPortalCart();
  const remote = await fetchServerPortalCart();
  if (!remote) return local;

  const merged = mergePortalCarts(local, remote);
  writePortalCart(merged);

  const remoteSignature = cartSignature(remote);
  if (cartSignature(merged) === remoteSignature) {
    lastPersistedSignature = remoteSignature;
  } else {
    await persistPortalCartToServer(merged);
  }
  return merged;
}

export async function clearServerPortalCart(): Promise<void> {
  const token = await getValidAccessToken();
  if (!token) return;
  await authFetch("/api/cart", { method: "DELETE" });
  lastPersistedSignature = null;
}

export async function clearPortalCartEverywhere(): Promise<void> {
  clearPortalCart();
  await clearServerPortalCart();
}
