"use client";

import { gsap } from "@/lib/gsap";
import type { HeroSlider as HeroSliderData } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

// ─── Props ────────────────────────────────────────────────────────────────────
interface HeroSliderProps {
  data: HeroSliderData;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const DEFAULT_INTERVAL = 5000;

// ─── Slide content ────────────────────────────────────────────────────────────
function SlideContent({
  slide,
  active,
}: {
  slide: HeroSliderData["slides"] extends (infer S)[] | undefined ? NonNullable<S> : never;
  active: boolean;
}) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active || !contentRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const el = contentRef.current;
    const items = el.querySelectorAll(".anim-item");

    const ctx = gsap.context(() => {
      gsap.fromTo(
        items,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out",
          stagger: 0.12,
          delay: 0.1,
        },
      );
    }, el);

    return () => ctx.revert();
  }, [active]);

  if (!active) return null;

  return (
    <div
      ref={contentRef}
      className="relative z-10 max-w-xl px-4 sm:px-0"
    >
      {slide.label && (
        <div className="anim-item mb-4 flex items-center gap-3">
          <span className="uppercase tracking-widest text-brand-orange" style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
            {slide.label}
          </span>
          <span className="h-px w-12 bg-brand-orange" />
        </div>
      )}

      {(slide.heading || slide.headingAccent) && (
        <h1 className="anim-item leading-tight text-white" style={{ fontSize: 'var(--text-5xl)', fontWeight: 700 }}>
          {slide.heading && <span>{slide.heading} </span>}
          {slide.headingAccent && (
            <em className="not-italic text-brand-orange">{slide.headingAccent}</em>
          )}
        </h1>
      )}

      <span className="anim-item mt-5 block h-1 w-16 rounded-full bg-brand-orange" />

      {slide.description && (
        <p className="anim-item mt-5 max-w-md leading-relaxed text-white/80" style={{ fontSize: 'var(--text-base)' }}>
          {slide.description}
        </p>
      )}

      {slide.action && (
        <div className="anim-item mt-8">
          <Link
            href={slide.action.href}
            className="inline-flex items-center gap-2 rounded-none bg-brand-orange px-7 py-3.5 text-white transition-all hover:bg-brand-orange-hover hover:gap-3"
            style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}
          >
            {slide.action.label}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function HeroSlider({ data }: HeroSliderProps) {
  const slides = data.slides ?? [];
  const interval = data.interval ?? DEFAULT_INTERVAL;
  const autoPlay = data.autoPlay ?? true;

  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  const goTo = useCallback(
    (index: number) => {
      if (fading || index === current) return;
      setFading(true);
      setTimeout(() => {
        setCurrent(index);
        setFading(false);
      }, 300);
    },
    [fading, current],
  );

  const goNext = useCallback(() => {
    goTo((current + 1) % slides.length);
  }, [current, slides.length, goTo]);

  const goPrev = useCallback(() => {
    goTo((current - 1 + slides.length) % slides.length);
  }, [current, slides.length, goTo]);

  // Auto-play
  useEffect(() => {
    if (!autoPlay || slides.length <= 1) return;
    timerRef.current = setInterval(goNext, interval);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoPlay, interval, goNext, slides.length]);

  // Keyboard support
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev]);

  if (slides.length === 0) return null;

  const activeSlide = slides[current];

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[min(100svh,520px)] overflow-hidden sm:min-h-[calc(100svh-6.25rem)]"
      aria-label="Hero slideshow"
    >
      {/* ── Background image ─────────────────────────────── */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{ opacity: fading ? 0 : 1 }}
        aria-hidden="true"
      >
        {/* Base gradient — always visible as foundation */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#08192f] via-[#0e2b52] to-[#1a3d6b]" />

        {/* Geometric pattern overlay */}
        <svg
          className="absolute inset-0 h-full w-full opacity-[0.04]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="grid" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {activeSlide.media && (
          <Image
            src={activeSlide.media.src}
            alt={activeSlide.media.alt}
            fill
            className="object-cover object-center"
            priority
            sizes="100vw"
          />
        )}
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-brand-navy-dark/90 via-brand-navy/70 to-transparent" />
      </div>

      {/* ── Content ──────────────────────────────────────── */}
      <div className="relative z-10 flex min-h-[min(100svh,520px)] items-center py-16 sm:min-h-[calc(100svh-6.25rem)] sm:py-0">
        <div className="mx-auto w-full max-w-[var(--container-2xl)] px-4 sm:px-6 lg:px-8">
          <SlideContent slide={activeSlide} active={!fading} />
        </div>
      </div>

      {/* ── Arrow controls ───────────────────────────────── */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => { if (timerRef.current) clearInterval(timerRef.current); goPrev(); }}
            className="absolute left-2 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white backdrop-blur-sm transition-all hover:border-brand-orange hover:bg-brand-orange sm:left-4 sm:flex sm:h-11 sm:w-11"
            aria-label="Previous slide"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => { if (timerRef.current) clearInterval(timerRef.current); goNext(); }}
            className="absolute right-2 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white backdrop-blur-sm transition-all hover:border-brand-orange hover:bg-brand-orange sm:right-4 sm:flex sm:h-11 sm:w-11"
            aria-label="Next slide"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </>
      )}

      {/* ── Dot indicators ───────────────────────────────── */}
      {slides.length > 1 && (
        <div
          className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 sm:bottom-8"
          role="tablist"
          aria-label="Slide indicators"
        >
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === current}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => { if (timerRef.current) clearInterval(timerRef.current); goTo(i); }}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current
                  ? "w-8 bg-brand-orange"
                  : "w-2 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      )}

      {/* ── Slide counter ────────────────────────────────── */}
      {slides.length > 1 && (
        <div className="absolute bottom-5 right-4 z-20 hidden text-white/50 sm:bottom-8 sm:right-6 sm:block" style={{ fontSize: 'var(--text-xs)' }}>
          {String(current + 1).padStart(2, "0")}&nbsp;/&nbsp;{String(slides.length).padStart(2, "0")}
        </div>
      )}
    </section>
  );
}
