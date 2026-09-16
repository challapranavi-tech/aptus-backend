"use client";

import { Container } from "@/components/ui";
import { useGSAPContext } from "@/hooks/useGSAPContext";
import { gsap } from "@/lib/gsap";
import { cn, resolveCmsImageSrc } from "@/lib/utils";
import type { MediaAsset, OurStory as OurStoryData, OurStoryTone } from "@/types";
import { useEffect, useMemo, useRef, useState } from "react";

interface OurStoryProps {
  data: OurStoryData;
}

const SLIDE_MS = 5500;

function ValueIllustration({ name }: { name?: string }) {
  if (name === "handshake" || name === "trust") {
    return (
      <svg className="aptus-story-hex__art" viewBox="0 0 120 90" aria-hidden="true">
        <circle cx="60" cy="42" r="28" fill="rgba(255,255,255,0.18)" />
        <path
          d="M38 48c4-8 14-12 22-8 3 1.5 5 3 8 3s5-1.5 8-3c8-4 18 0 22 8l2 4H36l2-4z"
          fill="#f3d2b3"
          stroke="#1a1a1a"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <path d="M34 46c-2 0-6 3-6 8v4h14" fill="#67db85" stroke="#1a1a1a" strokeWidth="2.2" />
        <path d="M86 46c2 0 6 3 6 8v4H78" fill="#e57373" stroke="#1a1a1a" strokeWidth="2.2" />
        <path
          d="M60 18l12 5v10c0 8-5 14-12 17-7-3-12-9-12-17V23l12-5z"
          fill="#f5c542"
          stroke="#1a1a1a"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <circle cx="60" cy="30" r="7" fill="#67db85" stroke="#1a1a1a" strokeWidth="2" />
        <path d="M56.5 30.2l2.4 2.4 5-5" fill="none" stroke="#1a1a1a" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "balance-scale" || name === "stability") {
    return (
      <svg className="aptus-story-hex__art" viewBox="0 0 120 90" aria-hidden="true">
        <path d="M48 70h24l-6-14H54l-6 14z" fill="#8d6e4c" stroke="#1a1a1a" strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M60 28v28" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round" />
        <path d="M28 36h64" stroke="#1a1a1a" strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="36" cy="48" r="10" fill="#3d8fd1" stroke="#1a1a1a" strokeWidth="2.2" />
        <circle cx="84" cy="48" r="10" fill="#f08a4b" stroke="#1a1a1a" strokeWidth="2.2" />
        <circle cx="60" cy="28" r="4" fill="#f5c542" stroke="#1a1a1a" strokeWidth="2" />
      </svg>
    );
  }
  if (name === "chart-line" || name === "growth") {
    return (
      <svg className="aptus-story-hex__art" viewBox="0 0 120 90" aria-hidden="true">
        <path d="M28 72V28" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M28 72h64" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" />
        <rect x="36" y="54" width="12" height="18" rx="2" fill="#3d8fd1" stroke="#1a1a1a" strokeWidth="2" />
        <rect x="54" y="44" width="12" height="28" rx="2" fill="#7ec8f0" stroke="#1a1a1a" strokeWidth="2" />
        <rect x="72" y="32" width="12" height="40" rx="2" fill="#1aa37a" stroke="#1a1a1a" strokeWidth="2" />
        <path
          d="M34 60l18-10 16-2 20-16"
          fill="none"
          stroke="#1a1a1a"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M82 28l10 4-8 8" fill="#1a1a1a" />
      </svg>
    );
  }
  return null;
}

function HighlightIcon({ name, className }: { name?: string; className?: string }) {
  const cls = cn("aptus-story-icon", className);
  if (name === "shield-check") {
    return (
      <svg className={cls} viewBox="0 0 512 512" fill="currentColor" aria-hidden="true">
        <path d="M256 0c4.6 0 9.2 1 13.4 2.9L457.7 82.8c22 9.3 38.4 31 38.3 57.2-.5 99.2-41.3 280.7-213.6 363.2-16.7 8-36.1 8-52.8 0C57.3 420.7 16.5 239.2 16 140c-.1-26.2 16.3-47.9 38.3-57.2L242.7 2.9C246.8 1 251.4 0 256 0zm0 66.8V444.8C394 378 431.1 230.1 432 141.4L256 66.8l0 0zM369 209L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z" />
      </svg>
    );
  }
  if (name === "award") {
    return (
      <svg className={cls} viewBox="0 0 384 512" fill="currentColor" aria-hidden="true">
        <path d="M173.8 5.5c11-7.3 25.4-7.3 36.4 0L228 24.4c4.7 3.1 10.1 4.9 15.7 5.1l29.1 1.1c14.9.6 27.8 10.9 32.2 25.1l8.4 27.4c1.7 5.5 5.1 10.4 9.8 13.9l23.9 17.9c12.3 9.2 17.1 25.1 11.9 39.2l-10.1 27c-2 5.4-2 11.4 0 16.8l10.1 27c5.2 14.1.4 30-11.9 39.2L323.2 300c-4.7 3.5-8.1 8.4-9.8 13.9l-8.4 27.4c-4.4 14.2-17.3 24.5-32.2 25.1l-29.1 1.1c-5.6.2-11 2-15.7 5.1L210.2 398c-11 7.3-25.4 7.3-36.4 0L150 379.6c-4.7-3.1-10.1-4.9-15.7-5.1l-29.1-1.1c-14.9-.6-27.8-10.9-32.2-25.1l-8.4-27.4c-1.7-5.5-5.1-10.4-9.8-13.9L31 289.6c-12.3-9.2-17.1-25.1-11.9-39.2l10.1-27c2-5.4 2-11.4 0-16.8l-10.1-27C13.9 138.5 18.7 122.6 31 113.4L54.9 95.5c4.7-3.5 8.1-8.4 9.8-13.9l8.4-27.4c4.4-14.2 17.3-24.5 32.2-25.1l29.1-1.1c5.6-.2 11-2 15.7-5.1L173.8 5.5zM272 192a80 80 0 1 0 -160 0 80 80 0 1 0 160 0zM1.3 441.8L44.5 352H85.1l-40.2 90.5c-4.9 11-16 17.5-27.7 17.5H20.2c-13.6 0-23.5-13.3-19-26.2zm338 17.5c-11.7 0-22.8-6.5-27.7-17.5L271.4 352h40.6l43.2 89.8c4.5 12.9-5.4 26.2-19 26.2h-16.9z" />
      </svg>
    );
  }
  if (name === "solar-panel") {
    return (
      <svg className={cls} viewBox="0 0 576 512" fill="currentColor" aria-hidden="true">
        <path d="M288 0c-11.5 0-22.1 6.4-27.4 16.7L176.8 208H64c-17.7 0-32 14.3-32 32v32c0 17.7 14.3 32 32 32h64v64H96c-17.7 0-32 14.3-32 32v32c0 17.7 14.3 32 32 32H480c17.7 0 32-14.3 32-32V400c0-17.7-14.3-32-32-32H448V304h64c17.7 0 32-14.3 32-32V240c0-17.7-14.3-32-32-32H399.2L315.4 16.7C310.1 6.4 299.5 0 288 0zm0 78.7l55.2 97.3H232.8L288 78.7zM160 304h96v64H160V304zm128 0h96v64H288V304zm128 0h32v64H416V304z" />
      </svg>
    );
  }
  return null;
}

function toneClass(tone?: OurStoryTone) {
  if (tone === "sky") return "aptus-story-tone--sky";
  if (tone === "green") return "aptus-story-tone--green";
  return "aptus-story-tone--navy";
}

function StoryHeroMedia({ images }: { images: MediaAsset[] }) {
  const [active, setActive] = useState(0);
  const [base, setBase] = useState(0);
  const count = images.length;

  useEffect(() => {
    if (count < 2) return;
    const id = window.setInterval(() => {
      setActive((prev) => {
        setBase(prev);
        return (prev + 1) % count;
      });
    }, SLIDE_MS);
    return () => window.clearInterval(id);
  }, [count]);

  function goTo(index: number) {
    setActive((prev) => {
      if (prev === index) return prev;
      setBase(prev);
      return index;
    });
  }

  return (
    <div data-story-hero className="aptus-story-hero__media" aria-roledescription="carousel">
      {images.map((image, index) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={`${image.src}-${index}`}
          src={resolveCmsImageSrc(image.src)}
          alt={image.alt ?? ""}
          className={cn(
            "aptus-story-hero__slide",
            index === base && "aptus-story-hero__slide--base",
            index === active && "aptus-story-hero__slide--active",
          )}
          loading={index === 0 ? "eager" : "lazy"}
        />
      ))}
      {count > 1 ? (
        <div className="aptus-story-hero__dots" role="tablist" aria-label="Muscat photos">
          {images.map((image, index) => (
            <button
              key={`dot-${image.src}-${index}`}
              type="button"
              role="tab"
              aria-selected={index === active}
              aria-label={`Show photo ${index + 1}`}
              className={cn(
                "aptus-story-hero__dot",
                index === active && "aptus-story-hero__dot--active",
              )}
              onClick={() => goTo(index)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function OurStory({ data }: OurStoryProps) {
  const rootRef = useRef<HTMLElement>(null);
  const hero = data.hero;
  const journey = data.journey;
  const highlights = data.highlights;

  const heroImages = useMemo(() => {
    const list = hero?.images?.filter((img) => Boolean(img.src)) ?? [];
    if (list.length) return list;
    return hero?.media?.src ? [hero.media] : [];
  }, [hero?.images, hero?.media]);

  const originParagraphs = useMemo(() => {
    if (journey?.originParagraphs?.length) return journey.originParagraphs;
    return journey?.origin ? [journey.origin] : [];
  }, [journey?.origin, journey?.originParagraphs]);

  useGSAPContext({
    scope: rootRef,
    dependencies: [hero?.titleBefore, journey?.milestones?.length, highlights?.items?.length],
    setup() {
      const root = rootRef.current;
      if (!root) return;

      gsap.from(root.querySelectorAll("[data-story-hero]"), {
        y: 22,
        opacity: 0,
        duration: 0.8,
        ease: "power2.out",
        stagger: 0.08,
      });

      const mark = root.querySelector(".aptus-story-title__mark");
      if (mark) {
        gsap.fromTo(
          mark,
          { y: 10, rotate: -8, scale: 0.85 },
          {
            y: -6,
            rotate: 6,
            scale: 1,
            duration: 1.1,
            ease: "power2.inOut",
            yoyo: true,
            repeat: -1,
          },
        );
      }

      const accent = root.querySelector(".aptus-story-title__accent");
      if (accent) {
        gsap.fromTo(
          accent,
          { backgroundPosition: "0% 50%" },
          {
            backgroundPosition: "100% 50%",
            duration: 2.8,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
          },
        );
      }

      gsap.from(root.querySelectorAll(".aptus-story-hex"), {
        y: 18,
        scale: 0.9,
        opacity: 0,
        duration: 0.7,
        ease: "back.out(1.4)",
        stagger: 0.12,
        delay: 0.25,
      });

      gsap.from(root.querySelectorAll("[data-story-journey]"), {
        y: 18,
        opacity: 0,
        duration: 0.7,
        ease: "power2.out",
        stagger: 0.1,
        scrollTrigger: { trigger: root.querySelector(".aptus-story-journey"), start: "top 82%", once: true },
      });

      gsap.from(root.querySelectorAll("[data-story-highlight]"), {
        y: 16,
        opacity: 0,
        duration: 0.65,
        ease: "power2.out",
        stagger: 0.1,
        scrollTrigger: { trigger: root.querySelector(".aptus-story-highlights"), start: "top 88%", once: true },
      });
    },
  });

  return (
    <article ref={rootRef} className="aptus-story" data-section="our-story">
      {hero ? (
        <section className="aptus-story-hero">
          <div className="aptus-story-hero__grid">
            <div className="aptus-story-hero__copy">
              <div data-story-hero className="aptus-story-title-row">
                <h1 className="aptus-story-title">
                  {hero.titleBefore ? <span className="aptus-story-title__before">{hero.titleBefore} </span> : null}
                  {hero.titleAccent ? (
                    <span className="aptus-story-title__accent">{hero.titleAccent}</span>
                  ) : null}
                </h1>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="aptus-story-title__mark"
                  src={resolveCmsImageSrc("/images/our-story/powered-performance-mark.png")}
                  alt=""
                  aria-hidden="true"
                />
              </div>
              {hero.description ? (
                <p data-story-hero className="aptus-story-lead">
                  {hero.description}
                </p>
              ) : null}
              {hero.values?.length ? (
                <ul data-story-hero className="aptus-story-values">
                  {hero.values.map((value) => (
                    <li key={value.id} className={cn("aptus-story-value", toneClass(value.tone))}>
                      <div className="aptus-story-hex" aria-hidden="true">
                        <ValueIllustration name={value.icon ?? value.id} />
                        <strong className="aptus-story-hex__label">{value.title}</strong>
                      </div>
                      {value.description ? (
                        <span className="aptus-story-value__text">{value.description}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            {heroImages.length ? <StoryHeroMedia images={heroImages} /> : null}
          </div>
        </section>
      ) : null}

      {journey ? (
        <section className="aptus-story-journey">
          <Container>
            <div className="aptus-story-journey__grid">
              {originParagraphs.length ? (
                <div data-story-journey className="aptus-story-journey__copy-stack">
                  {originParagraphs.map((paragraph) => (
                    <p key={paragraph.slice(0, 48)} className="aptus-story-journey__copy">
                      {paragraph}
                    </p>
                  ))}
                </div>
              ) : null}

              {journey.milestones?.length ? (
                <ol data-story-journey className="aptus-story-timeline" aria-label="Company timeline">
                  {journey.milestones.map((item) => (
                    <li key={item.id} className={cn("aptus-story-timeline__item", toneClass(item.tone))}>
                      <span className="aptus-story-timeline__dot" aria-hidden="true" />
                      <div className="aptus-story-timeline__body">
                        <span className="aptus-story-timeline__year">{item.year}</span>
                        <strong className="aptus-story-timeline__title">{item.title}</strong>
                        {item.description ? (
                          <span className="aptus-story-timeline__desc">{item.description}</span>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ol>
              ) : null}

              {journey.today ? (
                <p data-story-journey className="aptus-story-journey__copy">
                  {journey.today}
                </p>
              ) : null}
            </div>
          </Container>
        </section>
      ) : null}

      {highlights?.items?.length ? (
        <section className="aptus-story-highlights">
          <Container>
            <ul className="aptus-story-highlights__grid">
              {highlights.items.map((item) => (
                <li key={item.id} data-story-highlight className="aptus-story-highlight">
                  <span className="aptus-story-highlight__icon" aria-hidden="true">
                    <HighlightIcon name={item.icon} />
                  </span>
                  <div className="aptus-story-highlight__text">
                    <strong>{item.title}</strong>
                    {item.description ? <span>{item.description}</span> : null}
                  </div>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      ) : null}
    </article>
  );
}
