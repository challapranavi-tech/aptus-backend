import { Container, CmsImage } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { RichText as RichTextData } from "@/types";
import Link from "next/link";

interface RichTextProps {
  data: RichTextData;
}

export function RichText({ data }: RichTextProps) {
  const isCulturePanel = data.variant === "culture-panel";
  const isJoinPanel = data.variant === "join-panel";
  const below = data.imagePosition === "below";
  const above = data.imagePosition === "above";
  const imageRight = !below && !above && data.imagePosition !== "left";
  const hasMedia = Boolean(data.media);
  const cultureItems = isCulturePanel
    ? data.items?.filter((item) => item.title || item.description)
    : undefined;

  const mediaBlock =
    hasMedia && data.media ? (
      <div
        className={cn(
          isCulturePanel
            ? "aptus-team-culture-photo"
            : "overflow-hidden rounded-2xl shadow-[var(--shadow-lg)]",
          below && !isCulturePanel && "mt-10",
        )}
      >
        <CmsImage
          src={data.media.src}
          alt={data.media.alt || data.heading || ""}
          width={data.media.width ?? (isCulturePanel ? 1600 : 640)}
          height={data.media.height ?? (isCulturePanel ? 900 : 480)}
          className={isCulturePanel ? "aptus-team-culture-photo__img" : "h-auto w-full object-contain"}
          sizes="(max-width: 1024px) 100vw, 960px"
        />
      </div>
    ) : null;

  if (isCulturePanel) {
    return (
      <section className="bg-white pb-2 pt-0" data-section="rich-text" data-variant="culture-panel">
        <Container>
          <div className="aptus-tint-panel mb-0 mt-4 overflow-hidden p-4 sm:p-8">
            {(above || (!below && hasMedia)) && mediaBlock}
            {data.eyebrow && <p className="aptus-team-watermark">{data.eyebrow}</p>}
            {(data.heading || data.headingAccent) && (
              <h2 className="aptus-team-culture-heading">
                {data.heading}
                {data.heading && data.headingAccent ? " " : null}
                {data.headingAccent ? <span>{data.headingAccent}</span> : null}
              </h2>
            )}
            {cultureItems && cultureItems.length > 0 ? (
              <div className="aptus-team-culture-grid">
                {cultureItems.map((item) => (
                  <article key={item.title ?? item.description} className="aptus-team-culture-card">
                    {item.title ? <h3>{item.title}</h3> : null}
                    {item.description ? <p>{item.description}</p> : null}
                  </article>
                ))}
              </div>
            ) : (
              data.paragraphs?.map((p, i) => (
                <p
                  key={i}
                  className={cn("leading-[1.8] text-black", i === 0 ? "mt-4" : "mt-5")}
                  style={{ fontSize: "var(--text-base)" }}
                >
                  {p}
                </p>
              ))
            )}
            {below && mediaBlock}
          </div>
        </Container>
      </section>
    );
  }

  if (isJoinPanel) {
    return (
      <section className="aptus-team-join" data-section="rich-text" data-variant="join-panel">
        <Container>
          <div className="aptus-team-join__inner">
            {(data.heading || data.headingAccent) && (
              <h2 className="aptus-team-join__heading">
                {data.heading}
                {data.heading && data.headingAccent ? " " : null}
                {data.headingAccent ? <span>{data.headingAccent}</span> : null}
              </h2>
            )}
            {data.subheading ? <p className="aptus-team-join__tagline">{data.subheading}</p> : null}
            {data.paragraphs?.map((paragraph) => (
              <p key={paragraph} className="aptus-team-join__copy">
                {paragraph}
              </p>
            ))}
            {data.action?.href && data.action.label ? (
              <Link href={data.action.href} className="aptus-team-join__cta">
                {data.action.label}
              </Link>
            ) : null}
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
