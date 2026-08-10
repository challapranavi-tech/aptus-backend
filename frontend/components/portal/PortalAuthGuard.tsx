"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { authFetch, clearLegacyPortalSession } from "@/lib/access-token";

const PROTECTED_PREFIX = "/portal";

async function hasApiSession(): Promise<boolean> {
  try {
    const response = await authFetch("/api/auth/me");
    return response.ok;
  } catch {
    return false;
  }
}

export function PortalAuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [allowed, setAllowed] = useState(() => !pathname.startsWith(PROTECTED_PREFIX));

  useEffect(() => {
    if (!pathname.startsWith(PROTECTED_PREFIX)) {
      setAllowed(true);
      return;
    }

    let cancelled = false;

    hasApiSession()
      .then((ok) => {
        if (cancelled) return;
        if (!ok) {
          clearLegacyPortalSession();
          const next = encodeURIComponent(pathname);
          router.replace(`/login?next=${next}`);
          setAllowed(false);
          return;
        }
        setAllowed(true);
      })
      .catch(() => {
        if (cancelled) return;
        clearLegacyPortalSession();
        const next = encodeURIComponent(pathname);
        router.replace(`/login?next=${next}`);
        setAllowed(false);
      });

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (!allowed) {
    return null;
  }

  return <>{children}</>;
}
