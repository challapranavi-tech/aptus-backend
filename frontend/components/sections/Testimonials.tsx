"use client";

import { Container } from "@/components/ui";
import { useGSAPContext } from "@/hooks/useGSAPContext";
import { gsap } from "@/lib/gsap";
import { resolveCmsImageSrc } from "@/lib/utils";
import type { Testimonials as TestimonialsData } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

interface TestimonialsProps {
  data: TestimonialsData;
}

export function Testimonials({ data }: TestimonialsProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const isSoftwareQuotes = data.variant === "software-quotes";
  const isHomeCards = data.variant === "home-cards";

  useGSAPContext({
    scope: sectionRef,
    dependencies: [data.items?.length, data.variant],
    setup() {
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

  if (isHomeCards) {
    return (
      <section
        ref={sectionRef}
        className="home-testimonials-cards section-padding"
        data-section="testimonials"
        data-variant="home-cards"
      >
        <Container>
          {(data.heading || data.subheading) && (
            <div className="mx-auto mb-12 max-w-2xl text-center">
              {data.heading && (
                <h2
                  className="text-brand-navy"
                  style={{ fontSize: "var(--text-4xl)", fontWeight: 600 }}
                >
                  {data.heading}
                </h2>
              )}
              {data.subheading && (
                <p
                  className="mt-4 text-muted-foreground"
                  style={{ fontSize: "var(--text-base)" }}
                >
                  {data.subheading}
                </p>
              )}
            </div>
          )}

          <div className="testimonial-inner home-testimonials-cards__grid">
            {data.items.map((item) => (
              <article key={item.id} className="home-testimonial-card">
                {item.avatar && (
                  <div className="home-testimonial-card__avatar">
                    <Image
                      src={resolveCmsImageSrc(item.avatar.src)}
                      alt={item.avatar.alt || item.author || ""}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                )}
                {item.author && (
                  <h3
                    className="mt-4 text-brand-navy"
                    style={{ fontSize: "var(--text-base)", fontWeight: 600 }}
                  >
                    {item.author}
                  </h3>
                )}
                {(item.role || item.company) && (
                  <p
                    className="mt-1 text-brand-blue"
                    style={{ fontSize: "var(--text-sm)", fontWeight: 500 }}
                  >
                    {item.role || item.company}
                  </p>
                )}
                {item.quote && (
                  <p
                    className="mt-4 leading-relaxed text-muted-foreground"
                    style={{ fontSize: "var(--text-sm)" }}
                  >
                    {item.quote}
                  </p>
                )}
              </article>
            ))}
          </div>

          {data.action && (
            <div className="mt-12 text-center">
              <Link
                href={data.action.href}
                className="home-cta-pill inline-flex items-center justify-center px-8 py-3.5 text-white transition-colors"
                style={{ fontSize: "var(--text-sm)", fontWeight: 600 }}
              >
                {data.action.label}
              </Link>
            </div>
          )}
        </Container>
      </section>
    );
  }

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
      <div
        className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand-green/5"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-brand-blue/10"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
        <div className="testimonial-inner">
          {data.items.map((item) => (
            <div key={item.id}>
              {item.quote && (
                <p
                  className="text-start leading-relaxed text-white/85"
                  style={{ fontSize: "var(--text-base)" }}
                >
                  {item.quote}
                </p>
              )}

              <div className="mt-8 text-center">
                {item.author && (
                  <p
                    className="text-center text-white"
                    style={{ fontSize: "var(--text-base)", fontWeight: 600 }}
                  >
                    {item.author}
                  </p>
                )}
                {item.role && (
                  <p
                    className="mt-1 text-center italic text-brand-green-light"
                    style={{ fontSize: "var(--text-sm)" }}
                  >
                    {item.role}
                  </p>
                )}
                {item.company && !item.role && (
                  <p
                    className="mt-1 text-center italic text-brand-green-light"
                    style={{ fontSize: "var(--text-sm)" }}
                  >
                    {item.company}
                  </p>
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
