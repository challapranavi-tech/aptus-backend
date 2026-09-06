'use client';

import { useEffect, useId, useState } from "react";
import { ExploreProductsLink } from "@/components/software/ExploreProductsLink";
import styles from "@/styles/adobe/adobe.module.css";

/**
 * Replica of https://business.adobe.com/products/brand-visibility.html
 * Images: Adobe Brand Visibility hero + Adobe.com Experience Cloud / business
 * creatives (exact product-page assets weren’t fully reachable, so we use
 * matching Adobe CDN visuals already used across /adobe).
 */
const OVERVIEW_VIDEO = {
  embedSrc: "https://video.tv.adobe.com/v/3496515/?quality=12&learn=on",
  poster:
    "https://images-tv.adobe.com/mpcv3/13053/3496515/d8195c30-94b5-4070-859b-b9dda5515d1d/167b1b6dcba242c4911e94b185a06520_1785355461-1920x1080.jpg",
  title: "What's New in Adobe Brand Visibility — overview",
};

const HERO = {
  eyebrow: "Adobe Brand Visibility",
  title: "Transform AI signals into real business impact with Adobe Brand Visibility.",
  body: "Adobe Brand Visibility provides a complete picture of how AI systems view your brand, the intelligence to prioritize strategies, the critical ability to deploy improvements without engineering support, and the tools to prove impact — all in one unified application.",
  image: OVERVIEW_VIDEO.poster,
  imageAlt: "Adobe Brand Visibility overview video still",
};

const CAPABILITIES: {
  heading: string;
  body: string;
  points: string[];
  image: string;
  imageAlt: string;
}[] = [
  {
    heading: "See how AI systems view your brand.",
    body: "Get not just where your brand is missing from AI answers, but what to create to win across topics.",
    points: [
      "Develop a prompt strategy that lasts — grounded in a prompt database of more than 281 million real AI search queries, competitive gaps, and search signals.",
      "Spot which prompts competitors are winning today, and which topics they haven’t moved on yet.",
      "See exactly where one content investment improves visibility across an entire topic cluster, with prioritized briefs ready to act on.",
    ],
    image:
      "https://www.adobe.com/upp-shared/media_1ffc572777c63f4a753a7ac51b7a94bd275e98cd7.png?width=2000&format=webply&optimize=medium",
    imageAlt: "Adobe Brand Visibility product visual",
  },
  {
    heading: "Improve visibility without engineering bottlenecks.",
    body: "Deploy improvements at the CDN edge and resolve technical GEO issues so AI systems can find and cite your brand.",
    points: [
      "View where your SEO authority should be driving AI citation but isn’t.",
      "Deploy AI agents to make changes in minutes with instant rollback and no impact to site visitors.",
      "Resolve technical generative engine optimization (GEO) issues including blocked crawlers, missing structured data, and 404s without engineering support.",
      "Expand citation authority across Wikipedia, YouTube, Reddit, and earned media.",
    ],
    image:
      "https://www.adobe.com/upp-shared/media_1f81c5db554aa9ec0e514f9d3cb5ea60dc2b41353.png?width=2000&format=webply&optimize=medium",
    imageAlt: "Scale content and brand experiences with Adobe",
  },
  {
    heading: "Discover where GEO is driving revenue so you can scale what works.",
    body: "Connect your GEO efforts directly to business outcomes and keep every team aligned.",
    points: [
      "Connect GEO performance to revenue inside Adobe Analytics and Customer Journey Analytics, with no new reporting silo.",
      "Validate every optimization with bot verification, controlled experimentation, and baseline comparison to prove what’s driving results.",
      "Track the full prompt-to-conversion path to see exactly what’s working and where visibility is changing.",
    ],
    image:
      "https://www.adobe.com/upp-shared/media_1f42c38b1bfa9847b0a51aae46ad3d988f261f566.png?width=2000&format=webply&optimize=medium",
    imageAlt: "Adobe for Business customer experience visual",
  },
];

const GALLERY: { src: string; alt: string }[] = [
  {
    src: "https://www.adobe.com/upp-shared/media_1ffc572777c63f4a753a7ac51b7a94bd275e98cd7.png?width=2000&format=webply&optimize=medium",
    alt: "Brand Visibility insights",
  },
  {
    src: "https://www.adobe.com/upp-shared/media_117290bb35cebd4038b07dd09d84f6b7bb026c5e9.webp?width=2000&format=webply&optimize=medium",
    alt: "Adobe for Business",
  },
  {
    src: "https://www.adobe.com/upp-shared/media_16a12df2eb12e5db3e1b23402493892b912e73c49.png?width=2000&format=webply&optimize=medium",
    alt: "Adobe business products",
  },
  {
    src: "https://www.adobe.com/upp-shared/media_172052cb5b8572f330e80da31f57777f7252dc36a.jpg?width=2000&format=webply&optimize=medium",
    alt: "Create with Adobe",
  },
];

const ABOUT = {
  heading: "What is Adobe Brand Visibility?",
  body: "Adobe Brand Visibility is Adobe’s unified generative engine optimization (GEO) product for enterprise brands. It enables teams to measure brand presence across AI-generated answers, identify optimization opportunities through SEO-powered analysis, deploy improvements at the CDN edge without engineering, collaborate across the full marketing organization, and prove business impact through native integration with existing analytics environments.",
  image:
    "https://www.adobe.com/upp-shared/media_183f251f557a09b04ecf77defb4d18c59318db8c3.png?width=2000&format=webply&optimize=medium",
  imageAlt: "Teams collaborating with Adobe creative tools",
};

function WatchOverviewButton({
  className,
  onOpen,
}: {
  className?: string;
  onOpen: () => void;
}) {
  return (
    <button type="button" className={className} onClick={onOpen}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
        <path d="M4 2.5v11l9-5.5L4 2.5Z" />
      </svg>
      Watch overview
    </button>
  );
}

export function BrandVisibilityPageView() {
  const [videoOpen, setVideoOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!videoOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setVideoOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [videoOpen]);

  return (
    <div className={styles.adobePage}>
      <section className={styles.bvHero} aria-label={HERO.eyebrow}>
        <div className={styles.bvHeroInner}>
          <div className={styles.bvHeroCopy}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/adobe-assets/experience-cloud-logo.svg"
              alt="Adobe Experience Cloud"
              className={styles.bvHeroIcon}
            />
            <p className={styles.bvEyebrow}>{HERO.eyebrow}</p>
            <h1 className={styles.bvTitle}>{HERO.title}</h1>
            <p className={styles.bvLead}>{HERO.body}</p>
            <div className={styles.bvCtas}>
              <ExploreProductsLink
                brandId="adobe"
                className={`${styles.btnPrimary} ${styles.btnOutlineWhite}`}
              >
                Explore products
              </ExploreProductsLink>
              <WatchOverviewButton
                className={`${styles.btnPrimary} ${styles.bvWatchBtn}`}
                onOpen={() => setVideoOpen(true)}
              />
            </div>
          </div>
          <button
            type="button"
            className={styles.bvHeroMedia}
            onClick={() => setVideoOpen(true)}
            aria-label="Watch overview video"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={HERO.image} alt={HERO.imageAlt} />
            <span className={styles.bvPlayBadge} aria-hidden>
              <svg width="28" height="28" viewBox="0 0 16 16" fill="currentColor">
                <path d="M4 2.5v11l9-5.5L4 2.5Z" />
              </svg>
            </span>
          </button>
        </div>
      </section>

      <section className={styles.bvVideoSection} aria-label="Watch overview">
        <div className={styles.bvSectionInnerWide}>
          <h2 className={styles.bvSectionHeading}>Watch overview</h2>
          <p className={styles.bvSectionBody}>
            See what&apos;s new as LLM Optimizer evolves into Adobe Brand Visibility: new AI
            visibility insights, a smarter prompt strategy, and clearer brand metrics.
          </p>
          <div className={styles.bvVideoFrame}>
            <iframe
              src={OVERVIEW_VIDEO.embedSrc}
              title={OVERVIEW_VIDEO.title}
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          </div>
        </div>
      </section>

      <section className={styles.bvGallerySection} aria-label="Brand Visibility visuals">
        <div className={styles.bvSectionInnerWide}>
          <h2 className={styles.bvSectionHeading}>Built for the AI search era.</h2>
          <p className={styles.bvSectionBody}>
            Measure presence across AI answers, improve visibility without engineering wait
            times, and prove impact in the analytics stack you already use.
          </p>
          <div className={styles.bvGallery}>
            {GALLERY.map((item) => (
              <figure key={item.src} className={styles.bvGalleryItem}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.src} alt={item.alt} loading="lazy" />
                <figcaption>{item.alt}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {CAPABILITIES.map((block, i) => (
        <section
          key={block.heading}
          className={`${styles.bvSection} ${i % 2 === 1 ? styles.bvSectionAlt : ""}`}
        >
          <div
            className={`${styles.bvSplit} ${i % 2 === 1 ? styles.bvSplitReverse : ""}`}
          >
            <div className={styles.bvSplitCopy}>
              <h2 className={styles.bvSectionHeading}>{block.heading}</h2>
              <p className={styles.bvSectionBody}>{block.body}</p>
              <ul className={styles.bvList}>
                {block.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
            <div className={styles.bvSplitMedia}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={block.image} alt={block.imageAlt} loading="lazy" />
            </div>
          </div>
        </section>
      ))}

      <section className={styles.bvAbout}>
        <div className={styles.bvSplit}>
          <div className={styles.bvSplitCopy}>
            <h2 className={styles.bvSectionHeading}>{ABOUT.heading}</h2>
            <p className={styles.bvSectionBody}>{ABOUT.body}</p>
            <div className={styles.bvCtas}>
              <ExploreProductsLink brandId="adobe" className={styles.standaloneLink}>
                Explore products
              </ExploreProductsLink>
              <WatchOverviewButton
                className={styles.standaloneLink}
                onOpen={() => setVideoOpen(true)}
              />
            </div>
          </div>
          <div className={styles.bvSplitMedia}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ABOUT.image} alt={ABOUT.imageAlt} loading="lazy" />
          </div>
        </div>
      </section>

      <section className={styles.bvFooterCta} aria-label="Explore Adobe products">
        <div className={styles.bvFooterCtaInner}>
          <h2 className={styles.bvSectionHeading}>
            Turn AI signals into business impact.
          </h2>
          <p className={styles.bvSectionBody}>
            Explore Adobe products available through Aptus Infotech.
          </p>
          <div className={styles.bvCtas} style={{ justifyContent: "center" }}>
            <ExploreProductsLink
              brandId="adobe"
              className={`${styles.btnPrimary} ${styles.btnOutlineWhite}`}
            >
              Explore products
            </ExploreProductsLink>
            <WatchOverviewButton
              className={`${styles.btnPrimary} ${styles.bvWatchBtn}`}
              onOpen={() => setVideoOpen(true)}
            />
          </div>
        </div>
      </section>

      {videoOpen ? (
        <div
          className={styles.bvModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={() => setVideoOpen(false)}
        >
          <div className={styles.bvModalPanel} onClick={(e) => e.stopPropagation()}>
            <div className={styles.bvModalHeader}>
              <h2 id={titleId} className={styles.bvModalTitle}>
                Watch overview
              </h2>
              <button
                type="button"
                className={styles.bvModalClose}
                aria-label="Close video"
                onClick={() => setVideoOpen(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.bvModalVideo}>
              <iframe
                src={`${OVERVIEW_VIDEO.embedSrc}&autoplay=true`}
                title={OVERVIEW_VIDEO.title}
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
