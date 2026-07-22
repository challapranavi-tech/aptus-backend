import styles from "@/styles/adobe/adobe.module.css";
import { AdobeLink } from "./DeadLink";
import { ADOBE_ROUTES, type AdobeRoute } from "./routes";

const NEWS_ITEMS: { heading: string; body: string; href: AdobeRoute }[] = [
  {
    heading: "Introducing Adobe Brand Visibility.",
    body: "Get to know Adobe's new unified GEO platform for enterprise brands.",
    href: ADOBE_ROUTES.business,
  },
  {
    heading: "Explore new ways to share information with PDF Spaces.",
    body: "Today in Acrobat, we're introducing a new way to share information, one designed to engage, inform and move the people who matter most.",
    href: ADOBE_ROUTES.acrobat,
  },
  {
    heading: "How Adobe transformed its email marketing.",
    body: "The Adobe Journey Optimizer real-time approach to campaign orchestration has overhauled how Adobe's marketers work. The platform lets them push the envelope in how they create and roll out campaigns.",
    href: ADOBE_ROUTES.business,
  },
];

export function NewsSection() {
  return (
    <div className={styles.newsSection}>
      <div className={styles.newsGrid}>
        <div className={styles.newsHeadline}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/adobe-assets/b-app-experiencecloud.svg"
            alt=""
            className={styles.newsHeadlineIcon}
            loading="lazy"
          />
          <h2>Adobe News</h2>
        </div>
        <div className={styles.newsHeadlineSpacer} aria-hidden />
        <div className={styles.newsHeadlineSpacer} aria-hidden />

        {NEWS_ITEMS.map((item, i) => (
          <AdobeLink key={i} href={item.href} className={styles.newsItem}>
            <h3>{item.heading}</h3>
            <p className={styles.bodyMd}>{item.body}</p>
            <span className={styles.standaloneLink}>Learn more</span>
          </AdobeLink>
        ))}
      </div>
    </div>
  );
}
