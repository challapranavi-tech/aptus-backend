'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import styles from "@/styles/adobe/adobe.module.css";
import { AdobeLink } from "./DeadLink";
import { ADOBE_ROUTES } from "./routes";

interface Slide {
  eyebrow: string;
  title: string;
  body: string[];
  /** Omit to hide hero CTA (e.g. removed Free trial). */
  ctaLabel?: string;
  href?: string;
  bgVideo: string;
  bgPoster: string;
}

const SLIDES: Slide[] = [
  {
    eyebrow: 'Creative Cloud',
    title: 'Create at the highest level.',
    body: [
      'Photoshop, Illustrator, Premiere, and much more. Work with the tools behind the world\'s most iconic creative content.',
      'Save 50% on Creative Cloud Pro for the first three months. New subscribers only.',
    ],
    ctaLabel: 'Explore Creative Cloud',
    href: ADOBE_ROUTES.business,
    bgVideo: 'https://www.adobe.com/upp/media_12b79042476ff5306e627654877c58085eacf9cf0.mp4',
    bgPoster: 'https://www.adobe.com/upp-shared/media_15d0c67d468c6ab860bd67d3af2d0998c15f45bbc.webp?width=2000&format=webply&optimize=medium',
  },
  {
    eyebrow: 'Firefly',
    title: 'All the best models, all in one place.',
    body: [
      'Generate and edit images, video, audio, and designs using top AI models from Adobe, Google, OpenAI, and more.',
      'Get unlimited generations on select models for the first year. And save on our biggest Firefly plans until August 26.',
    ],
    ctaLabel: 'Explore Firefly',
    href: ADOBE_ROUTES.business,
    bgVideo: 'https://www.adobe.com/upp/media_1b79b8d240c8d6ea3dd5235f681a2bea24f0c5582.mp4',
    bgPoster: 'https://www.adobe.com/upp-shared/media_180a8327664c8013005414b32d539cb95ce16ef7a.webp?width=2000&format=webply&optimize=medium',
  },
  {
    eyebrow: 'Acrobat',
    title: 'Get work done. Faster.',
    body: [
      'Create, edit, share and sign documents with trusted PDF tools. Use AI to make easy edits, get answers, share information, and create polished content.',
    ],
    ctaLabel: 'Explore Acrobat',
    href: ADOBE_ROUTES.acrobat,
    bgVideo: 'https://www.adobe.com/upp/media_1a42397066428d422823ffd54e7a66ec4998a3fd8.mp4',
    bgPoster: 'https://www.adobe.com/upp-shared/media_13dac5079e7f5c35eb785e3e282b020d3859f4c5a.webp?width=2000&format=webply&optimize=medium',
  },
  {
    eyebrow: 'Adobe for Business',
    title: 'Orchestrate customer experiences with AI.',
    body: [
      'Unify data, content, and workflows with Adobe AI to move faster, personalize at scale, and prove impact across your business.',
    ],
    ctaLabel: 'Explore Adobe for Business',
    href: ADOBE_ROUTES.business,
    bgVideo: 'https://www.adobe.com/upp/media_1fa8617c753dadad2b5de772c544a1091570c94b4.mp4',
    bgPoster: 'https://www.adobe.com/upp-shared/media_117290bb35cebd4038b07dd09d84f6b7bb026c5e9.webp?width=2000&format=webply&optimize=medium',
  },
  {
    eyebrow: 'Education',
    title: 'Students and teachers save big.',
    body: [
      'Save over 60% on Creative Cloud with valid school credentials.',
    ],
    ctaLabel: 'Explore education offers',
    href: ADOBE_ROUTES.business,
    bgVideo: 'https://www.adobe.com/upp/media_172ab3221a924e6451f0eeae9224a41c84f93724e.mp4',
    bgPoster: 'https://www.adobe.com/upp-shared/media_1172a3221a924e6451f0eeae9224a41c84f93724e.webp?width=2000&format=webply&optimize=medium',
  },
];

interface Tab {
  label: string;
  icon: string;
  iconAlt: string;
}

const TABS: Tab[] = [
  { label: 'Creativity and design', icon: '/adobe-assets/creative-cloud.svg', iconAlt: 'Creative Cloud' },
  { label: 'Content creation', icon: '/adobe-assets/firefly-appicon-256.svg', iconAlt: 'Firefly' },
  { label: 'PDF and document essentials', icon: '/adobe-assets/acrobat-pro.svg', iconAlt: 'Acrobat' },
  { label: 'Adobe for Business', icon: '/adobe-assets/experience-cloud-logo.svg', iconAlt: 'Experience Cloud' },
  { label: 'Students and teachers', icon: '/adobe-assets/creative-cloud.svg', iconAlt: 'Creative Cloud' },
];

const SLIDE_DURATION = 5000;

export function HeroSection() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const advance = useCallback(() => {
    setActive((prev) => (prev + 1) % SLIDES.length);
  }, []);

  const goTo = useCallback((idx: number) => {
    setActive(idx);
    if (timerRef.current) clearInterval(timerRef.current);
    if (!paused) {
      timerRef.current = setInterval(advance, SLIDE_DURATION);
    }
  }, [advance, paused]);

  useEffect(() => {
    if (paused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(advance, SLIDE_DURATION);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [advance, paused]);

  useEffect(() => {
    videoRefs.current.forEach((v, i) => {
      if (!v) return;
      if (i === active && !paused) {
        void v.play().catch(() => {});
      } else {
        v.pause();
      }
    });
  }, [active, paused]);

  return (
    <section
      className={`${styles.section} ${styles.parallaxMoveUpFast} ${styles.heroSection}`}
      aria-label="Hero"
    >
      {SLIDES.map((s, i) => (
        <div
          key={i}
          className={`${styles.rmSlide} ${i === active ? styles.active : ''}`}
          role="tabpanel"
          aria-hidden={i !== active}
        >
          <div className={styles.rmBackground}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className={styles.rmBgBleed}
              src={s.bgPoster}
              alt=""
              aria-hidden
              loading={i === 0 ? 'eager' : 'lazy'}
            />
            <video
              ref={(el) => { videoRefs.current[i] = el; }}
              className={styles.rmBgVideo}
              src={s.bgVideo}
              poster={s.bgPoster}
              muted
              loop
              playsInline
              preload={i === 0 ? 'auto' : 'metadata'}
              aria-hidden
            />
          </div>
          <div className={styles.rmOverlay} />

          <div className={styles.rmContentWrapper}>
            <div className={styles.rmContent}>
              <p className={styles.rmEyebrow}>{s.eyebrow}</p>
              <h2 className={styles.rmTitle}>{s.title}</h2>
              <div className={styles.rmBody}>
                {s.body.map((b, j) => <p key={j}>{b}</p>)}
              </div>
              {s.ctaLabel && s.href ? (
                <div className={styles.rmCtas}>
                  <AdobeLink
                    href={s.href}
                    className={`${styles.btnPrimary} ${styles.btnOutlineWhite}`}
                  >
                    {s.ctaLabel}
                  </AdobeLink>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ))}

      <div className={styles.rmControls}>
        <div className={styles.rmControlsInner}>
          <div className={styles.rmCards} role="tablist">
            {TABS.map((tab, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={i === active}
                className={`${styles.rmCard} ${i === active ? styles.activeCard : ''}`}
                onClick={() => goTo(i)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className={styles.rmCardIcon} src={tab.icon} alt={tab.iconAlt} loading="lazy" />
                <span className={styles.rmCardLabel}>
                  {tab.label}
                  <span className={styles.rmCardChevron} aria-hidden>›</span>
                </span>
                <div className={styles.rmCardProgress}>
                  <div
                    key={`${i}-${active}`}
                    className={styles.rmCardProgressBar}
                    style={i === active ? { animationDuration: `${SLIDE_DURATION}ms`, animationPlayState: paused ? 'paused' : 'running' } : {}}
                  />
                </div>
              </button>
            ))}
          </div>

          <button
            className={styles.rmPausePlay}
            aria-label={paused ? 'Play' : 'Pause'}
            onClick={() => setPaused(p => !p)}
          >
            {paused ? (
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M4 2.5L13 8L4 13.5V2.5Z"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <rect x="3" y="2" width="4" height="12" rx="1"/>
                <rect x="9" y="2" width="4" height="12" rx="1"/>
              </svg>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
