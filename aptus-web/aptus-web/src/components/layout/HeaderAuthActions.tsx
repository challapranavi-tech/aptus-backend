"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { authFetch, clearLegacyPortalSession, logoutViaApi, setAccessToken, syncLegacyPortalSession } from "@/lib/access-token";
import { profileToPortalUser, type PortalUser } from "@/lib/portal-session";

export function HeaderAuthActions() {
  const [user, setUser] = useState<PortalUser | null>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await authFetch("/api/auth/me");
      if (!response.ok) {
        setUser(null);
        if (response.status === 401) {
          clearLegacyPortalSession();
        }
        return;
      }
      const data = (await response.json()) as {
        user?: Parameters<typeof profileToPortalUser>[0];
        accessToken?: string;
        expiresIn?: number;
      };
      if (data.accessToken && data.expiresIn) {
        setAccessToken(data.accessToken, data.expiresIn);
      }
      if (data.user) {
        syncLegacyPortalSession(data.user, true, { silent: true });
        setUser(profileToPortalUser(data.user));
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const onSessionChange = () => void refresh();
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
      if (window.aptusPortalAuth?.logout) {
        await window.aptusPortalAuth.logout();
        return;
      }
      await logoutViaApi();
      setUser(null);
      window.location.href = "/login";
    } catch {
      setUser(null);
      window.location.href = "/login";
    }
  };

  if (!user) {
    return (
      <Link href="/login" className="aptus-masthead__link">
        Login
      </Link>
    );
  }

  return (
    <div className="aptus-header-user">
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
