import styles from "@/styles/adobe/adobe.module.css";
import { DeadLink } from "./DeadLink";

const NEWS_ITEMS = [
  {
    heading: 'Introducing Adobe Brand Visibility.',
    body: "Get to know Adobe's new unified GEO platform for enterprise brands.",
    linkLabel: 'Read story',
  },
  {
    heading: 'Explore new ways to share information with PDF Spaces.',
    body: "Today in Acrobat, we're introducing a new way to share information, one designed to engage, inform and move the people who matter most.",
    linkLabel: 'Read story',
  },
  {
    heading: 'How Adobe transformed its email marketing.',
    body: "The Adobe Journey Optimizer real-time approach to campaign orchestration has overhauled how Adobe's marketers work. The platform lets them push the envelope in how they create and roll out campaigns.",
    linkLabel: 'Read story',
  },
];

export function NewsSection() {
  return (
    <section className={styles.newsSection} aria-label="Adobe News">
      <div className={styles.newsHeadline}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/adobe-assets/b-app-experiencecloud.svg" alt="" className={styles.newsHeadlineIcon} loading="lazy" />
        <h2>Adobe News</h2>
      </div>

      <div className={styles.newsGrid}>
        {NEWS_ITEMS.map((item, i) => (
          <div key={i} className={styles.newsItem}>
            <h3 className={styles.heading5}>{item.heading}</h3>
            <p className={styles.bodyMd}>{item.body}</p>
            <DeadLink  className={`${styles.standaloneLink} ${styles.standaloneLinkDark}`}>
              {item.linkLabel}
            </DeadLink>
          </div>
        ))}
      </div>
    </section>
  );
}
