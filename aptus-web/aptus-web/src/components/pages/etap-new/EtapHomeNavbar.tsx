"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useEtapHomeData } from "./EtapHomeDataContext";

export function EtapHomeNavbar() {
  const { navbar, navItems } = useEtapHomeData();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openItem, setOpenItem] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => {
      /* sticky shadow handled via CSS */
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <header ref={navRef} className="etap-home-nav">
      <div className="etap-home-nav__inner">
        <Link href="/etap_new" className="etap-home-nav__brand" aria-label="Aptus Infotech — ETAP">
          <span className="etap-home-nav__brand-aptus">
            <Image
              src={navbar.aptusLogo}
              alt={navbar.aptusLogoAlt}
              width={80}
              height={24}
              className="aptus-logo"
              priority
            />
          </span>
          <span className="etap-home-nav__brand-divider" aria-hidden="true" />
          <span className="etap-home-nav__brand-etap">
            <Image
              src={navbar.etapLogo}
              alt={navbar.etapLogoAlt}
              width={155}
              height={64}
              className="etap-logo"
              priority
            />
          </span>
        </Link>

        <ul className="etap-home-nav__menu">
          {navItems.map((item) => (
            <li
              key={item.label}
              className={`etap-home-nav__item${openItem === item.label ? " is-open" : ""}`}
              onMouseEnter={() => setOpenItem(item.label)}
              onMouseLeave={() => setOpenItem(null)}
            >
              <button type="button" className="etap-home-nav__link">
                {item.label}
              </button>
              {"mega" in item && item.mega ? (
                <div className="etap-home-nav__dropdown etap-home-nav__mega">
                  <div className="etap-home-nav__mega-grid">
                    {item.columns?.map((col) => (
                      <div key={col.header}>
                        <p className="etap-home-nav__mega-header">{col.header}</p>
                        {col.links.map((link) => (
                          <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer">
                            {link.label}
                          </a>
                        ))}
                      </div>
                    ))}
                    {item.sidebar ? (
                      <div className="etap-home-nav__sidebar">
                        <Image
                          src={item.sidebar.image}
                          alt={item.sidebar.imageAlt}
                          width={180}
                          height={120}
                        />
                        <a href={item.sidebar.linkHref} target="_blank" rel="noopener noreferrer">
                          {item.sidebar.linkLabel}
                        </a>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : item.links ? (
                <div className="etap-home-nav__dropdown">
                  {item.links.map((link) => (
                    <a key={link.label} href={link.href} target={link.href.startsWith("/") ? undefined : "_blank"} rel="noopener noreferrer">
                      {link.label}
                    </a>
                  ))}
                </div>
              ) : null}
            </li>
          ))}
        </ul>

        <div className="etap-home-nav__ctas">
          <Link href={navbar.primaryCta.href} className="btn-aptus-primary">
            {navbar.primaryCta.label}
          </Link>
          <Link href={navbar.secondaryCta.href} className="btn-aptus-secondary">
            {navbar.secondaryCta.label}
          </Link>
        </div>

        <button
          type="button"
          className="etap-home-nav__toggle"
          aria-label="Toggle menu"
          onClick={() => setMobileOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <div className={`etap-home-nav__mobile${mobileOpen ? " is-open" : ""}`}>
        {navItems.map((item) => (
          <div key={item.label} className="etap-home-nav__mobile-group">
            <p className="etap-home-nav__mobile-label">{item.label}</p>
            {item.links?.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="etap-home-nav__mobile-link"
                target={link.href.startsWith("/") ? undefined : "_blank"}
                rel={link.href.startsWith("/") ? undefined : "noopener noreferrer"}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
            {item.columns?.flatMap((col) =>
              col.links.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="etap-home-nav__mobile-link"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              )),
            )}
          </div>
        ))}
        <div className="etap-home-nav__mobile-ctas">
          <Link href={navbar.primaryCta.href} className="btn-aptus-primary" onClick={() => setMobileOpen(false)}>
            {navbar.primaryCta.label}
          </Link>
          <Link href={navbar.secondaryCta.href} className="btn-aptus-secondary" onClick={() => setMobileOpen(false)}>
            {navbar.secondaryCta.label}
          </Link>
        </div>
      </div>
    </header>
  );
}
