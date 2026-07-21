import styles from "@/styles/adobe/adobe.module.css";
import { DeadLink } from "./DeadLink";

const FEATURED_CARD = {
  heading: 'Turn AI signals into business impact with Adobe Brand Visibility.',
  body: 'Get the intelligence and tools to win customers in AI searches.',
  linkLabel: 'Learn more',
  image: 'https://www.adobe.com/upp-shared/media_1ffc572777c63f4a753a7ac51b7a94bd275e98cd7.png?width=2000&format=webply&optimize=medium',
  icon: '/adobe-assets/experience-cloud-logo.svg',
};

const THREE_UP_CARDS = [
  {
    heading: 'Change only what you want.',
    body: 'Photoshop AI Assistant edits what you ask. Everything else stays.',
    linkLabel: 'Try AI Assistant',
    image: 'https://www.adobe.com/upp-shared/media_1179a8d50eb3482a8ef9a6fcb0ce35db8e25d43e2.png?width=2000&format=webply&optimize=medium',
    imageAlt: '',
    icon: '/adobe-assets/photoshop.svg',
    iconAlt: 'Adobe Photoshop',
  },
  {
    heading: 'Introducing Color Mode.',
    body: 'Color grading purpose‒built for editors. Now in Premiere (beta).',
    linkLabel: 'Explore Premiere',
    image: 'https://www.adobe.com/upp-shared/media_12fb432c23990dc06f1f8695bcf105ea3f6d164b6.png?width=2000&format=webply&optimize=medium',
    imageAlt: 'A rally car drives through a desert landscape, shown before and after color grading.',
    icon: '/adobe-assets/premiere-pro.svg',
    iconAlt: 'Adobe Premiere',
  },
  {
    heading: 'Work smarter than ever with documents.',
    body: 'Trusted PDF tools, now with AI for editing, insights, and content creation.',
    linkLabel: 'Explore Acrobat',
    image: 'https://www.adobe.com/upp-shared/media_11baea9af9d1d1306f14797ab9e4566c1620ecc11.png?width=2000&format=webply&optimize=medium',
    imageAlt: 'Adobe Acrobat PDF Space with presentation slides and AI prompt field.',
    icon: '/adobe-assets/acrobat-pro.svg',
    iconAlt: 'Adobe Acrobat',
  },
];

export function FeaturesSection() {
  return (
    <>
      {/* Heading */}
      <div className={styles.sectionHeading}>
        <span className={styles.eyebrow} style={{ color: 'var(--gray-600)', marginBottom: '12px', display: 'block' }}>
          Features and Releases
        </span>
        <h2 className={styles.heading2} style={{ marginBottom: '16px' }}>Explore what&apos;s new.</h2>
        <p className={styles.bodyLg} style={{ color: 'var(--gray-700)' }}>
          Discover the latest product features from Adobe.
        </p>
      </div>

      {/* Featured full-width card */}
      <div className={styles.featuredCardSection}>
        <div className={styles.featuredCard}>
          <div className={styles.featuredCardForeground}>
            <h3 className={styles.heading5} style={{ fontSize: 'var(--fs-28)', lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: '16px' }}>
              {FEATURED_CARD.heading}
            </h3>
            <p className={styles.bodyMd} style={{ color: 'var(--gray-700)', marginBottom: '24px' }}>
              {FEATURED_CARD.body}
            </p>
            <DeadLink  className={styles.standaloneLink}>
              {FEATURED_CARD.linkLabel}
            </DeadLink>
          </div>

          <div className={styles.featuredCardMedia} style={{ position: 'relative' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={FEATURED_CARD.image} alt="" loading="lazy" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={FEATURED_CARD.icon}
              alt="Adobe Experience Cloud"
              className={styles.cardIcon}
              loading="lazy"
            />
          </div>
        </div>
      </div>

      {/* Three-up cards */}
      <div className={styles.threeUpSection}>
        <div className={styles.threeUpGrid}>
          {THREE_UP_CARDS.map((card, i) => (
            <div key={i} className={styles.baseCard}>
              <div className={styles.baseCardMedia}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={card.image} alt={card.imageAlt} loading="lazy" />
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
                <p className={`${styles.bodyMd}`}>{card.body}</p>
                <DeadLink  className={styles.standaloneLink}>{card.linkLabel}</DeadLink>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
