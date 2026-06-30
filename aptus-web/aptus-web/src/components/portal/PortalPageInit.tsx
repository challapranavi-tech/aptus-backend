"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/** Re-runs aptus_portal_auth after Next.js client navigations (boot only runs once on first load). */
export function PortalPageInit() {
  const pathname = usePathname();

  useEffect(() => {
    const init = () => {
      const refresh = window.aptusPortalAuth?.refreshPortal;
      if (refresh) {
        Promise.resolve(refresh()).catch(() => {
          /* portal refresh is best-effort */
        });
      }
    };

    init();

    if (!window.aptusPortalAuth?.refreshPortal) {
      window.addEventListener("aptus:portal-ready", init, { once: true });
      return () => window.removeEventListener("aptus:portal-ready", init);
    }
  }, [pathname]);

  return null;
}
