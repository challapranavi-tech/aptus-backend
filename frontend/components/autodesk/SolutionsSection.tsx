"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./SolutionsSection.module.css";

const ASSET_BASE = "/assets/autodesk";
const BG = `${ASSET_BASE}/oni-mask-showcase-background-1920x1080.jpeg`;

/** “Discover Autodesk” — full-bleed hero image, copy on the right, no CTAs. */
export function SolutionsSection() {
  const contentRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const node = contentRef.current;
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
      { threshold: 0.2 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section className={styles.section} data-testid="discover-autodesk">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={BG}
        alt=""
        className={styles.bg}
        loading="lazy"
        decoding="async"
      />
      {/* Soft right-side shade only — keep the mask fully visible */}
      <div className={styles.scrim} aria-hidden="true" />

      <div
        ref={contentRef}
        className={styles.content}
        data-revealed={revealed ? "" : undefined}
      >
        <h2 className={styles.title}>Discover Autodesk</h2>

        <div className={styles.credit}>
          <span className={styles.creditDot} aria-hidden="true" />
          <div className={styles.creditText}>
            <p className={styles.creditTitle}>
              Model courtesy of Alessandro Biolcati Rinaldi
            </p>
            <span className={styles.creditCaption}>Made with Maya</span>
          </div>
        </div>
      </div>
    </section>
  );
}
