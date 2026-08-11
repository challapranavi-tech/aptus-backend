"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  clearLegacyPortalSession,
  logoutViaApi,
  syncLegacyPortalSession,
} from "@/lib/access-token";
import { fetchAuthMeShared, invalidateAuthMeCache } from "@/lib/auth-me-client";
import {
  PORTAL_CART_EVENT,
  portalCartCount,
  readPortalCart,
  type PortalCartState,
} from "@/lib/portal-cart";
import { invalidatePortalSharedFetch } from "@/lib/portal-shared-fetch";
import { profileToPortalUser, type PortalUser } from "@/lib/portal-session";

const CART_PATH = "/portal/cart";

/**
 * Full document navigation to cart — Next soft-nav can reuse a cached
 * middleware redirect to /login from before the session was established.
 */
function HeaderCartLink({ showBadge }: { showBadge: boolean }) {
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

  return (
    <a
      href={CART_PATH}
      className="aptus-header-cart"
      aria-label={
        showBadge
          ? count > 0
            ? `Cart with ${count} items`
            : "Cart"
          : "Shopping cart"
      }
      title="Shopping cart"
    >
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden focusable="false">
        <path
          fill="currentColor"
          d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM7.2 14h9.45c.75 0 1.41-.41 1.75-1.03l3.24-5.88A1 1 0 0 0 20.76 6H6.21l-.94-2H2v2h2l3.6 7.59-1.35 2.44C5.52 17.37 6.48 19 8 19h12v-2H8l1.2-2z"
        />
      </svg>
      {showBadge && count > 0 ? (
        <span className="aptus-header-cart__badge">{count > 99 ? "99+" : count}</span>
      ) : null}
    </a>
  );
}

export function HeaderAuthActions() {
  const [user, setUser] = useState<PortalUser | null>(null);

  const refresh = useCallback(async () => {
    try {
      const result = await fetchAuthMeShared();
      if (!result.ok) {
        setUser(null);
        if (result.status === 401 || result.status === 403) {
          clearLegacyPortalSession();
        }
        return;
      }
      syncLegacyPortalSession(result.user, true, { silent: true });
      setUser(profileToPortalUser(result.user));
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const onSessionChange = () => {
      invalidateAuthMeCache();
      void refresh();
    };
    void refresh();
    window.addEventListener("storage", onSessionChange);
    window.addEventListener("aptus:session-changed", onSessionChange);
    window.addEventListener("aptus:portal-ready", onSessionChange);
    return () => {
      window.removeEventListener("storage", onSessionChange);
      window.removeEventListener("aptus:session-changed", onSessionChange);
      window.removeEventListener("aptus:portal-ready", onSessionChange);
    };
  }, [refresh]);

  const handleLogout = async () => {
    try {
      await logoutViaApi();
      invalidateAuthMeCache();
      invalidatePortalSharedFetch();
      setUser(null);
      window.location.href = "/login";
    } catch {
      invalidateAuthMeCache();
      invalidatePortalSharedFetch();
      setUser(null);
      window.location.href = "/login";
    }
  };

  if (!user) {
    return (
      <div className="aptus-header-user">
        <HeaderCartLink showBadge={false} />
        <Link href="/login" className="aptus-masthead__link">
          Login
        </Link>
      </div>
    );
  }

  return (
    <div className="aptus-header-user">
      <HeaderCartLink showBadge />
      <Link
        href="/portal/profile"
        className="aptus-header-user__avatar-wrap"
        title={`${user.name} — ${user.company}`}
      >
        {user.avatarDataUrl ? (
          <span
            className="aptus-header-user__avatar has-image"
            style={{ backgroundImage: `url('${user.avatarDataUrl}')` }}
            aria-hidden
          />
        ) : (
          <span className="aptus-header-user__avatar" aria-hidden>
            {user.initials}
          </span>
        )}
      </Link>
      <button
        type="button"
        onClick={() => {
          void handleLogout();
        }}
        data-aptus-logout="true"
        className="aptus-header-user__logout"
      >
        Logout
      </button>
    </div>
  );
}
