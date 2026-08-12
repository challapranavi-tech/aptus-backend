import { SocialIcon } from "@/components/SocialIcon";
import { Container } from "@/components/ui";
import { getSiteConfig } from "@/data";
import { resolveCmsImageSrc } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

export async function Footer() {
  const { name, logo, footer } = await getSiteConfig();
  const hasReachUs = footer.phone || footer.email || footer.address;

  return (
    <footer className="border-t border-border bg-white text-black" data-section="footer">
      {/* ── Main content ──────────────────────────────────── */}
      <Container>
        <div className="grid items-start gap-5 py-6 sm:grid-cols-2 sm:gap-5 sm:py-7 lg:grid-cols-[1.3fr_1.15fr_1.55fr] lg:gap-x-8 lg:gap-y-6 lg:py-8">

          {/* ── Col 1: Brand + social ─────────────────────── */}
          <div className="aptus-footer-brand min-w-0">
            <Link href="/" className="aptus-footer-logo-link">
              {logo ? (
                <Image
                  src={resolveCmsImageSrc(logo.src)}
                  alt={logo.alt}
                  width={logo.width ?? 160}
                  height={logo.height ?? 44}
                  className="aptus-footer-logo object-contain"
                  unoptimized
                />
              ) : (
                <span className="text-black" style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>{name}</span>
              )}
            </Link>

            {footer.tagline && (
              <p className="aptus-footer-col-text mt-2.5 leading-snug text-muted-foreground" style={{ fontSize: 'var(--text-sm)' }}>
                <strong className="font-semibold text-black">{name}</strong>{" "}
                {footer.tagline.replace(/^Aptus Infotech\s+/i, "")}
              </p>
            )}

            {footer.socialLinks && footer.socialLinks.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {footer.socialLinks.map((s) => (
                  <a
                    key={s.platform}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label ?? s.platform}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-blue text-white transition-all hover:bg-brand-blue-dark"
                  >
                    <SocialIcon platform={s.platform} />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* ── Col 2: Map ────────────────────────────────── */}
          {footer.mapEmbedUrl && (
            <div className="flex min-w-0 items-center justify-center lg:pl-5">
              <div className="aptus-footer-map relative aspect-[4/3] w-full overflow-hidden rounded-sm">
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

          {/* ── Col 3: Company + Reach Us (aligned pair) ──── */}
          <div className="grid min-w-0 grid-cols-1 gap-x-6 gap-y-4 min-[420px]:grid-cols-2 sm:col-span-2 lg:col-span-1 lg:gap-x-8">
            {footer.columns.map((column, index) => (
              <div key={column.title ?? index} className="min-w-0">
                {column.title && (
                  <h3 className="mb-2.5 text-black" style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>
                    {column.title}
                  </h3>
                )}
                <ul className="space-y-1.5">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="aptus-footer-col-text text-brand-blue transition-colors hover:text-brand-green"
                        style={{ fontSize: 'var(--text-sm)' }}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {hasReachUs && (
              <div className="min-w-0">
                <h3 className="mb-2.5 text-black" style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>Reach Us</h3>
                <ul className="space-y-1.5">
                  {footer.phone && (
                    <li>
                      <a
                        href={`tel:${footer.phone.replace(/\s/g, "")}`}
                        className="aptus-footer-col-text flex items-center gap-2 text-brand-blue transition-colors hover:text-brand-green"
                        style={{ fontSize: 'var(--text-sm)' }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-brand-blue" aria-hidden="true">
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
                        className="aptus-footer-col-text flex items-center gap-2 text-brand-blue transition-colors hover:text-brand-green"
                        style={{ fontSize: 'var(--text-sm)' }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-brand-blue" aria-hidden="true">
                          <rect width="20" height="16" x="2" y="4" rx="2" />
                          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                        </svg>
                        {footer.email}
                      </a>
                    </li>
                  )}
                  {footer.address && (
                    <li className="aptus-footer-col-text flex items-start gap-2 text-brand-blue" style={{ fontSize: 'var(--text-sm)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-brand-blue" aria-hidden="true">
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
      </Container>

      {/* ── Copyright bar ─────────────────────────────────── */}
      {footer.copyright && (
        <div className="border-t border-border py-2.5">
          <Container>
            <p className="text-center text-muted-foreground" style={{ fontSize: 'var(--text-sm)' }}>
              {footer.copyright}
            </p>
          </Container>
        </div>
      )}
    </footer>
  );
}
