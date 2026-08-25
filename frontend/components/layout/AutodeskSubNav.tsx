"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AUTODESK_SUBNAV_LINKS } from "@/data/autodesk-subnav";

/** Left sidebar sibling links on Autodesk product pages. */
export function AutodeskSubNav() {
  const pathname = usePathname() ?? "";
  const current = pathname.replace(/\/$/, "") || "/";

  return (
    <nav className="aptus-software-subnav" aria-label="Autodesk products">
      <ul className="aptus-software-subnav__list">
        {AUTODESK_SUBNAV_LINKS.map((link) => {
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
