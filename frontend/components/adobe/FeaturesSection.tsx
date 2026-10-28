import styles from "@/styles/adobe/adobe.module.css";
import { AdobeLink } from "./DeadLink";
import { ADOBE_ROUTES, type AdobeRoute } from "./routes";

const SECTION_HEADING = {
  eyebrow: "Features and Releases",
  heading: "Explore what's new.",
  body: "Discover the latest product features from Adobe.",
};

const FEATURED_CARD = {
  heading: "Turn AI signals into business impact with Adobe Brand Visibility.",
  body: "Get the intelligence and tools to win customers in AI searches.",
  linkLabel: "Learn more",
  href: ADOBE_ROUTES.brandVisibility,
  image:
    "https://www.adobe.com/upp-shared/media_1ffc572777c63f4a753a7ac51b7a94bd275e98cd7.png?width=2000&format=webply&optimize=medium",
  imageAlt:
    "Adobe Brand Visibility — AI brand presence insights over a resort website mockup",
  icon: "/adobe-assets/experience-cloud-logo.svg",
  iconAlt: "Adobe",
};

const THREE_UP_CARDS: {
  heading: string;
  body: string;
  linkLabel: string;
  href: AdobeRoute;
  image: string;
  imageAlt: string;
  icon: string;
  iconAlt: string;
}[] = [
  {
    heading: "Change only what you want.",
    body: "Photoshop AI Assistant edits what you ask. Everything else stays.",
    linkLabel: "Explore Photoshop",
    href: ADOBE_ROUTES.photoshop,
    image:
      "https://www.adobe.com/upp-shared/media_1179a8d50eb3482a8ef9a6fcb0ce35db8e25d43e2.png?width=2000&format=webply&optimize=medium",
    imageAlt: "",
    icon: "/adobe-assets/photoshop.svg",
    iconAlt: "Adobe Photoshop",
  },
  {
    heading: "Introducing Color Mode.",
    body: "Color grading purpose‒built for editors. Now in Premiere (beta).",
    linkLabel: "Explore Premiere",
    href: ADOBE_ROUTES.premiere,
    image:
      "https://www.adobe.com/upp-shared/media_12fb432c23990dc06f1f8695bcf105ea3f6d164b6.png?width=2000&format=webply&optimize=medium",
    imageAlt:
      "A rally car drives through a desert landscape, shown before and after color grading.",
    icon: "/adobe-assets/premiere-pro.svg",
    iconAlt: "Adobe Premiere",
  },
  {
    heading: "Work smarter than ever with documents.",
    body: "Trusted PDF tools, now with AI for editing, insights, and content creation.",
    linkLabel: "Explore Acrobat",
    href: ADOBE_ROUTES.acrobat,
    image:
      "https://www.adobe.com/upp-shared/media_11baea9af9d1d1306f14797ab9e4566c1620ecc11.png?width=2000&format=webply&optimize=medium",
    imageAlt: "Adobe Acrobat PDF Space with presentation slides and AI prompt field.",
    icon: "/adobe-assets/acrobat-pro.svg",
    iconAlt: "Adobe Acrobat",
  },
];

export function FeaturesSection() {
  return (
    <>
      <div className={`${styles.sectionHeading} ${styles.parallaxFadeUp}`}>
        <span className={styles.eyebrow}>{SECTION_HEADING.eyebrow}</span>
        <h2 className={styles.heading2}>{SECTION_HEADING.heading}</h2>
        <p className={styles.bodyLg}>{SECTION_HEADING.body}</p>
      </div>

      <AdobeLink
        href={FEATURED_CARD.href}
        className={`${styles.featuredMediaSection} ${styles.parallaxScaleDownGrid}`}
      >
        <div className={styles.featuredMediaCard}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={FEATURED_CARD.image}
            alt={FEATURED_CARD.imageAlt}
            className={styles.featuredMediaImg}
            loading="lazy"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={FEATURED_CARD.icon}
            alt={FEATURED_CARD.iconAlt}
            className={styles.featuredMediaIcon}
            loading="lazy"
          />
        </div>
      </AdobeLink>

      <div className={`${styles.featuresHeader} ${styles.parallaxFadeUp}`}>
        <div className={styles.featuresHeaderText}>
          <h3 className={styles.heading2}>{FEATURED_CARD.heading}</h3>
          <p className={styles.bodyLg}>{FEATURED_CARD.body}</p>
        </div>
        <AdobeLink href={FEATURED_CARD.href} className={styles.standaloneLink}>
          {FEATURED_CARD.linkLabel}
        </AdobeLink>
      </div>

      <div className={`${styles.threeUpSection} ${styles.parallaxStaggerLtr}`}>
        <div className={styles.threeUpGrid}>
          {THREE_UP_CARDS.map((card, i) => (
            <AdobeLink
              key={i}
              href={card.href}
              className={`${styles.baseCard} ${styles.staggerItem}`}
              style={{ ["--stagger-index" as string]: i }}
            >
              <div className={styles.baseCardMedia}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={card.image}
                  alt={card.imageAlt}
                  className={styles.baseCardMediaImg}
                  loading="lazy"
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={card.icon}
                  alt={card.iconAlt}
                  className={styles.baseCardIcon}
                  loading="lazy"
                />
              </div>
              <div className={styles.baseCardContent}>
                <h3 className={styles.heading5}>{card.heading}</h3>
                <p className={styles.bodyMd}>{card.body}</p>
                <span className={styles.standaloneLink}>{card.linkLabel}</span>
              </div>
            </AdobeLink>
          ))}
        </div>
      </div>
    </>
  );
}
