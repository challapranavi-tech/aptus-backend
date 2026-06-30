"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MICROSOFT_SUBNAV_LINKS } from "@/lib/cms/microsoft-pages-content";
import { Container } from "@/components/ui";

/** Sibling nav tabs on Microsoft product pages. */
export function MicrosoftSubNav() {
  const pathname = usePathname();

  return (
    <nav className="adobe-subnav" aria-label="Microsoft products">
      <Container>
        <ul className="adobe-subnav__list">
          <li>
            <Link
              href="/microsoft"
              className={`adobe-subnav__link${pathname === "/microsoft" ? " is-active" : ""}`}
            >
              All Microsoft
            </Link>
          </li>
          {MICROSOFT_SUBNAV_LINKS.map((link) => {
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
