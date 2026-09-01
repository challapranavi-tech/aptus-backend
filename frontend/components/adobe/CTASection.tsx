import { AdobeLink } from "./DeadLink";
import styles from "@/styles/adobe/adobe.module.css";
import { softwareCatalogHref } from "@/lib/software-catalog-links";

/** "Tools that work for you." — garage-door cover over news (view timeline). */
export function CTASection() {
  return (
    <section
      className={`${styles.section} ${styles.darkHeroSection} ${styles.parallaxGarageDoorReveal}`}
      aria-label="Tools that work for you"
    >
      <div className={styles.sectionBackground}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://www.adobe.com/upp-shared/media_172052cb5b8572f330e80da31f57777f7252dc36a.jpg?width=2000&format=webply&optimize=medium"
          alt=""
          loading="lazy"
        />
      </div>
      <div className={styles.darkHeroOverlay} />

      <div className={`${styles.darkHeroContent} ${styles.gridPad}`}>
        <h2 className={styles.heading2}>Tools that work for you.</h2>
        <p className={styles.bodyLg}>
          Bring any idea to life with products for creators, businesses, and beyond.
        </p>
        <AdobeLink
          href={softwareCatalogHref("adobe")}
          className={`${styles.btnPrimary} ${styles.btnOutlineWhiteLg}`}
        >
          Explore Adobe solutions
        </AdobeLink>
      </div>
    </section>
  );
}
