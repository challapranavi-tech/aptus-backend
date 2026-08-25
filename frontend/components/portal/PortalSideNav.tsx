"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { PortalNavIcon, type PortalNavIconName } from "./PortalNavIcon";

export type PortalNavEntry = {
  href: string;
  label: string;
  icon: PortalNavIconName;
  /** Extra path prefixes that keep this item active (e.g. licenses ↔ subscriptions). */
  matchHrefs?: string[];
  dividerBefore?: boolean;
};

function isActive(pathname: string, entry: PortalNavEntry): boolean {
  const candidates = [entry.href, ...(entry.matchHrefs ?? [])];
  return candidates.some((href) => pathname === href || pathname.startsWith(`${href}/`));
}

export function PortalSideNav({
  items,
  label,
  horizontal = false,
  renderTrailing,
}: {
  items: readonly PortalNavEntry[];
  label: string;
  horizontal?: boolean;
  renderTrailing?: (href: string, active: boolean) => ReactNode;
}) {
  const pathname = usePathname();

  return (
    <nav
      className={`aptus-portal-sidenav${horizontal ? " aptus-portal-sidenav--horizontal" : ""}`}
      aria-label={label}
    >
      <ul className="aptus-portal-sidenav__list">
        {items.map((entry) => {
          const active = isActive(pathname, entry);
          return (
            <li
              key={entry.href}
              className={entry.dividerBefore ? "aptus-portal-sidenav__item has-divider" : "aptus-portal-sidenav__item"}
            >
              <Link
                href={entry.href}
                className={`aptus-portal-sidenav__link${active ? " is-active" : ""}`}
                data-aptus-section-link={entry.href}
                aria-current={active ? "page" : undefined}
              >
                <PortalNavIcon name={entry.icon} className="aptus-portal-sidenav__icon" />
                <span>{entry.label}</span>
                {renderTrailing ? renderTrailing(entry.href, active) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
