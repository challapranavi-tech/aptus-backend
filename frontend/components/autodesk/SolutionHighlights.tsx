"use client";

import { useEffect, useRef, useState } from "react";
import { DeadLink } from "./DeadLink";
import styles from "./SolutionHighlights.module.css";

function CtaArrow() {
  return (
    <svg className={styles.ctaArrow} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12.0604 8L16.0555 12M16.0555 12L12.0604 16M16.0555 12H7M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const PROMO_CTA =
  /free\s*trial|start\s+free|25\s*%|savings|start\s+for\s+free/i;

const CARDS = [
  {
    image: "/assets/autodesk/small-business-hub-spotlight-card-thumb-906x680.jpg",
    imageAlt:
      "Person working at a desk with digital interface overlays and connected system diagrams.",
    title: "Autodesk for small business",
    body: "Affordable Autodesk 2D drafting, 3D modeling, and 3D printing software for small businesses and professionals, including AutoCAD LT, Fusion, and Flow Studio.",
    ctaLabel: "Explore products",
  },
  {
    image: "/assets/autodesk/flow-studio-explorer-card-thumb-906x680.jpg",
    imageAlt: "Stylized animated character standing in a forest with soft natural lighting.",
    title: "Now nothing can stop your story",
    body: "From idea to animation to cinematic shots, Flow Studio makes it easy, with controllable AI tools to generate 3D assets from text and images, auto-rig characters, and refine every scene.",
    ctaLabel: "Start for free",
  },
];

export function SolutionHighlights() {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className={`${styles.section} ${inView ? styles.sectionIn : ""}`}
      data-testid="solution-highlights"
      aria-labelledby="solution-highlights-heading"
    >
      <div className={styles.container}>
        <h2 id="solution-highlights-heading" className={styles.title}>
          Solution highlights
        </h2>

        <div className={styles.grid}>
          {CARDS.map((card, i) => (
            <DeadLink
              key={card.title}
              className={styles.card}
              style={{ ["--i" as string]: i }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={card.image}
                alt={card.imageAlt}
                className={styles.cardImage}
                loading="lazy"
              />
              <div className={styles.scrim} aria-hidden="true" />
              <div className={styles.cardBody}>
                <h3 className={styles.cardTitle}>{card.title}</h3>
                <p className={styles.cardText}>{card.body}</p>
                {!PROMO_CTA.test(card.ctaLabel) && (
                  <p className={styles.cta}>
                    <CtaArrow />
                    <span>{card.ctaLabel}</span>
                  </p>
                )}
              </div>
            </DeadLink>
          ))}
        </div>
      </div>
    </section>
  );
}
