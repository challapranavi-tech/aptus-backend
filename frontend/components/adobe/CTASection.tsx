"use client";

import { useEffect, useRef, useState } from "react";
import { DeadLink } from "./DeadLink";
import styles from "@/styles/adobe/adobe.module.css";

/**
 * "Tools that work for you." — full-bleed dark hero/CTA banner.
 *
 * The section's own class name (`darkHeroSection`) always referenced the
 * live page's "garage door reveal" scroll animation, but no animation was
 * actually wired up. This now drives it for real: the background image
 * starts fully masked and unrolls open top-down (clip-path) with a slight
 * zoom-settle, then the heading/copy/button fade up shortly after — same
 * scroll-triggered "live" polish pattern used on the other sections.
 */
export function CTASection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    if (
      typeof window === "undefined" ||
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      setRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className={styles.darkHeroSection}
      data-revealed={revealed ? "" : undefined}
      aria-label="Tools that work for you"
    >
      <div className={styles.darkHeroBg}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://www.adobe.com/upp-shared/media_172052cb5b8572f330e80da31f57777f7252dc36a.jpg?width=2000&format=webply&optimize=medium"
          alt=""
          loading="lazy"
        />
      </div>
      <div className={styles.darkHeroOverlay} />

      <div className={styles.darkHeroContent}>
        <h2 className={styles.heading2}>Tools that work for you.</h2>
        <p className={styles.bodyLg}>
          Bring any idea to life with products for creators, businesses, and beyond.
        </p>
        <DeadLink className={`${styles.btnPrimary} ${styles.btnOutlineWhiteLg}`}>
          See all products
        </DeadLink>
      </div>
    </section>
  );
}
