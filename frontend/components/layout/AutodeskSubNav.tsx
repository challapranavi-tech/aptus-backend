"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AUTODESK_SUBNAV_LINKS } from "@/data/autodesk-subnav";

/** Left sidebar sibling links on Autodesk product pages. */
export function AutodeskSubNav() {
  const pathname = usePathname();

  return (
    <nav className="aptus-software-subnav" aria-label="Autodesk products">
      <ul className="aptus-software-subnav__list">
        {AUTODESK_SUBNAV_LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className={`aptus-software-subnav__link${pathname === link.href ? " is-active" : ""}`}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
