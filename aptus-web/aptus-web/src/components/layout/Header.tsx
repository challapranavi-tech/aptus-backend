"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SocialIcon } from "@/components/icons/SocialIcons";
import { HeaderAuthActions } from "@/components/layout/HeaderAuthActions";
import { NAV_ITEMS, type SiteNavLink } from "@/lib/cms/site-nav";
import { SITE, SOCIAL } from "@/lib/constants";

function NavChevron({ direction = "down" }: { direction?: "down" | "right" }) {
  if (direction === "right") {
    return (
      <svg className="aptus-masthead__chevron aptus-masthead__chevron--right" viewBox="0 0 256 512" aria-hidden>
        <path
          fill="currentColor"
          d="M64 448c-8.2 0-16.4-3.1-22.6-9.4s-12.5-32.8 0-45.3L178.7 256 41.4 118.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l160 160c12.5 12.5 12.5 32.8 0 45.3l-160 160c-6.2 6.2-14.4 9.4-22.6 9.4z"
        />
      </svg>
    );
  }

  return (
    <svg className="aptus-masthead__chevron" viewBox="0 0 320 512" aria-hidden>
      <path
        fill="currentColor"
        d="M31.3 192h257.3c17.8 0 26.7 21.5 14.1 34.1L174.1 354.8c-7.8 7.8-20.5 7.8-28.3 0L17.2 226.1C4.6 213.5 13.5 192 31.3 192z"
      />
    </svg>
  );
}

function navItemActive(item: SiteNavLink, pathname: string): boolean {
  if (item.href === "/") return pathname === "/";
  if (item.href && (pathname === item.href || pathname.startsWith(`${item.href}/`))) {
    return true;
  }
  return (item.children ?? []).some((child) => navItemActive(child, pathname));
}

function NavAnchor({
  href,
  className,
  children,
  onClick,
  style,
}: {
  href: string;
  className: string;
  children: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
}) {
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={className} onClick={onClick} style={style}>
        {children}
      </Link>
    );
  }

  return (
    <a href={href} className={className} onClick={onClick} style={style}>
      {children}
    </a>
  );
}

function NavDropdownItem({
  item,
  onNavigate,
  nested = false,
  menuVariant,
}: {
  item: SiteNavLink;
  onNavigate?: () => void;
  nested?: boolean;
  menuVariant?: "software";
}) {
  const linkClass = nested
    ? "aptus-masthead__link aptus-masthead__link--nested"
    : "aptus-masthead__link";
  const chevronDirection = menuVariant === "software" && !nested ? "right" : "down";

  if (item.children?.length) {
    return (
      <li className="aptus-masthead__dropdown aptus-masthead__dropdown--nested">
        {item.href ? (
          <NavAnchor href={item.href} className={`${linkClass} aptus-masthead__link--parent`} onClick={onNavigate}>
            {item.label}
            <NavChevron direction={chevronDirection} />
          </NavAnchor>
        ) : (
          <span
            className={`${linkClass} aptus-masthead__link--parent aptus-masthead__link--flyout-trigger`}
          >
            {item.label}
            <NavChevron direction={chevronDirection} />
          </span>
        )}
        <ul className="aptus-masthead__dropdown-panel aptus-masthead__dropdown-panel--nested">
          {item.children.map((child) => (
            <NavDropdownItem
              key={child.label}
              item={child}
              onNavigate={onNavigate}
              nested
              menuVariant={menuVariant}
            />
          ))}
        </ul>
      </li>
    );
  }

  if (!item.href) return null;

  return (
    <li>
      <NavAnchor href={item.href} className={linkClass} onClick={onNavigate}>
        {item.label}
      </NavAnchor>
    </li>
  );
}

function NavLink({ item, active }: { item: SiteNavLink; active: boolean }) {
  const linkClass = `aptus-masthead__link${active ? " is-active" : ""}`;
  const isSoftwareMenu = item.label === "Software";

  if (item.children?.length) {
    const panelClass = [
      "aptus-masthead__dropdown-panel",
      item.label === "Software" || item.label === "ELV Solutions"
        ? "aptus-masthead__dropdown-panel--wide"
        : "",
      isSoftwareMenu ? "aptus-masthead__dropdown-panel--software" : "",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <li className="aptus-masthead__dropdown">
        <NavAnchor href={item.href ?? "#"} className={linkClass}>
          {item.label}
          <NavChevron />
        </NavAnchor>
        <ul className={panelClass}>
          {item.children.map((child) => (
            <NavDropdownItem
              key={child.label}
              item={child}
              menuVariant={isSoftwareMenu ? "software" : undefined}
            />
          ))}
        </ul>
      </li>
    );
  }

  if (!item.href) return null;

  return (
    <li>
      <NavAnchor href={item.href} className={linkClass}>
        {item.label}
      </NavAnchor>
    </li>
  );
}

function MobileNavItem({
  item,
  onNavigate,
  depth = 0,
}: {
  item: SiteNavLink;
  onNavigate: () => void;
  depth?: number;
}) {
  const padding = { paddingLeft: `${depth * 1}rem` } as const;

  if (item.children?.length) {
    return (
      <>
        {item.href ? (
          <NavAnchor
            href={item.href}
            className="aptus-masthead__link"
            style={padding}
            onClick={onNavigate}
          >
            {item.label}
          </NavAnchor>
        ) : (
          <span className="aptus-masthead__link" style={padding}>
            {item.label}
          </span>
        )}
        <ul className="aptus-masthead__mobile-list">
          {item.children.map((child) => (
            <li key={child.label}>
              <MobileNavItem item={child} onNavigate={onNavigate} depth={depth + 1} />
            </li>
          ))}
        </ul>
      </>
    );
  }

  if (!item.href) return null;

  return (
    <NavAnchor
      href={item.href}
      className="aptus-masthead__link"
      style={padding}
      onClick={onNavigate}
    >
      {item.label}
    </NavAnchor>
  );
}

function MobileNav({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname();

  return (
    <ul className="aptus-masthead__mobile-list">
      {NAV_ITEMS.map((item) => (
        <li key={item.label}>
          {item.children?.length ? (
            <MobileNavItem item={item} onNavigate={onNavigate} />
          ) : (
            <NavAnchor
              href={item.href ?? "/"}
              className={`aptus-masthead__link${navItemActive(item, pathname) ? " is-active" : ""}`}
              onClick={onNavigate}
            >
              {item.label}
            </NavAnchor>
          )}
        </li>
      ))}
      <li className="aptus-masthead__mobile-actions">
        <HeaderAuthActions />
      </li>
    </ul>
  );
}

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="aptus-masthead">
      <div className="aptus-masthead__topbar">
        <div className="aptus-masthead__topbar-inner">
          <div className="aptus-masthead__contact">
            <a href={`tel:${SITE.phone.replace(/\s/g, "")}`}>
              <strong>Contact:</strong> {SITE.phone}
            </a>
            <a href={`mailto:${SITE.email}`}>
              <b>Email:</b> {SITE.email}
            </a>
          </div>
          <div className="aptus-masthead__social">
            <span className="aptus-masthead__social-label">Follow Us</span>
            {SOCIAL.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
              >
                <SocialIcon label={s.label as "Facebook" | "LinkedIn" | "WhatsApp" | "Twitter"} />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="aptus-masthead__nav">
        <div className="aptus-masthead__nav-inner">
          <Link href="/" className="aptus-masthead__brand">
            <Image
              src="/images/Aptus-infotech-orignal-clrs-logo.png"
              alt="Aptus Infotech"
              width={220}
              height={89}
              priority
            />
          </Link>

          <div className="aptus-masthead__center">
            <ul className="aptus-masthead__menu" aria-label="Main">
              {NAV_ITEMS.map((item) => (
                <NavLink key={item.label} item={item} active={navItemActive(item, pathname)} />
              ))}
            </ul>
            <div className="aptus-masthead__actions">
              <HeaderAuthActions />
            </div>
          </div>

          <button
            type="button"
            className="aptus-masthead__toggler"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
          >
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        <div className={`aptus-masthead__mobile${mobileOpen ? " is-open" : ""}`} aria-label="Mobile menu">
          <MobileNav onNavigate={() => setMobileOpen(false)} />
        </div>
      </div>
    </header>
  );
}
