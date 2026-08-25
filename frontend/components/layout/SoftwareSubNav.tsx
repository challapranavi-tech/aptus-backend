"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SoftwareSubNavLink } from "@/data/software-subnav";

interface SoftwareSubNavProps {
  links: SoftwareSubNavLink[];
  label: string;
}

export function SoftwareSubNav({ links, label }: SoftwareSubNavProps) {
  const pathname = usePathname() ?? "";
  const current = pathname.replace(/\/$/, "") || "/";

  return (
    <nav className="aptus-software-subnav" aria-label={label}>
      <ul className="aptus-software-subnav__list">
        {links.map((link) => {
          const href = link.href.replace(/\/$/, "") || "/";
          const active = current === href;
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`aptus-software-subnav__link${active ? " is-active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
