"use client";

import { Container } from "@/components/ui";
import { gsap } from "@/lib/gsap";
import type { Hero as HeroData } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";

interface HeroProps {
  data: HeroData;
}

export function Hero({ data }: HeroProps) {
  const contentRef = useRef<HTMLDivElement>(null);

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

  return (
    <section className="relative section-padding overflow-hidden bg-brand-navy" data-section="hero">
      {/* Background image */}
      {data.media && (
        <>
          <Image
            src={data.media.src}
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
        <div ref={contentRef} className="relative z-10 max-w-2xl">
          {data.heading && (
            <h1 className="anim-item text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
              {data.heading}
            </h1>
          )}
          {data.subheading && (
            <p className="anim-item mt-6 text-lg leading-relaxed text-white/75">
              {data.subheading}
            </p>
          )}
          {(data.primaryAction || data.secondaryAction) && (
            <div className="anim-item mt-10 flex flex-wrap gap-4">
              {data.primaryAction && (
                <Link
                  href={data.primaryAction.href}
                  className="inline-flex items-center gap-2 rounded-none bg-brand-orange px-7 py-3.5 text-sm font-semibold text-white transition-all hover:bg-brand-orange-hover"
                >
                  {data.primaryAction.label}
                </Link>
              )}
              {data.secondaryAction && (
                <Link
                  href={data.secondaryAction.href}
                  className="inline-flex items-center gap-2 rounded-none border border-white/30 px-7 py-3.5 text-sm font-semibold text-white transition-all hover:border-brand-orange hover:text-brand-orange"
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
