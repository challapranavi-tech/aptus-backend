"use client";

import { isSoftwareCatalogHash, scheduleScrollToSoftwareCatalog } from "@/lib/scroll-to-software-catalog";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

/** Scroll to #software-catalog after client navigation or in-page hash changes. */
export function SoftwareCatalogHashScroll() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname !== "/software-solutions") return;
    if (!isSoftwareCatalogHash(window.location.hash)) return;
    scheduleScrollToSoftwareCatalog();
  }, [pathname, searchParams]);

  useEffect(() => {
    function onHashChange() {
      if (pathname !== "/software-solutions") return;
      if (!isSoftwareCatalogHash(window.location.hash)) return;
      scheduleScrollToSoftwareCatalog();
    }

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [pathname]);

  return null;
}
