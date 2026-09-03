'use client';

import styles from "@/styles/adobe/adobe.module.css";
import { AdobeLink } from "./DeadLink";

/**
 * Mirrors the five category pods on adobe.com/mena_en
 * (“Everything you need to make anything”).
 * Clicks open Adobe-replica destination pages (not catalog).
 */
const PRODUCTS: {
  icon: string;
  iconAlt: string;
  eyebrow: string;
  videoSrc: string;
  poster: string;
  heading: string;
  body: string;
  href: string;
}[] = [
  {
    icon: "/adobe-assets/creative-cloud.svg",
    iconAlt: "Adobe Creative Cloud",
    eyebrow: "Creativity and design",
    videoSrc: "https://www.adobe.com/upp/media_1badc9f153c69f16292c23f9752012c9ab7edb851.mp4",
    poster:
      "https://www.adobe.com/upp-shared/media_123c15ca5b250c113b7f1027f0513ea6226f725cc.png?width=2000&format=webply&optimize=medium",
    heading: "Create with the top tools.",
    body: "Do it all with industry-leading apps for design, photo, video, and creative AI.",
    href: "/adobe/creative-cloud",
  },
  {
    icon: "/adobe-assets/firefly-appicon-256.svg",
    iconAlt: "Adobe Firefly",
    eyebrow: "Content creation",
    videoSrc: "https://www.adobe.com/upp/media_159d163e5e983109aed71b1cb4e1048b4f849ab72.mp4",
    poster:
      "https://www.adobe.com/upp-shared/media_182beb06b779224bc280f16b61d7e49d21fe49b1b.png?width=2000&format=webply&optimize=medium",
    heading: "Generate stunning content easily.",
    body: "Quickly create and edit images, video, and audio with creative AI.",
    href: "/adobe/firefly",
  },
  {
    icon: "/adobe-assets/acrobat-pro.svg",
    iconAlt: "Adobe Acrobat",
    eyebrow: "PDF and document essentials",
    videoSrc: "https://www.adobe.com/upp/media_1928dd1a3e8e5ed6e7979b5bb37fcd4c273746e62.mp4",
    poster:
      "https://www.adobe.com/upp-shared/media_1d243344be7183a3379b1c3c6ae6d023587ccdd18.png?width=2000&format=webply&optimize=medium",
    heading: "Do it all in less time.",
    body: "Create, edit, and share PDFs. Make edits and create presentations with AI.",
    href: "/adobe/acrobat",
  },
  {
    icon: "/adobe-assets/experience-cloud-logo.svg",
    iconAlt: "Adobe Experience Cloud",
    eyebrow: "Adobe for Business",
    videoSrc: "https://www.adobe.com/upp/media_14d261ad034b647cf9ec9e77e1a4e53cbbd31af35.mp4",
    poster:
      "https://www.adobe.com/upp-shared/media_1f42c38b1bfa9847b0a51aae46ad3d988f261f566.png?width=2000&format=webply&optimize=medium",
    heading: "Orchestrate customer experiences.",
    body: "Deliver business impact, move faster, and personalize at scale.",
    href: "/adobe/business",
  },
  {
    icon: "/adobe-assets/creative-cloud.svg",
    iconAlt: "Adobe Creative Cloud",
    eyebrow: "Students and teachers",
    videoSrc: "https://www.adobe.com/upp/media_11ef0b05657078d2235cbedc8322cd486a4d83a86.mp4",
    poster:
      "https://www.adobe.com/upp-shared/media_196fcd7a65634001581d6dede382ee51d1608c74f.png?width=2000&format=webply&optimize=medium",
    heading: "Students and teachers save big.",
    body: "Save a bundle on our biggest bundle of top industry creative tools.",
    href: "/adobe/students",
  },
];

export function ProductShowcase() {
  return (
    <section className={styles.carouselSection} aria-label="Adobe products">
      <div className={styles.elasticCarousel}>
        <div className={styles.elasticCarouselContainer}>
          {PRODUCTS.map((p, i) => (
            <AdobeLink
              key={i}
              href={p.href}
              className={styles.elasticCarouselItem}
              aria-label={`${p.eyebrow}: ${p.heading}`}
            >
              <div className={styles.elasticItemHeader}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.icon} alt={p.iconAlt} loading="lazy" />
                <p className={styles.eyebrow}>{p.eyebrow}</p>
              </div>

              <div className={styles.elasticItemMedia}>
                <video
                  playsInline
                  muted
                  loop
                  autoPlay
                  preload="metadata"
                  poster={p.poster}
                  tabIndex={-1}
                >
                  <source src={p.videoSrc} type="video/mp4" />
                </video>
              </div>

              <div className={styles.elasticItemFooter}>
                <h3>{p.heading}</h3>
                <p className={styles.bodyMd}>{p.body}</p>
                <span className={styles.elasticItemArrow} aria-hidden>
                  <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M3 8h10M9 4l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </div>
            </AdobeLink>
          ))}
        </div>
      </div>
    </section>
  );
}
