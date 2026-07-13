import { Container, CmsImage } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { RichText as RichTextData } from "@/types";

interface RichTextProps {
  data: RichTextData;
}

export function RichText({ data }: RichTextProps) {
  const isCulturePanel = data.variant === "culture-panel";
  const below = data.imagePosition === "below";
  const imageRight = !below && data.imagePosition !== "left";
  const hasMedia = Boolean(data.media);

  const mediaBlock =
    hasMedia && data.media ? (
      <div
        className={cn(
          isCulturePanel ? "pt-8" : "overflow-hidden rounded-2xl shadow-[var(--shadow-lg)]",
          below && !isCulturePanel && "mt-10",
        )}
      >
        <CmsImage
          src={data.media.src}
          alt={data.media.alt || data.heading || ""}
          width={data.media.width ?? (isCulturePanel ? 1068 : 640)}
          height={data.media.height ?? (isCulturePanel ? 388 : 480)}
          className="h-auto w-full object-contain"
          sizes="(max-width: 1024px) 100vw, 960px"
        />
      </div>
    ) : null;

  if (isCulturePanel) {
    return (
      <section className="bg-white pb-16 pt-0" data-section="rich-text" data-variant="culture-panel">
        <Container>
          <div className="aptus-tint-panel my-4 p-4 sm:p-6">
            {data.eyebrow && <h2 className="aptus-team-watermark">{data.eyebrow}</h2>}
            {(data.heading || data.headingAccent) && (
              <div className="aptus-team-culture-subtitle mt-4 font-semibold uppercase">
                {data.heading && <p>{data.heading}</p>}
                {data.headingAccent && <p>{data.headingAccent}</p>}
              </div>
            )}
            {data.paragraphs?.map((p, i) => (
              <p
                key={i}
                className={cn("leading-[1.8] text-black", i === 0 ? "mt-4" : "mt-5")}
                style={{ fontSize: 'var(--text-base)' }}
              >
                {p}
              </p>
            ))}
            {below && mediaBlock}
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section
      className={cn(
        "py-3 sm:py-4",
        data.background === "light" ? "bg-brand-light" : "bg-white",
      )}
      data-section="rich-text"
    >
      <Container>
        <div
          className={cn(
            hasMedia && !below && "grid items-center gap-4 lg:grid-cols-2 lg:gap-5",
          )}
        >
          {hasMedia && !below && data.media && (
            <div className={cn("relative", imageRight ? "lg:order-2" : "lg:order-1")}>
              {mediaBlock}
            </div>
          )}

          <div className={cn(hasMedia && !below && (imageRight ? "lg:order-1" : "lg:order-2"))}>
            {data.eyebrow && <p className="eyebrow mb-3">{data.eyebrow}</p>}
            {(data.heading || data.headingAccent) && (
              <h2 className="text-center leading-tight text-brand-navy" style={{ fontSize: 'var(--text-4xl)', fontWeight: 600 }}>
                {data.heading}
                {data.heading && data.headingAccent && " "}
                {data.headingAccent && (
                  <span className="text-brand-green">{data.headingAccent}</span>
                )}
              </h2>
            )}
            {(data.heading || data.headingAccent) && (
              <span className="rich-text-divider mx-auto mt-4 mb-2 block h-1 w-16 rounded-full bg-brand-blue" />
            )}

            {data.paragraphs?.map((p, i) => (
              <p key={i} className="mt-3 text-start leading-relaxed text-black" style={{ fontSize: 'var(--text-base)' }}>
                {p}
              </p>
            ))}

            {data.bullets && data.bullets.length > 0 && (
              <ul className="mt-4 space-y-2">
                {data.bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-3 text-black" style={{ fontSize: 'var(--text-base)' }}>
                    <svg
                      className="mt-1 h-5 w-5 shrink-0 text-brand-green"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {below && mediaBlock}
      </Container>
    </section>
  );
}
