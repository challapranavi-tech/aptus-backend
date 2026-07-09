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

function ServiceFlipIcon({ name }: { name?: string }) {
  const className = "mb-4 h-10 w-10 text-brand-green";
  if (name === "lightbulb") {
    return (
      <svg className={className} viewBox="0 0 352 512" fill="currentColor" aria-hidden="true">
        <path d="M176 80c-52.94 0-96 43.06-96 96 0 8.84 7.16 16 16 16s16-7.16 16-16c0-35.3 28.72-64 64-64 8.84 0 16-7.16 16-16s-7.16-16-16-16zM96.06 459.17c0 3.15.93 6.22 2.68 8.84l24.51 36.84c2.97 4.46 7.97 7.14 13.32 7.14h78.85c5.36 0 10.36-2.68 13.32-7.14l24.51-36.84c1.74-2.62 2.67-5.7 2.68-8.84l.05-43.18H96.02l.04 43.18zM176 0C73.72 0 0 82.97 0 176c0 44.37 16.45 84.85 43.56 115.78 16.64 18.99 42.74 58.8 52.42 92.16v.06h48v-.12c-.01-4.77-.72-9.51-2.15-14.07-5.59-17.81-22.82-64.77-62.17-109.67-20.54-23.43-31.52-53.15-31.61-84.14-.2-73.64 59.67-128 127.95-128 70.58 0 128 57.42 128 128 0 30.97-11.24 60.85-31.65 84.14-39.11 44.61-56.42 91.47-62.1 109.46a47.507 47.507 0 0 0-2.22 14.3v.1h48v-.05c9.68-33.37 35.78-73.18 52.42-92.16C335.55 260.85 352 220.37 352 176 352 78.8 273.2 0 176 0z" />
      </svg>
    );
  }
  if (name === "cogs" || name === "cog") {
    return (
      <svg className={className} viewBox="0 0 512 512" fill="currentColor" aria-hidden="true">
        <path d="M487.4 315.7l-42.6-24.6c4.3-23.2 4.3-47 0-70.2l42.6-24.6c4.9-2.8 7.1-8.6 5.5-14-11.1-35.6-30-67.8-54.7-94.6-3.8-4.1-10-5.1-14.8-2.3L380.8 110c-17.9-15.4-38.5-27.3-60.8-35.1V25.8c0-5.6-3.9-10.5-9.4-11.7-36.7-8.2-74.3-7.8-109.2 0-5.5 1.2-9.4 6.1-9.4 11.7V75c-22.2 7.9-42.8 19.8-60.8 35.1L88.7 85.5c-4.9-2.8-11-1.9-14.8 2.3-24.7 26.7-43.6 58.9-54.7 94.6-1.7 5.4.6 11.2 5.5 14L67.3 221c-4.3 23.2-4.3 47 0 70.2l-42.6 24.6c-4.9 2.8-7.1 8.6-5.5 14 11.1 35.6 30 67.8 54.7 94.6 3.8 4.1 10 5.1 14.8 2.3l42.6-24.6c17.9 15.4 38.5 27.3 60.8 35.1v49.2c0 5.6 3.9 10.5 9.4 11.7 36.7 8.2 74.3 7.8 109.2 0 5.5-1.2 9.4-6.1 9.4-11.7v-49.2c22.2-7.9 42.8-19.8 60.8-35.1l42.6 24.6c4.9 2.8 11 1.9 14.8-2.3 24.7-26.7 43.6-58.9 54.7-94.6 1.5-5.5-.7-11.3-5.6-14.1zM256 336c-44.1 0-80-35.9-80-80s35.9-80 80-80 80 35.9 80 80-35.9 80-80 80z" />
      </svg>
    );
  }
  if (name === "drafting-compass" || name === "bim") {
    return (
      <svg className={className} viewBox="0 0 512 512" fill="currentColor" aria-hidden="true">
        <path d="M457.01 344.42c-25.05 20.33-52.63 37.18-82.54 49.05l54.38 94.19 53.95 23.04c9.81 4.19 20.89-2.21 22.17-12.8l7.02-58.25-54.98-95.23zm42.49-94.56c4.86-7.67 1.89-17.99-6.05-22.39l-28.07-15.57c-7.48-4.15-16.61-1.46-21.26 5.72C403.01 281.15 332.25 320 256 320c-23.93 0-47.23-4.25-69.41-11.53l67.36-116.68c.7.02 1.34.21 2.04.21s1.35-.19 2.04-.21l51.09 88.5c31.23-8.96 59.56-25.75 82.61-48.92l-51.79-89.71C347.39 128.03 352 112.63 352 96c0-53.02-42.98-96-96-96s-96 42.98-96 96c0 16.63 4.61 32.03 12.05 45.66l-68.3 118.31c-12.55-11.61-23.96-24.59-33.68-39-4.79-7.1-13.97-9.62-21.38-5.33l-27.75 16.07c-7.85 4.54-10.63 14.9-5.64 22.47 15.57 23.64 34.69 44.21 55.98 62.02L0 439.66l7.02 58.25c1.28 10.59 12.36 16.99 22.17 12.8l53.95-23.04 70.8-122.63C186.13 377.28 220.62 384 256 384c99.05 0 190.88-51.01 243.5-134.14zM256 64c17.67 0 32 14.33 32 32s-14.33 32-32 32-32-14.33-32-32 14.33-32 32-32z" />
      </svg>
    );
  }
  return (
    <svg className={className} viewBox="0 0 512 512" fill="currentColor" aria-hidden="true">
      <path d="M256 8C119.043 8 8 119.083 8 256c0 136.997 111.043 248 248 248s248-111.003 248-248C504 119.083 392.957 8 256 8zm0 110c23.196 0 42 18.804 42 42s-18.804 42-42 42-42-18.804-42-42 18.804-42 42-42zm56 254c0 6.627-5.373 12-12 12h-88c-6.627 0-12-5.373-12-12v-24c0-6.627 5.373-12 12-12h12v-64h-12c-6.627 0-12-5.373-12-12v-24c0-6.627 5.373-12 12-12h64c6.627 0 12 5.373 12 12v100h12c6.627 0 12 5.373 12 12v24z" />
    </svg>
  );
}

function ServiceFlipCard({
  title,
  description,
  icon,
  imageSrc,
}: {
  title: string;
  description?: string;
  icon?: string;
  imageSrc?: string;
}) {
  return (
    <div className="aptus-flip-box aptus-flip-box--tall" tabIndex={0}>
      <div className="aptus-flip-box__inner">
        <div className="aptus-flip-box__face aptus-flip-box__front">
          <ServiceFlipIcon name={icon} />
          <h3>{title}</h3>
          {description && <p className="aptus-flip-box__front-desc">{description}</p>}
        </div>
        <div
          className="aptus-flip-box__face aptus-flip-box__back"
          style={imageSrc ? { backgroundImage: `url(${imageSrc})` } : undefined}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

export function Services({ data }: ServicesProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const useFlipCards = data.items?.some((item) => item.media?.src);

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
        const cards = cardsRef.current.querySelectorAll(".service-card, .aptus-flip-box");
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
    <section
      ref={sectionRef}
      className="section-padding bg-brand-light home-services"
      data-section="services"
    >
      <Container>
        {(data.eyebrow || data.heading || data.headingAccent) && (
          <div ref={headingRef} className="mb-12 text-center">
            {data.eyebrow && <p className="eyebrow mb-3">{data.eyebrow}</p>}
            {(data.heading || data.headingAccent) && (
              <h2 className="text-brand-navy" style={{ fontSize: 'var(--text-4xl)', fontWeight: 600 }}>
                {data.heading}
                {data.heading && data.headingAccent && " "}
                {data.headingAccent && (
                  <em className="font-semibold not-italic text-brand-blue">
                    <span className="italic">{data.headingAccent}</span>
                  </em>
                )}
              </h2>
            )}
            <span className="mx-auto mt-4 block h-1 w-14 rounded-full bg-brand-blue" />
          </div>
        )}

        {data.items && data.items.length > 0 && (
          <div
            ref={cardsRef}
            className={
              useFlipCards
                ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                : "grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            }
          >
            {data.items.map((item) =>
              useFlipCards ? (
                <ServiceFlipCard
                  key={item.id}
                  title={item.title ?? ""}
                  description={item.description}
                  icon={item.icon}
                  imageSrc={item.media?.src}
                />
              ) : (
                <article
                  key={item.id}
                  className="service-card flex flex-col items-center rounded-2xl border border-border bg-white px-6 py-8 text-center shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-md)]"
                >
                  <div className="mb-5 flex h-14 w-14 items-center justify-center text-brand-green">
                    <ServiceFlipIcon name={item.icon} />
                  </div>
                  {item.title && (
                    <h3 className="text-brand-blue" style={{ fontSize: 'var(--text-base)', fontWeight: 700 }}>{item.title}</h3>
                  )}
                  {item.description && (
                    <p className="mt-3 leading-relaxed text-muted-foreground" style={{ fontSize: 'var(--text-sm)' }}>
                      {item.description}
                    </p>
                  )}
                  {item.action && (
                    <Link
                      href={item.action.href}
                      className="mt-5 inline-flex items-center gap-1.5 text-brand-green hover:text-brand-green-dark"
                      style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}
                    >
                      {item.action.label}
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </Link>
                  )}
                </article>
              ),
            )}
          </div>
        )}
      </Container>
    </section>
  );
}
