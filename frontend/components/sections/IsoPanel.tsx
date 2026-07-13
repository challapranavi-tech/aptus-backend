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
    <div className="aptus-iso-cert-card">
      {(heading || headingAccent) && (
        <h3 className="aptus-iso-cert-heading">
          {heading}
          {heading && headingAccent && (
            <>
              <br />
              {headingAccent}
            </>
          )}
          {!heading && headingAccent}
        </h3>
      )}
      {media && (
        <div className="aptus-iso-cert-media">
          <CmsImage
            src={media.src}
            alt={media.alt}
            width={721}
            height={1024}
            className="mx-auto h-auto w-full max-w-[721px] object-contain"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        </div>
      )}
      {downloadHref && (
        <div className="aptus-iso-cert-action">
          <Link href={downloadHref} className="aptus-iso-download-btn" target="_blank" rel="noopener noreferrer">
            Download
          </Link>
        </div>
      )}
    </div>
  );
}

/** ISO Certifications page — post-3375 layout. */
export function IsoPanel({ data }: IsoPanelProps) {
  return (
    <section className="bg-white pb-10 pt-6" data-section="iso-panel">
      <Container>
        {data.title && <h1 className="aptus-iso-hero-title">{data.title}</h1>}
        {data.subtitle && <p className="aptus-iso-subtitle">{data.subtitle}</p>}

        {(data.introHeading || data.introParagraphs?.length) && (
          <div className="mt-6">
            {data.introHeading && <h2 className="aptus-iso-intro-heading">{data.introHeading}</h2>}
            {data.introParagraphs?.map((p, i) => (
              <p key={i} className={cn("aptus-iso-intro-text", i === 0 ? "mt-3" : "mt-2")}>
                {p}
              </p>
            ))}
          </div>
        )}

        {(data.coreHeading || data.coreItems?.length) && (
          <div className="mt-8">
            {data.coreHeading && <h2 className="aptus-iso-core-heading">{data.coreHeading}</h2>}
            {data.coreItems?.map((item, i) => (
              <p key={i} className="aptus-iso-core-item">
                {item}
              </p>
            ))}
          </div>
        )}

        {data.certificates.length > 0 && (
          <div className="aptus-iso-cert-grid mt-8">
            {data.certificates.map((cert, i) => (
              <CertCard key={i} {...cert} />
            ))}
          </div>
        )}

        {data.footerParagraphs?.map((p, i) => (
          <p key={i} className={cn("aptus-iso-footer-text", i === 0 ? "mt-8" : "mt-3")}>
            {p}
          </p>
        ))}
      </Container>
    </section>
  );
}
