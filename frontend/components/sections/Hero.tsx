"use client";

import { Container } from "@/components/ui";
import { gsap } from "@/lib/gsap";
import { cn, resolveCmsImageSrc } from "@/lib/utils";
import type { Hero as HeroData } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";

interface HeroProps {
  data: HeroData;
}

export function Hero({ data }: HeroProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const isHomeCentered = data.variant === "home-centered";

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
        <Container>
          <div ref={contentRef} className="relative z-10 mx-auto max-w-3xl text-center">
            {(data.heading || data.headingAccent) && (
              <h1
                className="anim-item text-brand-navy"
                style={{ fontSize: "var(--text-5xl)", fontWeight: 700, lineHeight: 1.15 }}
              >
                {data.heading}
                {data.heading && data.headingAccent ? " " : null}
                {data.headingAccent && (
                  <span className="text-brand-blue">{data.headingAccent}</span>
                )}
              </h1>
            )}
            {data.subheading && (
              <p
                className="anim-item mx-auto mt-5 max-w-2xl text-muted-foreground"
                style={{ fontSize: "var(--text-lg)", lineHeight: 1.65 }}
              >
                {data.subheading}
              </p>
            )}
            {data.primaryAction && (
              <div className="anim-item mt-8 flex justify-center">
                <Link
                  href={data.primaryAction.href}
                  className="home-cta-pill inline-flex items-center justify-center px-8 py-3.5 text-white transition-colors"
                  style={{ fontSize: "var(--text-sm)", fontWeight: 600 }}
                >
                  {data.primaryAction.label}
                </Link>
              </div>
            )}
            {data.highlights && data.highlights.length > 0 && (
              <ul className="anim-item home-hero-results mt-10 flex flex-wrap items-center justify-center gap-3">
                {data.highlights.map((item) => (
                  <li key={item.id} className="home-hero-result-chip">
                    {item.label}
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
