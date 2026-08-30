"use client";

import { Container } from "@/components/ui";
import { gsap } from "@/lib/gsap";
import { cn, resolveCmsImageSrc } from "@/lib/utils";
import type { Hero as HeroData, MediaAsset } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

interface HeroProps {
  data: HeroData;
}

const SLIDE_MS = 5000;

function HeroBackgroundSlides({ images }: { images: MediaAsset[] }) {
  const [active, setActive] = useState(0);
  const [motionOk, setMotionOk] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setMotionOk(!reduce);
    if (images.length < 2 || reduce) return;
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % images.length);
    }, SLIDE_MS);
    return () => window.clearInterval(id);
  }, [images.length]);

  return (
    <div className="home-hero-slides" aria-hidden="true">
      {images.map((img, i) => (
        <div
          key={`${img.src}-${i}`}
          className={cn(
            "home-hero-slide",
            i === active && "home-hero-slide--active",
            motionOk && "home-hero-slide--motion",
          )}
        >
          <Image
            src={resolveCmsImageSrc(img.src)}
            alt=""
            fill
            className="object-cover"
            priority={i === 0}
            sizes="100vw"
          />
        </div>
      ))}
      <div className="home-hero-centered__veil" />
    </div>
  );
}

export function Hero({ data }: HeroProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const isHomeCentered = data.variant === "home-centered";
  const backgroundImages = useMemo(() => {
    if (data.backgroundMedia && data.backgroundMedia.length > 0) {
      return data.backgroundMedia;
    }
    return data.media ? [data.media] : [];
  }, [data.backgroundMedia, data.media]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      const items = contentRef.current?.querySelectorAll(".anim-item");
      if (!items) return;
      gsap.from(items, {
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.12,
      });
    }, contentRef);

    return () => ctx.revert();
  }, []);

  if (isHomeCentered) {
    return (
      <section
        className="home-hero-centered relative overflow-hidden"
        data-section="hero"
        data-variant="home-centered"
      >
        {backgroundImages.length > 0 && <HeroBackgroundSlides images={backgroundImages} />}

        <Container>
          <div ref={contentRef} className="relative z-10 mx-auto max-w-6xl text-center">
            <div className="mx-auto max-w-none">
              {(data.heading || data.headingAccent) && (
                <h1 className="anim-item home-hero-heading">
                  {data.heading}
                  {data.heading && data.headingAccent ? " " : null}
                  {data.headingAccent}
                </h1>
              )}
              {data.tagline && (
                <p className="anim-item home-hero-tagline">{data.tagline}</p>
              )}
              {data.subheading && (
                <p className="anim-item home-hero-support">{data.subheading}</p>
              )}
            </div>

            {data.highlights && data.highlights.length > 0 && (
              <ul className="anim-item home-hero-results">
                {data.highlights.map((item) => (
                  <li key={item.id} className="home-hero-result-card">
                    <h2 className="home-hero-result-card__title">{item.label}</h2>
                    {item.description && (
                      <p className="home-hero-result-card__body">{item.description}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section className="relative section-padding overflow-hidden bg-brand-navy" data-section="hero">
      {data.media && (
        <>
          <Image
            src={resolveCmsImageSrc(data.media.src)}
            alt={data.media.alt}
            fill
            className="object-cover opacity-30"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-navy-dark/95 via-brand-navy/80 to-brand-navy/50" />
        </>
      )}

      <Container>
        <div ref={contentRef} className={cn("relative z-10 max-w-2xl")}>
          {(data.heading || data.headingAccent) && (
            <h1 className="anim-item" style={{ fontSize: "var(--text-5xl)", fontWeight: 700 }}>
              {data.heading}
              {data.heading && data.headingAccent ? " " : null}
              {data.headingAccent && <span className="text-brand-orange">{data.headingAccent}</span>}
            </h1>
          )}
          {data.subheading && (
            <p className="anim-item" style={{ fontSize: "var(--text-base)" }}>
              {data.subheading}
            </p>
          )}
          {(data.primaryAction || data.secondaryAction) && (
            <div className="anim-item mt-10 flex flex-wrap gap-4">
              {data.primaryAction && (
                <Link
                  href={data.primaryAction.href}
                  className="inline-flex items-center gap-2 rounded-none bg-brand-orange px-7 py-3.5 text-white transition-all hover:bg-brand-orange-hover"
                  style={{ fontSize: "var(--text-sm)", fontWeight: 500 }}
                >
                  {data.primaryAction.label}
                </Link>
              )}
              {data.secondaryAction && (
                <Link
                  href={data.secondaryAction.href}
                  className="inline-flex items-center gap-2 rounded-none border border-white/30 px-7 py-3.5 text-white transition-all hover:border-brand-orange hover:text-brand-orange"
                  style={{ fontSize: "var(--text-sm)", fontWeight: 500 }}
                >
                  {data.secondaryAction.label}
                </Link>
              )}
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
