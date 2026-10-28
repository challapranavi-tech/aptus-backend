import { Container, CmsImage } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { IsoPanel as IsoPanelData } from "@/types/cms";
import Link from "next/link";

interface IsoPanelProps {
  data: IsoPanelData;
}

function CertCard({
  heading,
  headingAccent,
  media,
  downloadHref,
}: IsoPanelData["certificates"][number]) {
  return (
    <article className="aptus-iso-cert-card">
      {(heading || headingAccent) && (
        <header className="aptus-iso-cert-card__header">
          {headingAccent && <p className="aptus-iso-cert-badge">{headingAccent}</p>}
          {heading && <h3 className="aptus-iso-cert-heading">{heading}</h3>}
        </header>
      )}
      {media && (
        <div className="aptus-iso-cert-media">
          <CmsImage
            src={media.src}
            alt={media.alt}
            width={721}
            height={1024}
            className="aptus-iso-cert-media__img"
            sizes="(max-width: 768px) 100vw, (max-width: 1100px) 50vw, 33vw"
          />
        </div>
      )}
      {downloadHref && (
        <div className="aptus-iso-cert-action">
          <Link
            href={downloadHref}
            className="aptus-iso-download-btn"
            target="_blank"
            rel="noopener noreferrer"
          >
            Download certificate
          </Link>
        </div>
      )}
    </article>
  );
}

/** ISO Certifications page — aligned with About Us card language. */
export function IsoPanel({ data }: IsoPanelProps) {
  return (
    <section className="aptus-iso-section" data-section="iso-panel">
      <Container>
        <header className="aptus-iso-hero">
          {data.title && <h1 className="aptus-iso-hero-title">{data.title}</h1>}
          {data.subtitle && <p className="aptus-iso-subtitle">{data.subtitle}</p>}
        </header>

        {(data.introHeading || data.introParagraphs?.length) && (
          <div className="aptus-tint-panel aptus-iso-intro-panel">
            {data.introHeading && (
              <h2 className="aptus-iso-intro-heading">{data.introHeading}</h2>
            )}
            {data.introParagraphs?.map((p, i) => (
              <p key={i} className={cn("aptus-iso-intro-text", i > 0 && "mt-3")}>
                {p}
              </p>
            ))}
          </div>
        )}

        {(data.coreHeading || data.coreItems?.length) && (
          <div className="aptus-iso-core">
            {data.coreHeading && (
              <h2 className="aptus-iso-core-heading">{data.coreHeading}</h2>
            )}
            {data.coreItems && data.coreItems.length > 0 && (
              <ul className="aptus-iso-core-list">
                {data.coreItems.map((item) => (
                  <li key={item} className="aptus-iso-core-item">
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {data.certificates.length > 0 && (
          <div className="aptus-iso-cert-grid">
            {data.certificates.map((cert, i) => (
              <CertCard key={`${cert.headingAccent ?? cert.heading ?? i}`} {...cert} />
            ))}
          </div>
        )}

        {data.footerParagraphs && data.footerParagraphs.length > 0 && (
          <div className="aptus-iso-footer">
            {data.footerParagraphs.map((p, i) => (
              <p key={i} className="aptus-iso-footer-text">
                {p}
              </p>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
