import { softwareSubnavForFamily } from "@/data/software-subnav";
import { SoftwareSubNav } from "@/components/layout/SoftwareSubNav";
import { CmsImage } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { SoftwareInnerHero as SoftwareInnerHeroData } from "@/types";
import Link from "next/link";

interface SoftwareInnerHeroProps {
  data: SoftwareInnerHeroData;
}

function subnavLabel(family?: string): string {
  if (family === "elv") return "ELV Solutions";
  if (family === "educational") return "Electrical Software";
  return `${family ?? "Software"} products`;
}

export function SoftwareInnerHero({ data }: SoftwareInnerHeroProps) {
  const showBanner = Boolean(data.bannerTitle);
  const isTwoColumn = data.layout === "two-column";
  const mediaInline = data.mediaInline;
  const bannerAction = data.bannerAction ?? data.action;
  const subnav = softwareSubnavForFamily(data.family);

  const copyPanel = (
    <>
      {!showBanner && data.bannerTagline && (
        <h2 className="aptus-software-inner-hero__subtitle">{data.bannerTagline}</h2>
      )}
      {data.paragraphs?.map((paragraph) => (
        <p key={paragraph.slice(0, 48)} className="aptus-software-inner-hero__text">
          {paragraph}
        </p>
      ))}
      {data.media && mediaInline && (
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
      {data.action && (
        <Link href={data.action.href} className="aptus-software-btn aptus-software-btn-blue">
          {data.action.label}
        </Link>
      )}
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
            </div>
            {bannerAction && (
              <div className="aptus-software-page-banner__action-wrap text-center">
                <Link
                  href={bannerAction.href}
                  className="aptus-software-btn aptus-software-btn-blue aptus-software-btn-lg"
                >
                  {bannerAction.label}
                </Link>
              </div>
            )}
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
              mediaInline && "aptus-software-inner-hero__grid--inline-media",
            )}
          >
            <aside className="aptus-software-inner-hero__nav">
              {subnav && (
                <SoftwareSubNav links={subnav} label={subnavLabel(data.family)} />
              )}
            </aside>
            <div className="aptus-software-inner-hero__copy">
              {data.title && <h1 className="aptus-software-inner-hero__title">{data.title}</h1>}
              {mediaInline ? (
                <div className="aptus-software-inner-hero__panel">{copyPanel}</div>
              ) : (
                copyPanel
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
