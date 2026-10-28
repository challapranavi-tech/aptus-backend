"use client";

import { useEffect, useRef, useState } from "react";
import { ExploreProductsLink } from "@/components/software/ExploreProductsLink";
import shared from "@/styles/autodesk/autodesk.module.css";
import styles from "./SolutionHighlights.module.css";

const CARDS = [
  {
    image: "/assets/autodesk/small-business-hub-spotlight-card-thumb-906x680.jpg",
    imageAlt:
      "Person working at a desk with digital interface overlays and connected system diagrams.",
    title: "Autodesk for small business",
    body: "Affordable Autodesk 2D drafting, 3D modeling, and 3D printing software for small businesses and professionals, including AutoCAD LT, Fusion, and Flow Studio.",
  },
  {
    image: "/assets/autodesk/flow-studio-explorer-card-thumb-906x680.jpg",
    imageAlt: "Stylized animated character standing in a forest with soft natural lighting.",
    title: "Now nothing can stop your story",
    body: "From idea to animation to cinematic shots, Flow Studio makes it easy, with controllable AI tools to generate 3D assets from text and images, auto-rig characters, and refine every scene.",
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
            <article
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
              </div>
            </article>
          ))}
        </div>

        <div className={styles.actions}>
          <ExploreProductsLink brandId="autodesk" className={shared.btnPrimary}>
            Explore products
          </ExploreProductsLink>
        </div>
      </div>
    </section>
  );
}
