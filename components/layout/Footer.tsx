import { Container } from "@/components/ui";
import { getSiteConfig } from "@/data";
import Image from "next/image";
import Link from "next/link";

function SocialIcon({ platform }: { platform: string }) {
  switch (platform.toLowerCase()) {
    case "facebook":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      );
    case "linkedin":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      );
    case "twitter":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case "whatsapp":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
        </svg>
      );
    case "youtube":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      );
    default:
      return null;
  }
}

export async function Footer() {
  const { name, logo, footer } = await getSiteConfig();
  const hasReachUs = footer.phone || footer.email || footer.address;

  return (
    <footer className="bg-white text-brand-navy" data-section="footer">
      {/* ── Main content ──────────────────────────────────── */}
      <Container>
        <div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">

          {/* ── Col 1: Brand + social ─────────────────────── */}
          <div>
            <Link href="/" className="inline-block">
              {logo ? (
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  width={logo.width ?? 160}
                  height={logo.height ?? 44}
                  className="h-12 w-auto object-contain"
                  unoptimized
                />
              ) : (
                <span className="text-xl font-bold text-brand-navy">{name}</span>
              )}
            </Link>

            {footer.tagline && (
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                <strong className="font-semibold text-brand-navy">{name}</strong>{" "}
                {footer.tagline.replace(/^Aptus Infotech\s+/i, "")}
              </p>
            )}

            {footer.socialLinks && footer.socialLinks.length > 0 && (
              <div className="mt-5 flex flex-wrap items-center gap-2">
                {footer.socialLinks.map((s) => (
                  <a
                    key={s.platform}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label ?? s.platform}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-blue text-white transition-all hover:bg-brand-blue-dark"
                  >
                    <SocialIcon platform={s.platform} />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* ── Col 2: Map ────────────────────────────────── */}
          {footer.mapEmbedUrl && (
            <div className="overflow-hidden rounded-sm">
              <iframe
                src={footer.mapEmbedUrl}
                title="Office location map"
                width="100%"
                height="220"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                aria-label="Aptus Infotech office location"
              />
            </div>
          )}

          {/* ── Col 3: Link columns ───────────────────────── */}
          {footer.columns.map((column, index) => (
            <div key={column.title ?? index}>
              {column.title && (
                <h3 className="mb-4 text-sm font-semibold text-brand-navy">
                  {column.title}
                </h3>
              )}
              <ul className="space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-brand-green"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* ── Col 4: Reach Us ───────────────────────────── */}
          {hasReachUs && (
            <div>
              <h3 className="mb-4 text-sm font-semibold text-brand-navy">Reach Us</h3>
              <ul className="space-y-3">
                {footer.phone && (
                  <li>
                    <a
                      href={`tel:${footer.phone.replace(/\s/g, "")}`}
                      className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-brand-green"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-brand-green" aria-hidden="true">
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
                      className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-brand-green"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-brand-green" aria-hidden="true">
                        <rect width="20" height="16" x="2" y="4" rx="2" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                      {footer.email}
                    </a>
                  </li>
                )}
                {footer.address && (
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-brand-green" aria-hidden="true">
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
      </Container>

      {/* ── Copyright bar ─────────────────────────────────── */}
      {footer.copyright && (
        <div className="border-t border-border bg-brand-navy py-4">
          <Container>
            <p className="text-center text-xs text-white/50">
              {footer.copyright}
            </p>
          </Container>
        </div>
      )}
    </footer>
  );
}
