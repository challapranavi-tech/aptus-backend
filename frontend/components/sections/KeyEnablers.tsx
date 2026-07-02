"use client";

import { Container } from "@/components/ui";
import { useGSAPContext } from "@/hooks/useGSAPContext";
import { gsap } from "@/lib/gsap";
import type { KeyEnablers as KeyEnablersData } from "@/types";
import { useRef } from "react";

interface KeyEnablersProps {
  data: KeyEnablersData;
}

export function KeyEnablers({ data }: KeyEnablersProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<HTMLDivElement>(null);

  useGSAPContext({
    scope: sectionRef,
    dependencies: [data.heading, data.items?.length],
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
          x: 30,
          opacity: 0,
          duration: 0.65,
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

  return (
    <section
      ref={sectionRef}
      className="section-padding bg-white"
      data-section="key-enablers"
    >
      <Container>
        {/* Two-column split — heading left | cards right */}
        <div className="grid items-start gap-12 lg:grid-cols-[40%_1fr]">

          {/* Heading column */}
          {(data.eyebrow || data.heading || data.headingAccent || data.subheading) && (
            <div ref={headingRef} className="lg:sticky lg:top-28">
              {data.eyebrow && <p className="eyebrow mb-3">{data.eyebrow}</p>}
              {(data.heading || data.headingAccent) && (
                <h2 className="text-3xl font-semibold leading-tight text-brand-navy sm:text-4xl">
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
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                  {data.subheading}
                </p>
              )}
              <span className="mt-5 block h-1 w-14 rounded-full bg-brand-blue" />
            </div>
          )}

          {/* Items column — cards with large faded number watermark */}
          {data.items && data.items.length > 0 && (
            <div ref={itemsRef} className="space-y-4">
              {data.items.map((item) => (
                <div
                  key={item.id}
                  className="enabler-item relative overflow-hidden rounded-xl border border-border bg-white px-6 py-5 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-md)]"
                >
                  {/* Watermark number */}
                  {item.number && (
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 select-none text-7xl font-bold leading-none text-brand-blue/8">
                      {item.number}
                    </span>
                  )}

                  <div className="relative flex items-start gap-4">
                    {item.number && (
                      <span className="mt-0.5 shrink-0 text-sm font-bold text-brand-green">
                        {item.number}
                      </span>
                    )}
                    <div>
                      {item.title && (
                        <h3 className="text-base font-semibold text-brand-blue">{item.title}</h3>
                      )}
                      {item.description && (
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
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
