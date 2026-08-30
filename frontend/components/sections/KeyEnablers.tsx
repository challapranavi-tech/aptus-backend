"use client";

import { Container } from "@/components/ui";
import { useGSAPContext } from "@/hooks/useGSAPContext";
import { gsap } from "@/lib/gsap";
import { cn } from "@/lib/utils";
import type { KeyEnablers as KeyEnablersData } from "@/types";
import { useRef } from "react";

interface KeyEnablersProps {
  data: KeyEnablersData;
}

export function KeyEnablers({ data }: KeyEnablersProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<HTMLDivElement>(null);
  const isHomeSteps = data.variant === "home-steps";

  useGSAPContext({
    scope: sectionRef,
    dependencies: [data.heading, data.items?.length, data.variant],
    setup() {
      if (headingRef.current) {
        gsap.from(headingRef.current.children, {
          y: 25,
          opacity: 0,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.1,
          scrollTrigger: {
            trigger: headingRef.current,
            start: "top 85%",
            once: true,
          },
        });
      }

      if (itemsRef.current) {
        const cards = itemsRef.current.querySelectorAll(".enabler-item");
        gsap.from(cards, {
          y: isHomeSteps ? 28 : 0,
          x: isHomeSteps ? 0 : 30,
          rotateY: isHomeSteps ? -50 : 0,
          transformPerspective: isHomeSteps ? 900 : undefined,
          opacity: 0,
          duration: 0.75,
          ease: "power3.out",
          stagger: 0.1,
          scrollTrigger: {
            trigger: itemsRef.current,
            start: "top 82%",
            once: true,
          },
        });
      }
    },
  });

  if (isHomeSteps) {
    return (
      <section
        ref={sectionRef}
        className="home-steps section-padding"
        data-section="key-enablers"
        data-variant="home-steps"
      >
        <Container>
          {(data.eyebrow || data.heading || data.headingAccent || data.subheading) && (
            <div ref={headingRef} className="mx-auto mb-12 max-w-2xl text-center">
              {data.eyebrow && <p className="eyebrow mb-3">{data.eyebrow}</p>}
              {(data.heading || data.headingAccent) && (
                <h2
                  className="leading-tight text-brand-navy"
                  style={{ fontSize: "var(--text-4xl)", fontWeight: 600 }}
                >
                  {data.heading}
                  {data.heading && data.headingAccent && " "}
                  {data.headingAccent && (
                    <span className="text-brand-blue">{data.headingAccent}</span>
                  )}
                </h2>
              )}
              {data.subheading && (
                <p
                  className="mt-4 leading-relaxed text-muted-foreground"
                  style={{ fontSize: "var(--text-base)" }}
                >
                  {data.subheading}
                </p>
              )}
              <p className="home-section-hint">Scroll &amp; flip the cards →</p>
            </div>
          )}

          {data.items && data.items.length > 0 && (
            <div
              ref={itemsRef}
              className="home-card-track home-steps__track"
            >
              {data.items.map((item) => (
                <article
                  key={item.id}
                  className="enabler-item home-flip-card home-steps__card"
                  tabIndex={0}
                  role="button"
                  aria-label={`${item.title ?? "Step"}. Flip for details.`}
                  onClick={(e) => {
                    e.currentTarget.classList.toggle("is-flipped");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.currentTarget.classList.toggle("is-flipped");
                    }
                  }}
                >
                  <div className="home-flip-card__inner">
                    <div className="home-flip-card__face home-flip-card__face--front">
                      {item.number && (
                        <span className="home-steps__number" aria-hidden="true">
                          {item.number}
                        </span>
                      )}
                      {item.title && (
                        <h3 className="home-steps__title">{item.title}</h3>
                      )}
                      <span className="home-flip-card__cue">Flip for details</span>
                    </div>
                    <div className="home-flip-card__face home-flip-card__face--back">
                      {item.title && (
                        <h3 className="home-steps__title home-steps__title--back">
                          {item.title}
                        </h3>
                      )}
                      {item.description && (
                        <p className="home-steps__desc">{item.description}</p>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </Container>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      className="section-padding bg-white"
      data-section="key-enablers"
    >
      <Container>
        <div className="grid items-start gap-8 lg:grid-cols-[40%_1fr] lg:gap-12">
          {(data.eyebrow || data.heading || data.headingAccent || data.subheading) && (
            <div ref={headingRef} className="lg:sticky lg:top-28">
              {data.eyebrow && <p className="eyebrow mb-3">{data.eyebrow}</p>}
              {(data.heading || data.headingAccent) && (
                <h2
                  className="leading-tight text-brand-navy"
                  style={{ fontSize: "var(--text-4xl)", fontWeight: 600 }}
                >
                  {data.heading}
                  {data.heading && data.headingAccent && " "}
                  {data.headingAccent && (
                    <em className="font-semibold not-italic text-brand-blue">
                      <span className="italic">{data.headingAccent}</span>
                    </em>
                  )}
                </h2>
              )}
              {data.subheading && (
                <p
                  className="mt-4 leading-relaxed text-muted-foreground"
                  style={{ fontSize: "var(--text-base)" }}
                >
                  {data.subheading}
                </p>
              )}
              <span className="mt-5 block h-1 w-14 rounded-full bg-brand-blue" />
            </div>
          )}

          {data.items && data.items.length > 0 && (
            <div ref={itemsRef} className="space-y-4">
              {data.items.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "enabler-item relative overflow-hidden rounded-xl border border-border bg-white px-4 py-5 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-md)] sm:px-6",
                  )}
                >
                  {item.number && (
                    <span
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 select-none leading-none text-brand-blue/8"
                      style={{ fontSize: "var(--text-6xl)", fontWeight: 700 }}
                    >
                      {item.number}
                    </span>
                  )}

                  <div className="relative flex items-start gap-4">
                    {item.number && (
                      <span
                        className="mt-0.5 shrink-0 text-brand-green"
                        style={{ fontSize: "var(--text-sm)", fontWeight: 700 }}
                      >
                        {item.number}
                      </span>
                    )}
                    <div>
                      {item.title && (
                        <h3
                          className="text-brand-blue"
                          style={{ fontSize: "var(--text-base)", fontWeight: 600 }}
                        >
                          {item.title}
                        </h3>
                      )}
                      {item.description && (
                        <p
                          className="mt-1 leading-relaxed text-muted-foreground"
                          style={{ fontSize: "var(--text-sm)" }}
                        >
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
