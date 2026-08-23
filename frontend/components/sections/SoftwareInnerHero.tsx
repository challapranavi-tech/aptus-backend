import { SoftwareInnerHeroNav } from "@/components/layout/SoftwareInnerHeroNav";
import { isTopRequestQuoteCta } from "@/components/quote/quote-modal-utils";
import { CmsImage } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { SoftwareInnerHero as SoftwareInnerHeroData } from "@/types";
import Link from "next/link";

interface SoftwareInnerHeroProps {
  data: SoftwareInnerHeroData;
}

export function SoftwareInnerHero({ data }: SoftwareInnerHeroProps) {
  const showBanner = Boolean(data.bannerTitle);
  const isTwoColumn = data.layout === "two-column";
  const mediaInline = data.mediaInline;
  const hasIntroRows = Boolean(data.introRows?.length);
  const usePanel = mediaInline || hasIntroRows;
  const bannerAction = data.bannerAction ?? data.action;
  // Keep banner free of Request Quote; show it under the description instead.
  const showBannerAction =
    Boolean(bannerAction) && !isTopRequestQuoteCta(bannerAction?.label);
  const TitleTag = data.titleLevel === "h2" ? "h2" : "h1";

  // Always offer Request Quote under the product description (above Key Features).
  const quoteAction =
    data.action && isTopRequestQuoteCta(data.action.label)
      ? data.action
      : { label: "Request a Quote", href: "#form" };
  const secondaryAction =
    data.action && !isTopRequestQuoteCta(data.action.label) ? data.action : null;

  const requestQuoteCta = (
    <div className="aptus-software-inner-hero__cta">
      <Link href={quoteAction.href} className="aptus-software-btn aptus-software-btn-blue">
        {quoteAction.label}
      </Link>
      {secondaryAction && (
        <Link
          href={secondaryAction.href}
          className="aptus-software-btn aptus-software-btn-blue"
        >
          {secondaryAction.label}
        </Link>
      )}
    </div>
  );

  const introRowsPanel = hasIntroRows ? (
    <div className="aptus-software-inner-hero__panel aptus-software-inner-hero__panel--intro-rows">
      {data.introRows?.map((row, index) => {
        const imageRight = row.imagePosition === "right";
        return (
          <div
            key={index}
            className={cn(
              "aptus-software-inner-hero__panel-row",
              imageRight && "aptus-software-inner-hero__panel-row--media-right",
            )}
          >
            <div className="aptus-software-inner-hero__panel-row__copy">
              {row.paragraphs?.map((paragraph) => {
                const key = paragraph.slice(0, 48);
                const isBlockHtml = /<(h[1-6]|ul|ol|div)\b/i.test(paragraph);
                if (isBlockHtml) {
                  return (
                    <div
                      key={key}
                      className="aptus-software-inner-hero__text"
                      dangerouslySetInnerHTML={{ __html: paragraph }}
                    />
                  );
                }
                if (paragraph.includes("<")) {
                  return (
                    <p
                      key={key}
                      className="aptus-software-inner-hero__text"
                      dangerouslySetInnerHTML={{ __html: paragraph }}
                    />
                  );
                }
                return (
                  <p key={paragraph.slice(0, 48)} className="aptus-software-inner-hero__text">
                    {paragraph}
                  </p>
                );
              })}
            </div>
            {row.media && (
              <div className="aptus-software-inner-hero__panel-row__media">
                <CmsImage
                  src={row.media.src}
                  alt={row.media.alt}
                  width={150}
                  height={150}
                  priority={index === 0}
                />
              </div>
            )}
          </div>
        );
      })}
      {requestQuoteCta}
    </div>
  ) : null;

  const copyPanel = (
    <>
      {!showBanner && data.bannerTagline && (
        <h2 className="aptus-software-inner-hero__subtitle">{data.bannerTagline}</h2>
      )}
      {!hasIntroRows &&
        data.paragraphs?.map((paragraph) => (
          <p key={paragraph.slice(0, 48)} className="aptus-software-inner-hero__text">
            {paragraph}
          </p>
        ))}
      {!hasIntroRows && data.media && mediaInline && (
        <div className="aptus-software-inner-hero__media aptus-software-inner-hero__media--inline">
          <CmsImage
            src={data.media.src}
            alt={data.media.alt}
            width={683}
            height={1024}
            priority
          />
        </div>
      )}
      {!hasIntroRows && requestQuoteCta}
    </>
  );

  return (
    <>
      {showBanner && (
        <section className="aptus-software-page-banner" data-section="software-page-banner">
          <div className="aptus-live-container">
            <div className="aptus-software-page-banner__inner">
              <h1 className="aptus-software-page-banner__title">{data.bannerTitle}</h1>
              {data.bannerTagline && (
                <p className="aptus-software-page-banner__tagline">{data.bannerTagline}</p>
              )}
              {showBannerAction && bannerAction && (
                <div className="aptus-software-page-banner__action-wrap">
                  <Link
                    href={bannerAction.href}
                    className="aptus-software-btn aptus-software-btn-blue aptus-software-btn-lg"
                  >
                    {bannerAction.label}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <section
        className={cn(
          "aptus-software-inner-hero",
          showBanner && "aptus-software-inner-hero--with-banner",
          isTwoColumn && "aptus-software-inner-hero--two-column",
        )}
        data-section="software-inner-hero"
      >
        <div className="aptus-live-container">
          <div
            className={cn(
              "aptus-software-inner-hero__grid",
              isTwoColumn && "aptus-software-inner-hero__grid--two-column",
              (mediaInline || hasIntroRows) && "aptus-software-inner-hero__grid--inline-media",
            )}
          >
            <aside className="aptus-software-inner-hero__nav">
              <SoftwareInnerHeroNav family={data.family} links={data.subnavLinks} />
            </aside>
            <div className="aptus-software-inner-hero__copy">
              {data.title && (
                <TitleTag className="aptus-software-inner-hero__title">{data.title}</TitleTag>
              )}
              {introRowsPanel}
              {usePanel && !hasIntroRows ? (
                <div className="aptus-software-inner-hero__panel">{copyPanel}</div>
              ) : (
                !hasIntroRows && copyPanel
              )}
            </div>
            {data.media && !mediaInline && (
              <div className="aptus-software-inner-hero__media">
                <CmsImage
                  src={data.media.src}
                  alt={data.media.alt}
                  width={683}
                  height={1024}
                  priority
                />
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
