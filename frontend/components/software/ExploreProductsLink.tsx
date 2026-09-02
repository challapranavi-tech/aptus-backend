"use client";

import { softwareCatalogHref } from "@/lib/software-catalog-links";
import {
  SOFTWARE_CATALOG_ANCHOR_ID,
  scheduleScrollToSoftwareCatalog,
} from "@/lib/scroll-to-software-catalog";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type ExploreProductsLinkProps = Omit<ComponentPropsWithoutRef<typeof Link>, "href" | "children"> & {
  brandId?: string;
  children: ReactNode;
};

export function ExploreProductsLink({ brandId, children, onClick, ...rest }: ExploreProductsLinkProps) {
  const pathname = usePathname() ?? "/";
  const onCatalogPage = pathname === "/software-solutions/products";
  const href = onCatalogPage ? `#${SOFTWARE_CATALOG_ANCHOR_ID}` : softwareCatalogHref(brandId);

  return (
    <Link
      href={href}
      {...rest}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;

        if (onCatalogPage) {
          event.preventDefault();
          window.history.pushState(null, "", `#${SOFTWARE_CATALOG_ANCHOR_ID}`);
          scheduleScrollToSoftwareCatalog();
        }
      }}
    >
      {children}
    </Link>
  );
}
