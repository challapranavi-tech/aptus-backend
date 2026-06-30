"use client";

import { Container } from "@/components/ui";
import { useGSAPContext } from "@/hooks/useGSAPContext";
import { gsap } from "@/lib/gsap";
import type { Services as ServicesData } from "@/types";
import Link from "next/link";
import { useRef } from "react";

interface ServicesProps {
  data: ServicesData;
}

/** Generic fallback icon when no icon/media provided */
function ServiceIcon({ icon }: { icon?: string }) {
  if (icon) {
    return <span className="text-4xl leading-none" aria-hidden="true">{icon}</span>;
  }
  return (
    <svg
      width="44"
      height="44"
      viewBox="0 0 44 44"
      fill="none"
      aria-hidden="true"
      className="text-brand-green"
    >
      <circle cx="22" cy="22" r="21" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M22 14v6m0 0v6m0-6h6m-6 0h-6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Services({ data }: ServicesProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useGSAPContext({
    scope: sectionRef,
    dependencies: [data.heading, data.items?.length],
    setup() {
      if (headingRef.current) {
        gsap.from(headingRef.current.children, {
          y: 28,
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

      if (cardsRef.current) {
        const cards = cardsRef.current.querySelectorAll(".service-card");
        gsap.from(cards, {
          y: 40,
          opacity: 0,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.12,
          scrollTrigger: {
            trigger: cardsRef.current,
            start: "top 82%",
            once: true,
          },
        });
      }
    },
  });

  return (
    <section ref={sectionRef} className="section-padding bg-brand-light" data-section="services">
      <Container>
        {(data.eyebrow || data.heading || data.headingAccent) && (
          <div ref={headingRef} className="mb-12 text-center">
            {data.eyebrow && <p className="eyebrow mb-3">{data.eyebrow}</p>}
            {(data.heading || data.headingAccent) && (
              <h2 className="text-3xl font-semibold text-brand-navy sm:text-4xl">
                {data.heading}
                {data.heading && data.headingAccent && " "}
                {data.headingAccent && (
                  <em className="font-semibold not-italic text-brand-blue">
                    <span className="italic">{data.headingAccent}</span>
                  </em>
                )}
              </h2>
            )}
            <span className="mx-auto mt-4 block h-1 w-14 rounded-full bg-brand-green" />
          </div>
        )}

        {data.items && data.items.length > 0 && (
          <div
            ref={cardsRef}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {data.items.map((item) => (
              <article
                key={item.id}
                className="service-card flex flex-col items-center rounded-2xl border border-border bg-white px-6 py-8 text-center shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-md)]"
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center text-brand-green">
                  <ServiceIcon icon={item.icon} />
                </div>

                {item.title && (
                  <h3 className="text-base font-bold text-brand-blue">{item.title}</h3>
                )}
                {item.description && (
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                )}
                {item.action && (
                  <Link
                    href={item.action.href}
                    className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-green hover:text-brand-green-dark"
                  >
                    {item.action.label}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </Link>
                )}
              </article>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
