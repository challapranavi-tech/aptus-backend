"use client";

import { Container } from "@/components/ui";
import { useGSAPContext } from "@/hooks/useGSAPContext";
import { gsap } from "@/lib/gsap";
import { resolveCmsImageSrc } from "@/lib/utils";
import type { Testimonials as TestimonialsData } from "@/types";
import Image from "next/image";
import { useRef } from "react";

interface TestimonialsProps {
  data: TestimonialsData;
}

export function Testimonials({ data }: TestimonialsProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const isSoftwareQuotes = data.variant === "software-quotes";

  useGSAPContext({
    scope: sectionRef,
    dependencies: [data.items?.length, data.variant],
    setup() {
      // ponytail: software inner pages use a static 3-col quote grid (live post-15a67d8) — no fade-in
      if (data.variant === "software-quotes") return;

      const inner = sectionRef.current?.querySelector(".testimonial-inner");
      if (!inner) return;
      gsap.from(inner.children, {
        y: 32,
        opacity: 0,
        duration: 0.85,
        ease: "power3.out",
        stagger: 0.12,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
          once: true,
        },
      });
    },
  });

  if (!data.items?.length) return null;

  if (isSoftwareQuotes) {
    return (
      <section
        ref={sectionRef}
        className="aptus-software-section bg-white"
        data-section="testimonials"
        data-variant="software-quotes"
      >
        <div className="aptus-live-container">
          {data.heading && (
            <h2 className="aptus-software-section-title aptus-software-section-title--lg">
              {data.heading}
            </h2>
          )}
          {data.subheading && <p className="aptus-software-section-lead">{data.subheading}</p>}
          <div className="testimonial-inner aptus-software-quote-grid">
            {data.items.map((item) => (
              <article key={item.id} className="aptus-software-quote-card">
                {item.quote && <p className="aptus-software-quote-card__quote">{item.quote}</p>}
                {item.author && <h3 className="aptus-software-quote-card__author">{item.author}</h3>}
                {item.role && <p className="aptus-software-quote-card__role">{item.role}</p>}
                {item.company && <p className="aptus-software-quote-card__role">{item.company}</p>}
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-brand-navy py-12 text-white sm:py-16 md:py-20"
      data-section="testimonials"
    >
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand-green/5" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-brand-blue/10" aria-hidden="true" />

      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
        <div className="testimonial-inner">
          {data.items.map((item) => (
            <div key={item.id}>
              {item.quote && (
                <p className="leading-relaxed text-white/85" style={{ fontSize: 'var(--text-base)' }}>{item.quote}</p>
              )}

              <div className="mt-8">
                {item.author && <p className="text-white" style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}>{item.author}</p>}
                {item.role && <p className="mt-1 italic text-brand-green-light" style={{ fontSize: 'var(--text-sm)' }}>{item.role}</p>}
                {item.company && !item.role && (
                  <p className="mt-1 italic text-brand-green-light" style={{ fontSize: 'var(--text-sm)' }}>{item.company}</p>
                )}

                {item.avatar && (
                  <div className="mx-auto mt-6 flex justify-center">
                    <div className="relative h-16 w-16 overflow-hidden rounded-full ring-2 ring-white/20">
                      <Image
                        src={resolveCmsImageSrc(item.avatar.src)}
                        alt={item.avatar.alt}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
