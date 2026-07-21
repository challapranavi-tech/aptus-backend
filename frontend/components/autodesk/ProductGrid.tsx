"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
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
  /** Aptus product page — when set, card navigates (no flip). */
  href?: string;
  /** Shown on flip back — only needed for cards without href. */
  description?: string;
  thumb: string;
  thumbAlt: string;
  icon: string;
  credit?: string;
  hasPromo?: boolean;
}

const ASSET = "/assets/autodesk";

/**
 * Popular products — local thumbs only.
 * Linked cards → navigate. Unlinked cards → flip for info (no CTAs).
 */
const PRODUCTS: Product[] = [
  {
    id: "ACDIST",
    name: "AutoCAD",
    href: "/autocad",
    thumb: `${ASSET}/autocad-video-thumb-788x1050.jpg`,
    thumbAlt: "Architectural blueprint of laundry, bath, and utility areas",
    icon: `${ASSET}/autocad-product-icon.svg`,
  },
  {
    id: "3DSMAX",
    name: "3ds Max",
    href: "/3ds-max",
    thumb: `${ASSET}/3ds-max-video-thumb-788x1050.jpg`,
    thumbAlt: "Futuristic cityscape with slender buildings",
    icon: `${ASSET}/3ds-max-full-product-icon.svg`,
    credit: "Image courtesy of Steffan Hampel",
  },
  {
    id: "RVT",
    name: "Revit",
    href: "/revit",
    thumb: `${ASSET}/revit-video-thumb-788x1050.jpg`,
    thumbAlt: "Architectural elevation of a multi-story brick building",
    icon: `${ASSET}/revit-product-icon.svg`,
  },
  {
    id: "CIV3D",
    name: "Civil 3D",
    href: "/civil-3d",
    thumb: `${ASSET}/civil-3d-video-thumb-788x1050.jpg`,
    thumbAlt: "Wireframe architectural rendering of a transportation hub",
    icon: `${ASSET}/civil-3d-full-product-icon.svg`,
  },
  {
    id: "ACDLT",
    name: "AutoCAD LT",
    href: "/autocad-lt",
    thumb: `${ASSET}/autocad-lt-video-thumb-788x1050.jpg`,
    thumbAlt: "Section drawing of a log cabin roof detail",
    icon: `${ASSET}/autocad-lt-product-icon.svg`,
  },
  {
    id: "COLLRP",
    name: "BIM Collaborate Pro",
    href: "/bim-collaborate-pro",
    thumb: `${ASSET}/bim-collaborate-pro-video-thumb-788x1050.jpg`,
    thumbAlt: "Colorful abstract architectural site plan",
    icon: `${ASSET}/autodesk-symbol-product-icon.svg`,
  },
  {
    id: "DOCS",
    name: "Autodesk Docs",
    href: "/autodesk-docs",
    thumb: `${ASSET}/autodesk-docs-video-thumb-788x1050.jpg`,
    thumbAlt: "Digital project files interface",
    icon: `${ASSET}/autodesk-symbol-product-icon.svg`,
  },
  {
    id: "BUILD",
    name: "Autodesk Build",
    href: "/autodesk-build",
    thumb: `${ASSET}/forma-build-hero-banner-1920x1080-v4.jpg`,
    thumbAlt: "Construction worker reviewing a 3D model on a tablet",
    icon: `${ASSET}/autodesk-symbol-product-icon.svg`,
  },
  {
    id: "FSN",
    name: "Fusion",
    description:
      "Accelerate innovation and scale your team with integrated design, manufacturing, and data management.",
    thumb: `${ASSET}/fusion-video-thumb-788x1050.jpg`,
    thumbAlt: "3D rendering of a curved metal part in a jig",
    icon: `${ASSET}/fusion-full-product-icon.svg`,
    hasPromo: true,
  },
  {
    id: "MAYA",
    name: "Maya",
    description: "3D animation and VFX software for realistic characters and effects",
    thumb: `${ASSET}/maya-video-thumb-788x1050.jpg`,
    thumbAlt: "Digital artwork of an armored dinosaur",
    icon: `${ASSET}/maya-full-product-icon.svg`,
    credit: "Image courtesy of Nicolas Morel",
  },
  {
    id: "INVPROSA",
    name: "Inventor",
    description: "Mechanical design for 3D modeling, simulation, visualization, and more",
    thumb: `${ASSET}/inventor-video-thumb-788x1050.jpg`,
    thumbAlt: "3D rendering of construction vehicle tracks",
    icon: `${ASSET}/inventor-full-product-icon.svg`,
  },
];

function PromoTag({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12.1429 3H3V12.1429L13.8571 23L23 13.8571L12.1429 3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M9 8C9 8.552 8.552 9 8 9C7.448 9 7 8.552 7 8C7 7.448 7.448 7 8 7C8.552 7 9 7.448 9 8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FlipIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M16 3.75H17.4C19.56 3.75 21 5.1 21 7.35V16.5C21 19.5 18.75 20.25 17.4 20.25H12M12 20.25L14.3 22.55M12 20.25L14.3 17.95M8 20.25H6.6C4.44 20.25 3 18.9 3 16.65V7.5C3 4.5 5.25 3.75 6.6 3.75L12 3.75M12 3.75L9.7 1.45M12 3.75L9.7 6.05M7.75 10H16.25M7.75 14H13.75"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
        {product.hasPromo && (
          <div className={styles.promoCorner}>
            <PromoTag className={styles.promoTag} />
          </div>
        )}
      </div>
    </>
  );
}

function ProductCard({
  product,
  flipped,
  onFlip,
  onCollapse,
  index,
}: {
  product: Product;
  flipped: boolean;
  onFlip: () => void;
  onCollapse: () => void;
  index: number;
}) {
  const slideRef = useRef<HTMLDivElement>(null);
  const linked = Boolean(product.href);
  const face = <CardFace product={product} />;

  useEffect(() => {
    if (!flipped || !slideRef.current) return;
    slideRef.current.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [flipped]);

  return (
    <div
      ref={slideRef}
      className={`${styles.slide} ${flipped ? styles.slideExpanded : ""}`}
      role="listitem"
      style={{ ["--i" as string]: index }}
    >
      <div className={`${styles.flipOuter} ${flipped ? styles.isFlipped : ""}`}>
        {linked ? (
          <Link
            href={product.href!}
            className={styles.front}
            aria-label={`Open ${product.name}`}
          >
            {face}
          </Link>
        ) : (
          <>
            <button
              type="button"
              className={styles.front}
              aria-label={`${product.name}, show details`}
              aria-expanded={flipped}
              onClick={onFlip}
            >
              {face}
            </button>

            <div className={styles.back} aria-hidden={!flipped}>
              <button
                type="button"
                className={styles.collapseBtn}
                aria-label="Collapse card"
                tabIndex={flipped ? 0 : -1}
                onClick={onCollapse}
              >
                <FlipIcon />
              </button>
              <div className={styles.backContent}>
                <div className={styles.backIconWrap}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={product.icon} alt="" aria-hidden="true" className={styles.icon} />
                </div>
                <div className={styles.backBody}>
                  <p className={styles.backName}>{product.name}</p>
                  {product.description && (
                    <p className={styles.backDesc}>{product.description}</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** Popular products — linked cards navigate; unlinked cards flip (info only, no CTAs). */
export function ProductGrid() {
  const [openId, setOpenId] = useState<string | null>(null);
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
          <Link href="/autocad" className={styles.viewAll}>
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
            <ProductCard
              key={p.id}
              product={p}
              index={i}
              flipped={openId === p.id}
              onFlip={() => setOpenId((id) => (id === p.id ? null : p.id))}
              onCollapse={() => setOpenId(null)}
            />
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
