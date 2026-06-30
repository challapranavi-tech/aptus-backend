"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Container } from "@/components/ui";

const ADOBE_INNER_LINKS = [
  { label: "Adobe Business & Creative Solutions", href: "/adobe-business-creative-solutions" },
  { label: "Adobe Acrobat Pro", href: "/adobe-acrobat-pro" },
  { label: "Adobe Illustrator", href: "/adobe-illustrator" },
  { label: "Adobe Photoshop", href: "/adobe-photoshop" },
  { label: "Adobe Premiere Pro", href: "/adobe-premiere-pro" },
] as const;

/** Sibling nav tabs on Adobe product pages — matches live site. */
export function AdobeSubNav() {
  const pathname = usePathname();

  return (
    <nav className="adobe-subnav" aria-label="Adobe products">
      <Container>
        <ul className="adobe-subnav__list">
          {ADOBE_INNER_LINKS.map((link) => {
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
