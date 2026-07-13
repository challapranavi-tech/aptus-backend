import { Container, CmsImage } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { PolicyPanel as PolicyPanelData } from "@/types/cms";

interface PolicyPanelProps {
  data: PolicyPanelData;
}

function PolicyRow({
  paragraphs,
  media,
  imagePosition = "right",
  imageWidth,
}: PolicyPanelData["rows"][number]) {
  const imageRight = imagePosition === "right";
  const imageBlock = media ? (
    <CmsImage
      src={media.src}
      alt={media.alt}
      width={media.width ?? 555}
      height={media.height ?? 357}
      className={cn("h-auto object-contain", imageWidth ?? "w-full")}
      sizes="(max-width: 1024px) 100vw, 50vw"
    />
  ) : null;

  return (
    <div className="aptus-tint-panel my-4 p-4">
      <div className={cn(media && "grid items-center gap-6 lg:grid-cols-2 lg:gap-8")}>
        {media && !imageRight && <div className="flex justify-center lg:justify-start">{imageBlock}</div>}
        <div>
          {paragraphs?.map((p, i) => (
            <p key={i} className={cn("aptus-policy-row-text", i > 0 && "mt-4")}>
              {p}
            </p>
          ))}
        </div>
        {media && imageRight && <div className="flex justify-center lg:justify-end">{imageBlock}</div>}
      </div>
    </div>
  );
}

/** Aptus Policy — one outer tinted panel (post-1274). */
export function PolicyPanel({ data }: PolicyPanelProps) {
  return (
    <section className="section-padding bg-white" data-section="policy-panel">
      <Container>
        <div className="aptus-tint-panel my-4 mb-8 p-4 sm:p-6">
          {data.modusTitle && <h2 className="aptus-policy-modus-title">{data.modusTitle}</h2>}

          {data.infographic && (
            <div className="mt-4 flex justify-start">
              <CmsImage
                src={data.infographic.src}
                alt={data.infographic.alt}
                width={1024}
                height={455}
                className="h-auto w-full max-w-4xl object-contain"
                sizes="(max-width: 1024px) 100vw, 800px"
              />
            </div>
          )}

          {(data.qualificationHeading || data.qualificationHeadingAccent) && (
            <h3 className="aptus-policy-section-title mt-8">
              {data.qualificationHeading}
              {data.qualificationHeading && data.qualificationHeadingAccent && " "}
              {data.qualificationHeadingAccent}
            </h3>
          )}

          {data.rows.map((row, i) => (
            <PolicyRow key={i} {...row} />
          ))}

          {(data.privacyHeading || data.privacyParagraphs?.length) && (
            <div className="mt-8 text-start">
              {data.privacyHeading && (
                <h3 className="aptus-policy-privacy-title">{data.privacyHeading}</h3>
              )}
              {data.privacyParagraphs?.map((p, i) => (
                <p key={i} className={cn("aptus-policy-privacy-text", i === 0 ? "mt-4" : "mt-3")}>
                  {p}
                </p>
              ))}
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
