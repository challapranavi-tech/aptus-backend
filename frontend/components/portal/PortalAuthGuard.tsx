"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthProvider";
import { clearLegacyPortalSession } from "@/lib/access-token";

const PROTECTED_PREFIX = "/portal";

/**
 * Gate portal routes on AuthProvider (single /api/auth/me).
 * Confirmed unauthenticated → hard navigate to login (avoids soft-nav redirect cache).
 * Shows a light shell while auth is resolving (avoids a blank hang).
 */
export function PortalAuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, ready } = useAuth();
  const isProtected = pathname.startsWith(PROTECTED_PREFIX);

  useEffect(() => {
    if (!isProtected || !ready || user) return;
    clearLegacyPortalSession();
    // Hard nav: Next soft-nav can replay a cached middleware redirect loop.
    window.location.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [isProtected, ready, user, pathname]);

  if (!isProtected) {
    return <>{children}</>;
  }
  if (!ready || !user) {
    return (
      <div
        className="flex min-h-[40vh] items-center justify-center px-4 text-sm text-slate-500"
        role="status"
        aria-live="polite"
      >
        Loading your account…
      </div>
    );
  }
  return <>{children}</>;
}
