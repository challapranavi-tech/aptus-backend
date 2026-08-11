"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthProvider";
import { clearLegacyPortalSession } from "@/lib/access-token";

const PROTECTED_PREFIX = "/portal";

/**
 * Gate portal routes on AuthProvider (single /api/auth/me), not a second me check.
 * Renders nothing while auth is resolving so we never bounce a valid session to login.
 */
export function PortalAuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, ready } = useAuth();
  const isProtected = pathname.startsWith(PROTECTED_PREFIX);

  useEffect(() => {
    if (!isProtected || !ready) return;
    if (user) return;
    clearLegacyPortalSession();
    router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [isProtected, ready, user, pathname, router]);

  if (!isProtected) {
    return <>{children}</>;
  }
  if (!ready || !user) {
    return null;
  }
  return <>{children}</>;
}
