"use client";

import { useEffect, useState } from "react";
import {
  PORTAL_CART_EVENT,
  portalCartCount,
  readPortalCart,
  type PortalCartState,
} from "@/lib/portal-cart";

/** Live count of items in the portal cart (localStorage + cross-tab/events). */
export function usePortalCartCount(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const sync = (cart?: PortalCartState) => {
      setCount(portalCartCount(cart ?? readPortalCart()));
    };
    sync();
    const onStorage = (event: StorageEvent) => {
      if (event.key === "aptus:portal-cart") sync();
    };
    const onCart = (event: Event) => {
      sync((event as CustomEvent<PortalCartState>).detail);
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(PORTAL_CART_EVENT, onCart);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(PORTAL_CART_EVENT, onCart);
    };
  }, []);

  return count;
}
