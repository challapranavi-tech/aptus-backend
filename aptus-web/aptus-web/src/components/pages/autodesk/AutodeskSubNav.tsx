"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AUTODESK_SUBNAV_LINKS } from "@/lib/cms/autodesk-pages-content";
import { Container } from "@/components/ui";

/** Sibling nav tabs on Autodesk product pages. */
export function AutodeskSubNav() {
  const pathname = usePathname();

  return (
    <nav className="adobe-subnav" aria-label="Autodesk products">
      <Container>
        <ul className="adobe-subnav__list">
          <li>
            <Link
              href="/autodesk"
              className={`adobe-subnav__link${pathname === "/autodesk" ? " is-active" : ""}`}
            >
              All Autodesk
            </Link>
          </li>
          {AUTODESK_SUBNAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`adobe-subnav__link${active ? " is-active" : ""}`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </Container>
    </nav>
  );
}
