"use client";

import { SocialIcon } from "@/components/SocialIcon";
import { Container } from "@/components/ui";
import { useLocale } from "@/context/LocaleProvider";
import { translateNavLabel } from "@/locales/messages";
import { resolveCmsImageSrc } from "@/lib/utils";
import type { SiteConfig } from "@/types";
import Image from "next/image";
import Link from "next/link";

export function FooterClient({
  name,
  logo,
  footer,
}: {
  name: string;
  logo: SiteConfig["logo"];
  footer: SiteConfig["footer"];
}) {
  const { locale, t } = useLocale();
  const hasReachUs = footer.phone || footer.email || footer.address;
  const footerLogo = footer.logo ?? logo;

  return (
    <footer className="border-t" data-section="footer">
      <Container>
        <div className="grid items-start gap-4 py-5 sm:grid-cols-2 sm:gap-5 sm:py-6 lg:grid-cols-[1.35fr_1.1fr_1.55fr] lg:gap-x-6 lg:gap-y-4 lg:py-7">
          <div className="aptus-footer-brand min-w-0">
            <Link href="/" className="aptus-footer-logo-link">
              {footerLogo ? (
                <Image
                  src={resolveCmsImageSrc(footerLogo.src)}
                  alt={footerLogo.alt}
                  width={footerLogo.width ?? 180}
                  height={footerLogo.height ?? 48}
                  className="aptus-footer-logo object-contain"
                  unoptimized
                />
              ) : (
                <span
                  className="text-white"
                  style={{ fontSize: "var(--text-xl)", fontWeight: 700 }}
                >
                  {name}
                </span>
              )}
            </Link>

          </div>

          {footer.mapEmbedUrl && (
            <div className="flex min-w-0 items-center justify-center">
              <div className="aptus-footer-map relative aspect-[5/3] w-full max-w-[18rem] overflow-hidden rounded-md sm:max-w-none lg:aspect-[5/3]">
                <iframe
                  src={footer.mapEmbedUrl}
                  title="Office location map"
                  className="absolute inset-0 h-full w-full"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  aria-label="Aptus Infotech office location"
                />
              </div>
            </div>
          )}

          <div className="grid min-w-0 grid-cols-1 gap-x-5 gap-y-4 min-[420px]:grid-cols-2 sm:col-span-2 lg:col-span-1">
            {footer.columns.map((column, index) => (
              <div key={column.title ?? index} className="min-w-0">
                {column.title && (
                  <h3
                    className="aptus-footer-heading aptus-footer-heading--compact mb-1.5"
                    style={{ fontSize: "0.8rem", fontWeight: 700 }}
                  >
                    {/quick links/i.test(column.title)
                      ? t.footer.quickLinks
                      : column.title}
                  </h3>
                )}
                <ul className="space-y-1">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="aptus-footer-col-text aptus-footer-link"
                        style={{ fontSize: "0.75rem" }}
                      >
                        {translateNavLabel(locale, link.href, link.label)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {hasReachUs && (
              <div className="min-w-0">
                <h3
                  className="aptus-footer-heading mb-1.5"
                  style={{ fontSize: "0.8rem", fontWeight: 700 }}
                >
                  {t.footer.reachUs}
                </h3>
                <ul className="space-y-1.5">
                  {footer.phone && (
                    <li>
                      <a
                        href={`tel:${footer.phone.replace(/\s/g, "")}`}
                        className="aptus-footer-col-text aptus-footer-link flex items-center gap-2.5"
                        style={{ fontSize: "0.75rem" }}
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="shrink-0"
                          aria-hidden="true"
                        >
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.6 1.24h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.86a16 16 0 0 0 6.13 6.13l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                        {footer.phone}
                      </a>
                    </li>
                  )}
                  {footer.email && (
                    <li>
                      <a
                        href={`mailto:${footer.email}`}
                        className="aptus-footer-col-text aptus-footer-link flex items-center gap-2.5"
                        style={{ fontSize: "0.75rem" }}
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="shrink-0"
                          aria-hidden="true"
                        >
                          <rect width="20" height="16" x="2" y="4" rx="2" />
                          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                        </svg>
                        {footer.email}
                      </a>
                    </li>
                  )}
                  {footer.address && (
                    <li
                      className="aptus-footer-col-text flex items-start gap-2.5"
                      style={{ fontSize: "0.75rem" }}
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mt-0.5 shrink-0"
                        aria-hidden="true"
                      >
                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      {footer.address}
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>

        {footer.socialLinks && footer.socialLinks.length > 0 && (
          <div className="aptus-footer-follow border-t pt-2.5 pb-0.5">
            <h3
              className="aptus-footer-heading aptus-footer-heading--compact mb-1.5"
              style={{ fontSize: "0.8rem", fontWeight: 700 }}
            >
              {t.topBar.followUs}
            </h3>
            <div className="flex flex-wrap items-center gap-1.5">
              {footer.socialLinks.map((s) => (
                <a
                  key={s.platform}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label ?? s.platform}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-blue text-white transition-all hover:bg-brand-blue-dark"
                >
                  <SocialIcon platform={s.platform} size={10} />
                </a>
              ))}
            </div>
          </div>
        )}
      </Container>

      {footer.copyright && (
        <div className="aptus-footer-copyright border-t py-2.5">
          <Container>
            <p className="text-center" style={{ fontSize: "0.75rem" }}>
              {footer.copyright}
            </p>
          </Container>
        </div>
      )}
    </footer>
  );
}
