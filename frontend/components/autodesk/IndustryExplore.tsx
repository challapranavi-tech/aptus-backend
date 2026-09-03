"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./IndustryExplore.module.css";

interface Industry {
  label: string;
  videoSrc: string;
}

const INDUSTRIES: Industry[] = [
  {
    label: "Architecture",
    videoSrc: "https://help.autodesk.com/videos/4eb81b90-25cc-11f0-bf10-1b9f804ebd10/video.mp4",
  },
  {
    label: "Construction",
    videoSrc: "https://help.autodesk.com/videos/4f006f30-25cc-11f0-bf10-1b9f804ebd10/video.mp4",
  },
  {
    label: "Industrial machinery",
    videoSrc: "https://help.autodesk.com/videos/22e18810-2cf9-11f0-82f8-5f8707fab031/video.mp4",
  },
  {
    label: "3D Animation",
    videoSrc: "https://help.autodesk.com/videos/4ea66850-25cc-11f0-bf10-1b9f804ebd10/video.mp4",
  },
  {
    label: "Advanced manufacturing",
    videoSrc: "https://help.autodesk.com/videos/4f403750-25cc-11f0-bf10-1b9f804ebd10/video.mp4",
  },
  {
    label: "Building engineering",
    videoSrc: "https://help.autodesk.com/videos/4edc1e50-25cc-11f0-bf10-1b9f804ebd10/video.mp4",
  },
  {
    label: "Visual effects",
    videoSrc: "https://help.autodesk.com/videos/4f8dbb10-25cc-11f0-bf10-1b9f804ebd10/video.mp4",
  },
  {
    label: "Consumer products",
    videoSrc: "https://help.autodesk.com/videos/4f1297a0-25cc-11f0-bf10-1b9f804ebd10/video.mp4",
  },
  {
    label: "Building products and fabrication",
    videoSrc: "https://help.autodesk.com/videos/e12d4f80-2cf8-11f0-82f8-5f8707fab031/video.mp4",
  },
  {
    label: "Water infrastructure",
    videoSrc: "https://help.autodesk.com/videos/230bf370-2cf9-11f0-82f8-5f8707fab031/video.mp4",
  },
  {
    label: "Transportation",
    videoSrc: "https://help.autodesk.com/videos/23062710-2cf9-11f0-82f8-5f8707fab031/video.mp4",
  },
  {
    label: "Production",
    videoSrc: "https://help.autodesk.com/videos/4f525fc0-25cc-11f0-bf10-1b9f804ebd10/video.mp4",
  },
  {
    label: "Manufacturing production",
    videoSrc: "https://help.autodesk.com/videos/22fcb130-2cf9-11f0-82f8-5f8707fab031/video.mp4",
  },
  {
    label: "Automotive and mobility",
    videoSrc: "https://help.autodesk.com/videos/4eca4400-25cc-11f0-bf10-1b9f804ebd10/video.mp4",
  },
  {
    label: "Game development",
    videoSrc: "https://help.autodesk.com/videos/4f2ed230-25cc-11f0-bf10-1b9f804ebd10/video.mp4",
  },
];

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {dir === "left" ? (
        <path
          d="M15 5L8 12L15 19"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M9 5L16 12L9 19"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

/** Autodesk Across Industries — media cards (display only, not clickable). */
export function IndustryExplore() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const updateNav = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft < max - 4);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateNav();
    el.addEventListener("scroll", updateNav, { passive: true });
    window.addEventListener("resize", updateNav);
    return () => {
      el.removeEventListener("scroll", updateNav);
      window.removeEventListener("resize", updateNav);
    };
  }, [updateNav]);

  const scrollByCards = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>(`.${styles.card}`);
    const step = (card?.offsetWidth ?? 280) + 20;
    el.scrollBy({ left: dir * step * 2, behavior: "smooth" });
  };

  const playVideo = (e: React.MouseEvent<HTMLElement>) => {
    const video = e.currentTarget.querySelector("video");
    if (video) void video.play().catch(() => {});
  };

  const pauseVideo = (e: React.MouseEvent<HTMLElement>) => {
    const video = e.currentTarget.querySelector("video");
    if (video) {
      video.pause();
      video.currentTime = 0.001;
    }
  };

  return (
    <section className={styles.section} aria-labelledby="industry-explore-heading">
      <div className={styles.inner}>
        <div className={styles.headRow}>
          <div className={styles.headCopy}>
            <h2 id="industry-explore-heading" className={styles.title}>
              Autodesk Across Industries
            </h2>
            <p className={styles.lead}>
              Powering design and innovation across diverse industries.
            </p>
          </div>
          <div className={styles.nav}>
            <button
              type="button"
              className={`${styles.navBtn} ${!canPrev ? styles.navBtnDisabled : ""}`}
              aria-label="Previous industries"
              disabled={!canPrev}
              onClick={() => scrollByCards(-1)}
            >
              <Chevron dir="left" />
            </button>
            <button
              type="button"
              className={`${styles.navBtn} ${!canNext ? styles.navBtnDisabled : ""}`}
              aria-label="Next industries"
              disabled={!canNext}
              onClick={() => scrollByCards(1)}
            >
              <Chevron dir="right" />
            </button>
          </div>
        </div>

        <div
          ref={scrollerRef}
          className={styles.scroller}
          role="list"
          aria-label="Industries"
        >
          {INDUSTRIES.map((item) => (
            <article
              key={item.label}
              role="listitem"
              className={styles.card}
              onMouseEnter={playVideo}
              onMouseLeave={pauseVideo}
            >
              <video
                className={styles.media}
                src={`${item.videoSrc}#t=0.001`}
                muted
                loop
                playsInline
                preload="metadata"
                aria-hidden="true"
              />
              <div className={styles.scrim} aria-hidden="true" />
              <span className={styles.label}>{item.label}</span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
