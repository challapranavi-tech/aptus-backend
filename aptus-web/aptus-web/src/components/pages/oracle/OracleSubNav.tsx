"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ORACLE_SUBNAV_LINKS } from "@/lib/cms/oracle-pages-content";
import { Container } from "@/components/ui";

/** Sibling nav tabs on Oracle product pages. */
export function OracleSubNav() {
  const pathname = usePathname();

  return (
    <nav className="adobe-subnav" aria-label="Oracle products">
      <Container>
        <ul className="adobe-subnav__list">
          <li>
            <Link
              href="/oracle"
              className={`adobe-subnav__link${pathname === "/oracle" ? " is-active" : ""}`}
            >
              All Oracle
            </Link>
          </li>
          {ORACLE_SUBNAV_LINKS.map((link) => {
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
