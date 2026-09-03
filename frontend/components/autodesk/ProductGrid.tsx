"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { softwareCatalogHref } from "@/lib/software-catalog-links";
import styles from "./ProductGrid.module.css";

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

interface Product {
  id: string;
  name: string;
  /** Catalog product detail page under /software-solutions/[slug]. */
  href: string;
  thumb: string;
  thumbAlt: string;
  icon: string;
  credit?: string;
}

const ASSET = "/assets/autodesk";

/**
 * Popular products — each card opens the Aptus catalog product detail page.
 */
const PRODUCTS: Product[] = [
  {
    id: "ACDIST",
    name: "AutoCAD",
    href: "/software-solutions/autocad",
    thumb: `${ASSET}/autocad-video-thumb-788x1050.jpg`,
    thumbAlt: "Architectural blueprint of laundry, bath, and utility areas",
    icon: `${ASSET}/autocad-product-icon.svg`,
  },
  {
    id: "3DSMAX",
    name: "3ds Max",
    href: "/software-solutions/3ds-max",
    thumb: `${ASSET}/3ds-max-video-thumb-788x1050.jpg`,
    thumbAlt: "Futuristic cityscape with slender buildings",
    icon: `${ASSET}/3ds-max-full-product-icon.svg`,
    credit: "Image courtesy of Steffan Hampel",
  },
  {
    id: "RVT",
    name: "Revit",
    href: "/software-solutions/revit",
    thumb: `${ASSET}/revit-video-thumb-788x1050.jpg`,
    thumbAlt: "Architectural elevation of a multi-story brick building",
    icon: `${ASSET}/revit-product-icon.svg`,
  },
  {
    id: "CIV3D",
    name: "Civil 3D",
    href: "/software-solutions/civil-3d",
    thumb: `${ASSET}/civil-3d-video-thumb-788x1050.jpg`,
    thumbAlt: "Wireframe architectural rendering of a transportation hub",
    icon: `${ASSET}/civil-3d-full-product-icon.svg`,
  },
  {
    id: "ACDLT",
    name: "AutoCAD LT",
    href: "/software-solutions/autocad-lt",
    thumb: `${ASSET}/autocad-lt-video-thumb-788x1050.jpg`,
    thumbAlt: "Section drawing of a log cabin roof detail",
    icon: `${ASSET}/autocad-lt-product-icon.svg`,
  },
  {
    id: "COLLRP",
    name: "Forma Design Collaboration",
    href: "/software-solutions/bim-collaborate-pro",
    thumb: `${ASSET}/bim-collaborate-pro-video-thumb-788x1050.jpg`,
    thumbAlt: "Colorful abstract architectural site plan",
    icon: `${ASSET}/autodesk-symbol-product-icon.svg`,
  },
  {
    id: "DOCS",
    name: "Autodesk Docs",
    href: "/software-solutions/autodesk-docs",
    thumb: `${ASSET}/autodesk-docs-video-thumb-788x1050.jpg`,
    thumbAlt: "Digital project files interface",
    icon: `${ASSET}/autodesk-symbol-product-icon.svg`,
  },
  {
    id: "BUILD",
    name: "Autodesk Build",
    href: "/software-solutions/autodesk-build",
    thumb: `${ASSET}/forma-build-hero-banner-1920x1080-v4.jpg`,
    thumbAlt: "Construction worker reviewing a 3D model on a tablet",
    icon: `${ASSET}/autodesk-symbol-product-icon.svg`,
  },
  {
    id: "INVPROSA",
    name: "Inventor Professional",
    href: "/software-solutions/inventor-professional",
    thumb: `${ASSET}/inventor-video-thumb-788x1050.jpg`,
    thumbAlt: "3D rendering of construction vehicle tracks",
    icon: `${ASSET}/inventor-full-product-icon.svg`,
  },
];

function CardFace({ product }: { product: Product }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={styles.thumb} src={product.thumb} alt={product.thumbAlt} loading="lazy" />
      <div className={styles.frontGradient} aria-hidden="true" />
      <div className={styles.frontContent}>
        <div className={styles.iconRow}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={product.icon} alt="" aria-hidden="true" className={styles.icon} />
          <p className={styles.productName}>{product.name}</p>
        </div>
        {product.credit && <small className={styles.credit}>{product.credit}</small>}
      </div>
    </>
  );
}

function ProductCard({ product, index }: { product: Product; index: number }) {
  return (
    <div
      className={styles.slide}
      role="listitem"
      style={{ ["--i" as string]: index }}
    >
      <div className={styles.flipOuter}>
        <Link
          href={product.href}
          className={styles.front}
          aria-label={`View ${product.name} details`}
        >
          <CardFace product={product} />
        </Link>
      </div>
    </div>
  );
}

/** Popular products — cards open catalog product details. */
export function ProductGrid() {
  const sectionRef = useRef<HTMLElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
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
    const node = sectionRef.current;
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
      { threshold: 0.15 },
    );
    io.observe(node);
    return () => io.disconnect();
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
    const card = el.querySelector<HTMLElement>(`.${styles.slide}`);
    const step = (card?.offsetWidth ?? 260) + 20;
    el.scrollBy({ left: dir * step * 2, behavior: "smooth" });
  };

  return (
    <section
      ref={sectionRef}
      className={`${styles.section} ${inView ? styles.sectionIn : ""}`}
      data-testid="popular-products"
    >
      <div className={styles.container}>
        <div className={styles.headRow}>
          <h2 className={styles.title}>Popular products</h2>
          <Link href={softwareCatalogHref("autodesk")} className={styles.viewAll}>
            Shop all products
          </Link>
        </div>

        <div
          ref={scrollerRef}
          className={styles.scroller}
          role="list"
          aria-label="Popular products"
        >
          {PRODUCTS.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>

        <div className={styles.nav}>
          <button
            type="button"
            className={`${styles.navBtn} ${!canPrev ? styles.navBtnDisabled : ""}`}
            aria-label="Previous products"
            disabled={!canPrev}
            onClick={() => scrollByCards(-1)}
          >
            <Chevron dir="left" />
          </button>
          <button
            type="button"
            className={`${styles.navBtn} ${!canNext ? styles.navBtnDisabled : ""}`}
            aria-label="Next products"
            disabled={!canNext}
            onClick={() => scrollByCards(1)}
          >
            <Chevron dir="right" />
          </button>
        </div>
      </div>
    </section>
  );
}
