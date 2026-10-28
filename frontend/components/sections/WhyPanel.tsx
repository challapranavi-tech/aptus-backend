import { Container, CmsImage } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { WhyPanel as WhyPanelData } from "@/types/cms";

interface WhyPanelProps {
  data: WhyPanelData;
}

function WhyPanelRow({
  heading,
  bullets,
  media,
  imagePosition = "right",
}: WhyPanelData["rows"][number]) {
  const imageRight = imagePosition === "right";
  const imageBlock = media ? (
    <CmsImage
      src={media.src}
      alt={media.alt}
      width={media.width ?? 768}
      height={media.height ?? 300}
      className="h-auto w-full rounded-2xl object-cover shadow-[0_10px_30px_rgba(0,0,0,0.1)]"
      sizes="(max-width: 1024px) 100vw, 50vw"
    />
  ) : null;

  return (
    <div className="aptus-tint-panel my-4 mb-8 p-4">
      <div className={cn(media && "grid items-center gap-10 lg:grid-cols-2 lg:gap-12")}>
        {media && !imageRight && <div>{imageBlock}</div>}
        <div>
          {heading && <h3 className="aptus-why-row-heading">{heading}</h3>}
          {bullets && bullets.length > 0 && (
            <ul className="mt-5 space-y-2 text-left">
              {bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-3 text-black" style={{ fontSize: 'var(--text-base)' }}>
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-green" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        {media && imageRight && <div>{imageBlock}</div>}
      </div>
    </div>
  );
}

/** Why Aptus — title + panel rows + privacy diagram, then alliances below (post-1275). */
export function WhyPanel({ data }: WhyPanelProps) {
  return (
    <section className="section-padding bg-white" data-section="why-panel">
      <Container>
        {data.title && <h2 className="aptus-page-heading">{data.title}</h2>}

        {data.rows.map((row, i) => (
          <WhyPanelRow key={i} {...row} />
        ))}

        {(data.privacyHeading || data.privacyMedia) && (
          <div className="mt-8 text-start">
            {data.privacyHeading && (
              <h3 className="aptus-why-privacy-title">{data.privacyHeading}</h3>
            )}
            {data.privacyMedia && (
              <div className="mx-auto mt-6 max-w-[750px]">
                <CmsImage
                  src={data.privacyMedia.src}
                  alt={data.privacyMedia.alt}
                  width={750}
                  height={500}
                  className="mx-auto h-auto w-full object-contain"
                  sizes="(max-width: 750px) 100vw, 750px"
                />
              </div>
            )}
          </div>
        )}
      </Container>
    </section>
  );
}
