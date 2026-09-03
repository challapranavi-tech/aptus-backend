import { ExploreProductsLink } from "@/components/software/ExploreProductsLink";
import styles from "@/styles/adobe/adobe.module.css";
import type { AdobeDestinationConfig, AdobeMedia } from "./content";

function DestinationMedia({
  media,
  className,
}: {
  media: AdobeMedia;
  className?: string;
}) {
  if (media.type === "video") {
    return (
      <video
        className={className}
        src={media.src}
        poster={media.poster}
        muted
        loop
        playsInline
        autoPlay
        preload="metadata"
        aria-hidden
      />
    );
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img className={className} src={media.src} alt={media.alt ?? ""} loading="lazy" />;
}

export function AdobeDestinationView({ config }: { config: AdobeDestinationConfig }) {
  const heroToneClass =
    config.heroTone === "dark"
      ? styles.destHeroDark
      : config.heroTone === "red"
        ? styles.destHeroRed
        : styles.destHeroLight;

  return (
    <div className={styles.adobePage}>
      <section className={`${styles.destHero} ${heroToneClass}`} aria-label={config.eyebrow}>
        {config.heroMedia ? (
          <div className={styles.destHeroMedia} aria-hidden>
            <DestinationMedia media={config.heroMedia} className={styles.destHeroMediaEl} />
            <div className={styles.destHeroScrim} />
          </div>
        ) : null}

        <div className={styles.destHeroInner}>
          <div className={styles.destHeroCopy}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={config.icon} alt={config.iconAlt} className={styles.destHeroIcon} />
            <p className={styles.destEyebrow}>{config.eyebrow}</p>
            <h1 className={styles.destTitle}>{config.title}</h1>
            <div className={styles.destBody}>
              {config.body.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
            <div className={styles.destCtas}>
              <ExploreProductsLink
                brandId="adobe"
                className={
                  config.heroTone === "light"
                    ? `${styles.btnPrimary} ${styles.btnDark}`
                    : `${styles.btnPrimary} ${styles.btnOutlineWhite}`
                }
              >
                Explore products
              </ExploreProductsLink>
            </div>
          </div>
        </div>
      </section>

      {config.sections.map((section, i) => {
        const tone =
          section.tone === "dark"
            ? styles.destSectionDark
            : section.tone === "gray"
              ? styles.destSectionGray
              : styles.destSectionLight;

        return (
          <section key={i} className={`${styles.destSection} ${tone}`}>
            <div
              className={
                section.media || section.gallery?.length
                  ? styles.destSectionInner
                  : styles.destSectionInnerText
              }
            >
              <div className={styles.destSectionCopy}>
                {section.eyebrow ? (
                  <p className={styles.destEyebrow}>{section.eyebrow}</p>
                ) : null}
                <h2 className={styles.destSectionHeading}>{section.heading}</h2>
                <p className={styles.destSectionBody}>{section.body}</p>
                <ExploreProductsLink brandId="adobe" className={styles.standaloneLink}>
                  Explore products
                </ExploreProductsLink>
              </div>

              {section.media ? (
                <div className={styles.destSectionMedia}>
                  <DestinationMedia media={section.media} className={styles.destSectionMediaEl} />
                </div>
              ) : null}
            </div>

            {section.gallery && section.gallery.length > 0 ? (
              <div className={styles.destGallery} aria-label="Photos">
                {section.gallery.map((item, gi) => (
                  <div key={gi} className={styles.destGalleryItem}>
                    <DestinationMedia media={item} className={styles.destGalleryMedia} />
                    {item.alt ? <p className={styles.destGalleryCaption}>{item.alt}</p> : null}
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        );
      })}

      <section className={styles.destFooterCta} aria-label="Explore Adobe products">
        <div className={styles.destFooterCtaInner}>
          <h2 className={styles.destSectionHeading}>Ready to create?</h2>
          <p className={styles.destSectionBody}>
            Explore Adobe products available through Aptus Infotech.
          </p>
          <ExploreProductsLink
            brandId="adobe"
            className={`${styles.btnPrimary} ${styles.btnOutlineWhite}`}
          >
            Explore products
          </ExploreProductsLink>
        </div>
      </section>
    </div>
  );
}
