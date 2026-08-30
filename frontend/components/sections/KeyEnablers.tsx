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

function StepPicture({ name }: { name?: string }) {
  const common = "home-steps__picture-svg";
  if (name === "blueprint") {
    return (
      <svg className={common} viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <rect x="10" y="8" width="44" height="48" rx="6" stroke="currentColor" strokeWidth="2.5" />
        <path d="M18 20h28M18 30h20M18 40h24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="44" cy="40" r="6" stroke="currentColor" strokeWidth="2.5" />
        <path d="M48 44l6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "rocket") {
    return (
      <svg className={common} viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <path
          d="M32 8c8 8 12 18 12 28l-8 4-4-4-4 4-8-4c0-10 4-20 12-28z"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <circle cx="32" cy="26" r="4" stroke="currentColor" strokeWidth="2.5" />
        <path d="M24 44l-6 10M40 44l6 10M32 48v10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg className={common} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <rect x="8" y="12" width="48" height="34" rx="8" stroke="currentColor" strokeWidth="2.5" />
      <path d="M16 46v8l12-8" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M20 26h24M20 34h16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
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
          opacity: 0,
          duration: 0.65,
          ease: "power3.out",
          stagger: 0.12,
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
            <div ref={headingRef} className="home-steps__header">
              {data.eyebrow && <p className="home-steps__eyebrow">{data.eyebrow}</p>}
              {(data.heading || data.headingAccent) && (
                <h2 className="home-steps__heading">
                  {data.heading}
                  {data.heading && data.headingAccent ? " " : null}
                  {data.headingAccent && (
                    <span className="home-steps__heading-accent">{data.headingAccent}</span>
                  )}
                </h2>
              )}
              {data.subheading && <p className="home-steps__lead">{data.subheading}</p>}
            </div>
          )}

          {data.items && data.items.length > 0 && (
            <div ref={itemsRef} className="home-steps__grid">
              {data.items.map((item, index) => (
                <article key={item.id} className="enabler-item home-steps__card">
                  <div className="home-steps__picture" aria-hidden="true">
                    <StepPicture name={item.icon} />
                  </div>
                  <p className="home-steps__badge">Step {item.number ?? index + 1}</p>
                  {item.title && <h3 className="home-steps__title">{item.title}</h3>}
                  {item.description && <p className="home-steps__desc">{item.description}</p>}
                  {index < (data.items?.length ?? 0) - 1 && (
                    <span className="home-steps__connector" aria-hidden="true" />
                  )}
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
                <article
                  key={item.id}
                  className={cn(
                    "enabler-item rounded-xl border border-border bg-white p-5 shadow-sm",
                  )}
                >
                  {item.number && (
                    <span
                      className="text-brand-blue"
                      style={{ fontSize: "var(--text-sm)", fontWeight: 700 }}
                    >
                      {item.number}
                    </span>
                  )}
                  {item.title && (
                    <h3
                      className="mt-1 text-brand-navy"
                      style={{ fontSize: "var(--text-lg)", fontWeight: 600 }}
                    >
                      {item.title}
                    </h3>
                  )}
                  {item.description && (
                    <p
                      className="mt-2 leading-relaxed text-muted-foreground"
                      style={{ fontSize: "var(--text-sm)" }}
                    >
                      {item.description}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
