"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import type { SoftwareSubNavLink } from "@/data/software-subnav";

interface SoftwareSubNavProps {
  links: readonly SoftwareSubNavLink[];
  label: string;
  /** Match nested routes (portal sections). Default: exact pathname only. */
  matchPrefix?: boolean;
  horizontal?: boolean;
  renderTrailing?: (link: SoftwareSubNavLink, active: boolean) => ReactNode;
}

function isLinkActive(pathname: string, href: string, matchPrefix: boolean): boolean {
  if (matchPrefix) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }
  return pathname === href;
}

export function SoftwareSubNav({
  links,
  label,
  matchPrefix = false,
  horizontal = false,
  renderTrailing,
}: SoftwareSubNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className={`aptus-software-subnav${horizontal ? " aptus-software-subnav--horizontal" : ""}`}
      aria-label={label}
    >
      <ul className="aptus-software-subnav__list">
        {links.map((link) => {
          const active = isLinkActive(pathname, link.href, matchPrefix);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`aptus-software-subnav__link${active ? " is-active" : ""}`}
                data-aptus-section-link={link.href}
                aria-current={active ? "page" : undefined}
              >
                <span>{link.label}</span>
                {renderTrailing ? renderTrailing(link, active) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
