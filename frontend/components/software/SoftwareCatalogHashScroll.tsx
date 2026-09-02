"use client";

import { scheduleScrollToSoftwareCatalog } from "@/lib/scroll-to-software-catalog";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const CATALOG_PATH = "/software-solutions/products";

/** Scroll to catalog after brand filter navigation on the products page. */
export function SoftwareCatalogHashScroll() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname !== CATALOG_PATH) return;
    if (!searchParams.get("brand")) return;
    scheduleScrollToSoftwareCatalog();
  }, [pathname, searchParams]);

  return null;
}
