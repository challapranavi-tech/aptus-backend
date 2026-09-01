"use client";

import { useRef, useState } from "react";
import { ExploreProductsLink } from "@/components/software/ExploreProductsLink";
import shared from "@/styles/autodesk/autodesk.module.css";
import styles from "./HeroSection.module.css";

const HERO_VIDEO_SRC =
  "https://help.autodesk.com/videos/001a98d0-5a07-11f1-aa10-c37a6abeef11/video.mp4#t=0.001";

export function HeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);

  const togglePlay = () => {
    const el = videoRef.current;
    if (!el) return;
    if (playing) el.pause();
    else void el.play();
    setPlaying(!playing);
  };

  return (
    <section className={styles.hero} data-testid="hero-panel">
      <div className={styles.videoLayer}>
        <video
          ref={videoRef}
          className={styles.video}
          src={HERO_VIDEO_SRC}
          autoPlay
          loop
          muted
          playsInline
        />
        <div className={styles.scrim} />
      </div>

      <button
        type="button"
        className={styles.pauseButton}
        aria-label={playing ? "Pause background video" : "Play background video"}
        onClick={togglePlay}
      >
        {playing ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M3 3C3 2.17 3.67 1.5 4.5 1.5H7.5C8.33 1.5 9 2.17 9 3V21C9 21.83 8.33 22.5 7.5 22.5H4.5C3.67 22.5 3 21.83 3 21V3Z"
              fill="currentColor"
            />
            <path
              d="M15 3C15 2.17 15.67 1.5 16.5 1.5H19.5C20.33 1.5 21 2.17 21 3V21C21 21.83 20.33 22.5 19.5 22.5H16.5C15.67 22.5 15 21.83 15 21V3Z"
              fill="currentColor"
            />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M5 3.87v16.26a1 1 0 0 0 1.5.86l14-8.13a1 1 0 0 0 0-1.72l-14-8.13A1 1 0 0 0 5 3.87Z"
              fill="currentColor"
            />
          </svg>
        )}
      </button>

      <div className={styles.content}>
        <div className={shared.container}>
          <div className={styles.stack}>
            <p className={`${shared.eyebrow} ${styles.eyebrow}`}>NEW OFFER FROM AUTODESK</p>
            <h1 className={styles.headline}>
              Autodesk Flex <span className={styles.underline}>now starting at $99</span>
            </h1>
            <p className={styles.subtext}>
              Prepay with tokens for flexible access to 100+ Autodesk products—ideal for
              project-based work and product exploration.
            </p>
            <div className={styles.actions}>
              <ExploreProductsLink brandId="autodesk" className={shared.btnPrimary}>
                Explore products
              </ExploreProductsLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
